import crypto from 'node:crypto';
import { cookies } from 'next/headers';

/**
 * Server-side administrator authorization.
 *
 * There is no user table: a single administrator password (ADMIN_PASSWORD) is
 * exchanged for a short-lived, HMAC-signed cookie. Every mutating route handler
 * calls `requireAdmin()` before touching the database or GridFS, so uploads and
 * deletes are never exposed without authorization.
 */

export const ADMIN_COOKIE_NAME = 'sc_admin_session';
export const ADMIN_SESSION_TTL_SECONDS = 60 * 60 * 12; // 12 hours

function sessionSecret(): string | null {
  const value = process.env.ADMIN_SESSION_SECRET?.trim();
  return value ? value : null;
}

/** Both a password and a signing secret must be present for admin to work. */
export function isAdminAuthConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD?.trim() && sessionSecret());
}

function sign(payload: string, key: string): string {
  return crypto.createHmac('sha256', key).update(payload).digest('base64url');
}

export function createSessionToken(
  ttlSeconds = ADMIN_SESSION_TTL_SECONDS
): { token: string; expiresAt: number } {
  const key = sessionSecret();
  if (!key) throw new Error('ADMIN_SESSION_SECRET is not configured.');
  const expiresAt = Date.now() + ttlSeconds * 1000;
  const payload = `v1.${expiresAt}`;
  return { token: `${payload}.${sign(payload, key)}`, expiresAt };
}

export function verifySessionToken(token: string | undefined): boolean {
  const key = sessionSecret();
  if (!key || !token) return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const [version, expiresRaw, signature] = parts;
  if (version !== 'v1') return false;
  const expiresAt = Number(expiresRaw);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return false;
  const expected = sign(`${version}.${expiresRaw}`, key);
  const provided = Buffer.from(signature, 'utf8');
  const wanted = Buffer.from(expected, 'utf8');
  if (provided.length !== wanted.length) return false;
  return crypto.timingSafeEqual(provided, wanted);
}

export function verifyAdminPassword(input: unknown): boolean {
  const expected = process.env.ADMIN_PASSWORD?.trim();
  if (!expected) return false;
  const provided = Buffer.from(String(input ?? ''), 'utf8');
  const wanted = Buffer.from(expected, 'utf8');
  if (provided.length !== wanted.length) return false;
  return crypto.timingSafeEqual(provided, wanted);
}

/** True when the current request carries a valid admin session cookie. */
export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  return verifySessionToken(store.get(ADMIN_COOKIE_NAME)?.value);
}

/**
 * Returns a 401 JSON response when the caller is not an authenticated admin,
 * or `null` when the request may proceed.
 */
export async function requireAdmin(): Promise<Response | null> {
  if (!isAdminAuthConfigured()) {
    return Response.json(
      {
        error:
          'Administrator access is not configured on the server. Set ADMIN_PASSWORD and ADMIN_SESSION_SECRET in .env.local.',
        code: 'ADMIN_NOT_CONFIGURED',
      },
      { status: 503 }
    );
  }
  if (!(await isAdmin())) {
    return Response.json(
      { error: 'Administrator sign-in required.', code: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }
  return null;
}
