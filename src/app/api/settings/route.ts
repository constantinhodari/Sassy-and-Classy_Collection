import { requireAdmin } from '@/lib/adminAuth';
import { route } from '@/lib/apiError';
import { getStoreSettings, saveStoreSettings } from '@/lib/dataStore';
import { DEFAULT_SETTINGS } from '@/lib/settings';
import type { StoreSettings } from '@/types';

/** Public: storefront needs the WhatsApp/Instagram/delivery settings. */
export const GET = route(async () => {
  return Response.json({ settings: await getStoreSettings() });
});

/** Admin only: persist store settings. */
export const PUT = route(async (request: Request) => {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = (await request.json().catch(() => null)) as Partial<StoreSettings> | null;
  if (!body || typeof body !== 'object') {
    return Response.json({ error: 'A settings object is required.' }, { status: 400 });
  }

  const settings: StoreSettings = {
    ...DEFAULT_SETTINGS,
    ...body,
    deliveryFee: Number(body.deliveryFee ?? DEFAULT_SETTINGS.deliveryFee) || 0,
    freeDeliveryThreshold:
      Number(body.freeDeliveryThreshold ?? DEFAULT_SETTINGS.freeDeliveryThreshold) || 0,
  };

  await saveStoreSettings(settings);
  return Response.json({ settings });
});
