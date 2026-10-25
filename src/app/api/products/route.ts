import { requireAdmin } from '@/lib/adminAuth';
import { route } from '@/lib/apiError';
import { createProduct, listProducts } from '@/lib/dataStore';
import { validateProductInput } from '@/lib/productSchema';

/** Public: published products only. Admin (`?scope=all`): everything. */
export const GET = route(async (request: Request) => {
  const scope = new URL(request.url).searchParams.get('scope');
  if (scope === 'all') {
    const denied = await requireAdmin();
    if (denied) return denied;
    return Response.json({ products: await listProducts(true) });
  }
  return Response.json({ products: await listProducts(false) });
});

/** Admin only: create a product. */
export const POST = route(async (request: Request) => {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await request.json().catch(() => null);
  const validation = validateProductInput(body);
  if (!validation.ok || !validation.value) {
    return Response.json({ error: validation.errors.join(' '), errors: validation.errors }, { status: 400 });
  }
  const product = await createProduct(validation.value);
  return Response.json({ product }, { status: 201 });
});
