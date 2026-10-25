import { requireAdmin } from '@/lib/adminAuth';
import { route } from '@/lib/apiError';
import {
  addStock,
  deleteProduct,
  getProduct,
  recordMovement,
  setProductPublished,
  setStock,
  updateProduct,
} from '@/lib/dataStore';
import { deleteImageIfUnreferenced } from '@/lib/imageStore';
import { validateProductInput } from '@/lib/productSchema';

type Ctx = { params: Promise<{ id: string }> };

/** Public single product (admin may view unpublished ones). */
export const GET = route(async (request: Request, ctx: Ctx) => {
  const { id } = await ctx.params;
  const product = await getProduct(id);
  if (!product) return Response.json({ error: 'Product not found.' }, { status: 404 });
  if (product.published === false) {
    const denied = await requireAdmin();
    if (denied) return Response.json({ error: 'Product not found.' }, { status: 404 });
  }
  return Response.json({ product });
});

/** Admin only: full update. Removed uploads are garbage-collected. */
export const PUT = route(async (request: Request, ctx: Ctx) => {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;

  const existing = await getProduct(id);
  if (!existing) return Response.json({ error: 'Product not found.' }, { status: 404 });

  const body = await request.json().catch(() => null);
  const validation = validateProductInput(body);
  if (!validation.ok || !validation.value) {
    return Response.json({ error: validation.errors.join(' '), errors: validation.errors }, { status: 400 });
  }

  const updated = await updateProduct(id, validation.value);
  if (!updated) return Response.json({ error: 'Product not found.' }, { status: 404 });

  // Delete GridFS files that this product no longer references.
  const keptIds = new Set(
    updated.images.filter((image) => image.source === 'upload').map((image) => image.fileId)
  );
  for (const image of existing.images) {
    if (image.source === 'upload' && !keptIds.has(image.fileId)) {
      await deleteImageIfUnreferenced(image.fileId);
    }
  }

  return Response.json({ product: updated });
});

/** Admin only: publish / archive, or adjust stock. */
export const PATCH = route(async (request: Request, ctx: Ctx) => {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const action = String(body.action ?? '');

  if (action === 'publish') {
    const product = await setProductPublished(id, Boolean(body.published));
    if (!product) return Response.json({ error: 'Product not found.' }, { status: 404 });
    return Response.json({ product });
  }

  if (action === 'stock') {
    const reason = String(body.reason ?? '').trim() || 'Manual adjustment';
    const actor = String(body.actor ?? 'Admin');
    const existing = await getProduct(id);
    if (!existing) return Response.json({ error: 'Product not found.' }, { status: 404 });

    let product;
    if (body.stock !== undefined) {
      const target = Number(body.stock);
      if (!Number.isInteger(target) || target < 0) {
        return Response.json({ error: 'Stock must be a whole number of zero or more.' }, { status: 400 });
      }
      product = await setStock(id, target);
      if (product) {
        await recordMovement({
          productId: product.id,
          sku: product.sku,
          productName: product.name,
          previousQty: existing.stock,
          change: target - existing.stock,
          newQty: product.stock,
          reason,
          note: '',
          actor,
        });
      }
    } else {
      const delta = Number(body.delta);
      if (!Number.isInteger(delta) || delta === 0) {
        return Response.json({ error: 'Enter a whole-number adjustment, such as +5 or -2.' }, { status: 400 });
      }
      product = await addStock(id, delta);
      if (product) {
        await recordMovement({
          productId: product.id,
          sku: product.sku,
          productName: product.name,
          previousQty: existing.stock,
          change: delta,
          newQty: product.stock,
          reason,
          note: '',
          actor,
        });
      }
    }
    if (!product) return Response.json({ error: 'Product not found.' }, { status: 404 });
    return Response.json({ product });
  }

  return Response.json({ error: 'Unsupported action.' }, { status: 400 });
});

/** Admin only: delete a product, then clean up unreferenced uploads. */
export const DELETE = route(async (_request: Request, ctx: Ctx) => {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;

  const removed = await deleteProduct(id);
  if (!removed) return Response.json({ error: 'Product not found.' }, { status: 404 });

  for (const image of removed.images) {
    if (image.source === 'upload') await deleteImageIfUnreferenced(image.fileId);
  }
  return Response.json({ ok: true, product: removed });
});
