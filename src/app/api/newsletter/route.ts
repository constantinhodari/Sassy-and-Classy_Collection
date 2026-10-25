import { route } from '@/lib/apiError';
import { saveNewsletterEmail } from '@/lib/dataStore';

/** Public: store a newsletter signup email in MongoDB. */
export const POST = route(async (request: Request) => {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const email = String(body.email ?? '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: 'Enter a valid email address.' }, { status: 400 });
  }
  await saveNewsletterEmail(email);
  return Response.json({ ok: true });
});
