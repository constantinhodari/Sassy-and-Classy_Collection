import { requireAdmin } from '@/lib/adminAuth';
import { route } from '@/lib/apiError';
import { importClientData, runServerMigration, type ClientMigrationPayload } from '@/lib/migration';

/**
 * Admin only, idempotent migration endpoint.
 *
 * - No body: ensures indexes and the starter catalogue exist.
 * - With a body: also imports legacy browser (localStorage) data. Existing
 *   MongoDB records are never overwritten or deleted.
 */
export const POST = route(async (request: Request) => {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = (await request.json().catch(() => null)) as ClientMigrationPayload | null;
  const report = await runServerMigration();
  const clientReport = body ? await importClientData(body) : null;

  return Response.json({ report, clientReport });
});
