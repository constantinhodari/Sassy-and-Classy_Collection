import { requireAdmin } from '@/lib/adminAuth';
import { route } from '@/lib/apiError';
import { listMovements } from '@/lib/dataStore';

/** Admin only: inventory movement log. */
export const GET = route(async (request: Request) => {
  const denied = await requireAdmin();
  if (denied) return denied;
  const limit = Number(new URL(request.url).searchParams.get('limit')) || 200;
  return Response.json({ movements: await listMovements(Math.min(Math.max(limit, 1), 500)) });
});
