import { afterEach, describe, expect, it, vi } from 'vitest';
import { POST } from '../../app/api/contact/route';

const VALID_BODY = {
  name: 'Jane Doe',
  email: 'jane@example.com',
  message: 'Hello, I want to compare notes.',
};

function request(body: unknown): Request {
  return new Request('http://localhost/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

function mockResend(status = 200, data: unknown = { id: 'email_123' }) {
  const mock = vi.fn().mockResolvedValue(
    new Response(JSON.stringify(data), { status }),
  );
  vi.stubGlobal('fetch', mock);
  return mock;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('POST /api/contact', () => {
  it('rejects invalid JSON with 400', async () => {
    const res = await POST(request('{not json'));
    expect(res.status).toBe(400);
  });

  it('returns fake success on honeypot hit without contacting Resend', async () => {
    const fetchMock = mockResend();
    const res = await POST(request({ ...VALID_BODY, website: 'spam.example' }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    ['name', { ...VALID_BODY, name: '  ' }],
    ['email', { ...VALID_BODY, email: '' }],
    ['message', { ...VALID_BODY, message: '' }],
  ])('rejects missing %s with 400', async (_field, body) => {
    const res = await POST(request(body));
    expect(res.status).toBe(400);
  });

  it('rejects an invalid email with 400', async () => {
    const res = await POST(request({ ...VALID_BODY, email: 'not-an-email' }));
    expect(res.status).toBe(400);
  });

  it('rejects a message over 5000 chars with 400', async () => {
    const res = await POST(
      request({ ...VALID_BODY, message: 'x'.repeat(5001) }),
    );
    expect(res.status).toBe(400);
  });

  it('returns 500 when RESEND_API_KEY is not set', async () => {
    vi.stubEnv('RESEND_API_KEY', '');
    const res = await POST(request(VALID_BODY));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'Mail service not configured' });
  });

  it('sends through Resend from the verified ideaplaces.com domain by default', async () => {
    vi.stubEnv('RESEND_API_KEY', 're_test_key');
    vi.stubEnv('RESEND_FROM', undefined);
    vi.stubEnv('RECIPIENT_EMAIL', undefined);
    const fetchMock = mockResend();

    const res = await POST(request(VALID_BODY));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.resend.com/emails');
    expect(init.headers.Authorization).toBe('Bearer re_test_key');

    const payload = JSON.parse(init.body);
    // The Resend account's only verified domain is ideaplaces.com. A default
    // sender on any other domain gets a 403 and breaks the form in prod.
    expect(payload.from).toBe('Ciprian Rarau <noreply@ideaplaces.com>');
    expect(payload.to).toBe('chip@ideaplaces.com');
    expect(payload.reply_to).toBe(VALID_BODY.email);
    expect(payload.subject).toBe('New contact form message from Jane Doe');
    expect(payload.text).toContain(VALID_BODY.message);
  });

  it('honors RESEND_FROM and RECIPIENT_EMAIL overrides', async () => {
    vi.stubEnv('RESEND_API_KEY', 're_test_key');
    vi.stubEnv('RESEND_FROM', 'Custom <custom@ideaplaces.com>');
    vi.stubEnv('RECIPIENT_EMAIL', 'other@ideaplaces.com');
    const fetchMock = mockResend();

    await POST(request(VALID_BODY));

    const payload = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(payload.from).toBe('Custom <custom@ideaplaces.com>');
    expect(payload.to).toBe('other@ideaplaces.com');
  });

  it('escapes HTML in the rendered email body', async () => {
    vi.stubEnv('RESEND_API_KEY', 're_test_key');
    const fetchMock = mockResend();

    await POST(
      request({ ...VALID_BODY, message: '<script>alert("x")</script>' }),
    );

    const payload = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(payload.html).toContain('&lt;script&gt;');
    expect(payload.html).not.toContain('<script>');
  });

  it('returns 502 when Resend rejects the send', async () => {
    vi.stubEnv('RESEND_API_KEY', 're_test_key');
    mockResend(403, {
      name: 'validation_error',
      message: 'The domain is not verified.',
    });

    const res = await POST(request(VALID_BODY));
    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({
      error: 'Could not send message right now',
    });
  });
});
