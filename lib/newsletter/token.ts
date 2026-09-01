/**
 * Unsubscribe tokens. Every newsletter email carries a per-recipient link
 * to /unsubscribe?token=..., where the token is an HMAC-signed (list, email)
 * pair. Signing means the link works with no login and no database lookup,
 * and nobody can unsubscribe an address they don't have the token for.
 */

import crypto from 'node:crypto';

export interface UnsubscribePayload {
  list: string;
  email: string;
}

export function signUnsubscribeToken(
  list: string,
  email: string,
  secret: string,
): string {
  const payload = Buffer.from(`${list}\n${email.trim().toLowerCase()}`, 'utf8');
  const mac = crypto.createHmac('sha256', secret).update(payload).digest();
  return `${payload.toString('base64url')}.${mac.toString('base64url')}`;
}

export function verifyUnsubscribeToken(
  token: string,
  secret: string,
): UnsubscribePayload | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  let payload: Buffer;
  let mac: Buffer;
  try {
    payload = Buffer.from(parts[0], 'base64url');
    mac = Buffer.from(parts[1], 'base64url');
  } catch {
    return null;
  }
  const expected = crypto.createHmac('sha256', secret).update(payload).digest();
  if (mac.length !== expected.length || !crypto.timingSafeEqual(mac, expected)) {
    return null;
  }
  const text = payload.toString('utf8');
  const separator = text.indexOf('\n');
  if (separator <= 0) return null;
  const list = text.slice(0, separator);
  const email = text.slice(separator + 1);
  if (!list || !email.includes('@')) return null;
  return { list, email };
}
