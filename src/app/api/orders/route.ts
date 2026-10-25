import { requireAdmin } from '@/lib/adminAuth';
import { route } from '@/lib/apiError';
import { createOrder, listOrders } from '@/lib/dataStore';
import type { SocialOrder } from '@/types';

/** Admin only: list all recorded social orders. */
export const GET = route(async () => {
  const denied = await requireAdmin();
  if (denied) return denied;
  return Response.json({ orders: await listOrders() });
});

/** Admin only: record a social order (stock is not touched until confirmed). */
export const POST = route(async (request: Request) => {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = (await request.json().catch(() => null)) as Partial<SocialOrder> | null;
  if (!body || !body.id || !Array.isArray(body.items) || body.items.length === 0) {
    return Response.json({ error: 'A valid order id and at least one item are required.' }, { status: 400 });
  }
  if (body.status !== 'Pending Confirmation') {
    return Response.json({ error: 'New orders must start as "Pending Confirmation".' }, { status: 400 });
  }

  const order: SocialOrder = {
    ...(body as SocialOrder),
    stockAdjusted: false,
    createdAt: body.createdAt || new Date().toISOString(),
  };
  await createOrder(order);
  return Response.json({ order }, { status: 201 });
});
