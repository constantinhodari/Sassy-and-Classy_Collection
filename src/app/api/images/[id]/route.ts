import { Readable } from 'node:stream';
import { requireAdmin, isAdmin } from '@/lib/adminAuth';
import { route } from '@/lib/apiError';
import { COLLECTIONS, getDb } from '@/lib/mongodb';
import { openImageStream, storedContentType } from '@/lib/imageStore';
import { ALLOWED_IMAGE_MIME_TYPES } from '@/lib/imageValidation';

type Ctx = { params: Promise<{ id: string }> };

/**
 * Public image delivery endpoint for GridFS uploads.
 *
 * - Only images referenced by a *published* product are public.
 * - Draft/unattached images require an admin session.
 * - Responses are pinned to a known image MIME type and sandboxed so a stored
 *   file can never be interpreted as HTML or JavaScript.
 */
export const GET = route(async (_request: Request, ctx: Ctx) => {
  const { id } = await ctx.params;

  const opened = await openImageStream(id);
  if (!opened) return new Response('Not found', { status: 404 });

  const db = await getDb();
  const referencing = await db
    .collection(COLLECTIONS.products)
    .findOne({ 'images.fileId': id }, { projection: { published: 1 } });

  const requiresAdmin = !referencing || referencing.published !== true;
  if (requiresAdmin) {
    const denied = await requireAdmin();
    if (denied) return new Response('Not found', { status: 404 });
  }

  const contentType = storedContentType(opened.file);
  const safeType = (ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(contentType)
    ? contentType
    : 'application/octet-stream';

  const body = Readable.toWeb(opened.stream) as unknown as ReadableStream<Uint8Array>;

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': safeType,
      'Content-Length': String(opened.file.length),
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; sandbox",
      'Content-Disposition': `inline; filename="${opened.file.filename.replace(/"/g, '')}"`,
    },
  });
});

/** HEAD support keeps image probes cheap for browsers and CDNs. */
export const HEAD = route(async (_request: Request, ctx: Ctx) => {
  const { id } = await ctx.params;
  const opened = await openImageStream(id);
  if (!opened) return new Response(null, { status: 404 });
  const referencing = await (await getDb())
    .collection(COLLECTIONS.products)
    .findOne({ 'images.fileId': id }, { projection: { published: 1 } });
  if ((!referencing || referencing.published !== true) && !(await isAdmin())) {
    return new Response(null, { status: 404 });
  }
  const stored = storedContentType(opened.file);
  const contentType = (ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(stored)
    ? stored
    : 'application/octet-stream';
  opened.stream.destroy();
  return new Response(null, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Length': String(opened.file.length),
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  });
});
