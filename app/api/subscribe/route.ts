/**
 * Newsletter signup. Writes to our own subscriber list in Azure Table
 * Storage (lib/newsletter/store.ts); no third-party audience. The `website`
 * field is a honeypot, same trick as the contact form: humans never see it,
 * bots fill it, and a hit gets a fake success without touching storage.
 */

import { addSubscriber } from '@/lib/newsletter/store';

export const runtime = 'nodejs';

type Body = { email?: string; source?: string; website?: string };

export async function POST(req: Request): Promise<Response> {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  if (body.website) {
    return json({ ok: true }, 200);
  }

  const email = (body.email ?? '').trim();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: 'Valid email is required' }, 400);
  }

  const source = (body.source ?? 'site').slice(0, 64).replace(/[^\w.-]/g, '');

  try {
    await addSubscriber('ciprianrarau', email, source || 'site');
  } catch (err) {
    console.error('[newsletter] subscribe failed:', (err as Error).message);
    return json({ error: 'Subscription failed. Try again in a moment.' }, 502);
  }

  return json({ ok: true }, 200);
}

function json(data: unknown, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
