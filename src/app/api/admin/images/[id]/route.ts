import { requireAdmin } from '@/lib/adminAuth';
import { route } from '@/lib/apiError';
import { countImageReferences, deleteImageFile } from '@/lib/imageStore';

type Ctx = { params: Promise<{ id: string }> };

/**
 * Admin only: delete an uploaded image.
 * The GridFS file is only removed when no product still references it.
 */
export const DELETE = route(async (request: Request, ctx: Ctx) => {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;

  const force = new URL(request.url).searchParams.get('force') === 'true';
  const references = await countImageReferences(id);
  if (references > 0 && !force) {
    return Response.json(
      {
        ok: false,
        deleted: false,
        references,
        error: `This image is still used by ${references} product${references === 1 ? '' : 's'}. Remove it from those products first.`,
      },
      { status: 409 }
    );
  }

  const deleted = await deleteImageFile(id);
  return Response.json({ ok: true, deleted });
});
