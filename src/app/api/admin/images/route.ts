import { requireAdmin } from '@/lib/adminAuth';
import { route } from '@/lib/apiError';
import { saveProductImage } from '@/lib/imageStore';
import { maxImageBytes } from '@/lib/imageValidation';

/**
 * Admin only: upload a product image into MongoDB GridFS.
 *
 * The file is validated on the server by inspecting its bytes — the filename
 * and the browser-supplied MIME type are never trusted.
 */
export const POST = route(async (request: Request) => {
  const denied = await requireAdmin();
  if (denied) return denied;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: 'Expected a multipart/form-data upload.' }, { status: 400 });
  }

  const file = form.get('file');
  if (!(file instanceof File)) {
    return Response.json({ error: 'No image file was included in the upload.' }, { status: 400 });
  }

  const limit = maxImageBytes();
  if (file.size > limit) {
    return Response.json(
      {
        error: `Image is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). The limit is ${(
          limit / 1024 / 1024
        ).toFixed(1)} MB per image.`,
      },
      { status: 413 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const altField = form.get('alt');
  const stored = await saveProductImage(buffer, {
    filename: file.name,
    alt: typeof altField === 'string' ? altField : '',
  });

  return Response.json({
    image: {
      source: 'upload' as const,
      fileId: stored.fileId,
      url: stored.url,
      alt: typeof altField === 'string' ? altField : '',
    },
    meta: {
      filename: stored.filename,
      contentType: stored.contentType,
      size: stored.size,
      uploadedAt: stored.uploadedAt,
    },
  });
});
