import { requireAdmin } from '@/lib/adminAuth';
import { route } from '@/lib/apiError';
import { cancelOrder, confirmOrder, getOrder, setOrderStatus } from '@/lib/dataStore';
import type { OrderStatus } from '@/types';

type Ctx = { params: Promise<{ id: string }> };

const STATUSES: OrderStatus[] = [
  'Pending Confirmation',
  'Confirmed',
  'Preparing',
  'Ready for Delivery',
  'Completed',
  'Cancelled',
];

/** Admin only: confirm, cancel, or move an order through its lifecycle. */
export const PATCH = route(async (request: Request, ctx: Ctx) => {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const action = String(body.action ?? '');
  const actor = String(body.actor ?? 'Admin');

  if (action === 'confirm') {
    const result = await confirmOrder(id, actor);
    if (!result.ok) return Response.json({ error: result.error }, { status: 409 });
    return Response.json({ order: result.order, products: result.products });
  }

  if (action === 'cancel') {
    const result = await cancelOrder(id, actor);
    if (!result.ok) return Response.json({ error: result.error }, { status: 409 });
    return Response.json({ order: result.order, products: result.products });
  }

  if (action === 'status') {
    const status = String(body.status ?? '') as OrderStatus;
    if (!STATUSES.includes(status)) {
      return Response.json({ error: 'Unknown order status.' }, { status: 400 });
    }
    const order = await setOrderStatus(id, status);
    if (!order) return Response.json({ error: 'Order not found.' }, { status: 404 });
    return Response.json({ order });
  }

  return Response.json({ error: 'Unsupported action.' }, { status: 400 });
});

/** Admin only: read a single order. */
export const GET = route(async (_request: Request, ctx: Ctx) => {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;
  const order = await getOrder(id);
  if (!order) return Response.json({ error: 'Order not found.' }, { status: 404 });
  return Response.json({ order });
});
