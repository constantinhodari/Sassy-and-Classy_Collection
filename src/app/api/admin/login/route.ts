import { NextResponse } from 'next/server';
import {
  ADMIN_COOKIE_NAME,
  ADMIN_SESSION_TTL_SECONDS,
  createSessionToken,
  isAdminAuthConfigured,
  verifyAdminPassword,
} from '@/lib/adminAuth';
import { isMongoConfigured } from '@/lib/mongodb';

/** Exchange the administrator password for a signed session cookie. */
export async function POST(request: Request) {
  if (!isMongoConfigured()) {
    return NextResponse.json(
      { error: 'MongoDB is not configured yet. Add MONGODB_URI to .env.local first.' },
      { status: 503 }
    );
  }
  if (!isAdminAuthConfigured()) {
    return NextResponse.json(
      {
        error:
          'Administrator access is not configured. Set ADMIN_PASSWORD and ADMIN_SESSION_SECRET in .env.local.',
        code: 'ADMIN_NOT_CONFIGURED',
      },
      { status: 503 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  if (!verifyAdminPassword(body.password)) {
    return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 });
  }

  const { token, expiresAt } = createSessionToken();
  const response = NextResponse.json({ ok: true, expiresAt });
  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: ADMIN_SESSION_TTL_SECONDS,
  });
  return response;
}
