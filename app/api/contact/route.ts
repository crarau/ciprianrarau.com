export const runtime = 'nodejs';

type Body = {
  name?: string;
  email?: string;
  message?: string;
  website?: string;
};

const MAX_LEN = 5000;

export async function POST(req: Request): Promise<Response> {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  // Honeypot: any value here means it's a bot. Pretend success.
  if (body.website && body.website.trim() !== '') {
    return json({ ok: true }, 200);
  }

  const name = (body.name ?? '').trim();
  const email = (body.email ?? '').trim();
  const message = (body.message ?? '').trim();

  if (!name || !email || !message) {
    return json({ error: 'name, email, and message are required' }, 400);
  }
  if (message.length > MAX_LEN) {
    return json({ error: 'message is too long' }, 400);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: 'invalid email' }, 400);
  }

  const apiKey = process.env.RESEND_API_KEY;
  const recipient = process.env.RECIPIENT_EMAIL ?? 'chip@ideaplaces.com';
  // Default must stay on a Resend-verified domain. The account's single
  // verified domain is ideaplaces.com; sending from ciprianrarau.com gets a
  // 403 validation_error and the form breaks (June 2026 incident).
  const from = process.env.RESEND_FROM ?? 'Ciprian Rarau <noreply@ideaplaces.com>';
  if (!apiKey) {
    console.error('RESEND_API_KEY missing');
    return json({ error: 'Mail service not configured' }, 500);
  }

  const subject = `New contact form message from ${name}`;
  const text = `From: ${name} <${email}>\n\n${message}`;
  const html = `<p><strong>From:</strong> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p><pre style="white-space:pre-wrap;font-family:inherit">${escapeHtml(message)}</pre>`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to: recipient, reply_to: email, subject, text, html }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    console.error('Resend error', res.status, data);
    return json({ error: 'Could not send message right now' }, 502);
  }

  return json({ ok: true }, 200);
}

function json(data: unknown, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
