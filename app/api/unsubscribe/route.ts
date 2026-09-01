/**
 * One-click unsubscribe (RFC 8058). Newsletter emails carry
 * List-Unsubscribe / List-Unsubscribe-Post headers pointing here, so
 * Gmail's "Unsubscribe" button works without the recipient ever seeing a
 * page. The human-visible link in the footer goes to /unsubscribe instead.
 */

import { verifyUnsubscribeToken } from '@/lib/newsletter/token';
import { markUnsubscribed } from '@/lib/newsletter/store';

export const runtime = 'nodejs';

export async function POST(req: Request): Promise<Response> {
  const secret = process.env.NEWSLETTER_UNSUBSCRIBE_SECRET;
  if (!secret) {
    console.error('NEWSLETTER_UNSUBSCRIBE_SECRET missing');
    return new Response('Not configured', { status: 500 });
  }

  const token = new URL(req.url).searchParams.get('token') ?? '';
  const payload = verifyUnsubscribeToken(token, secret);
  if (!payload) {
    return new Response('Invalid token', { status: 400 });
  }

  try {
    await markUnsubscribed(payload.list, payload.email);
  } catch (err) {
    console.error('[newsletter] unsubscribe failed:', (err as Error).message);
    return new Response('Try again later', { status: 502 });
  }

  return new Response('Unsubscribed', { status: 200 });
}
