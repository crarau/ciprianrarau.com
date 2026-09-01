import { afterEach, describe, expect, it, vi } from 'vitest';

const addSubscriber = vi.fn();
vi.mock('@/lib/newsletter/store', () => ({
  addSubscriber: (...args: unknown[]) => addSubscriber(...args),
}));

const notifyNewSubscriber = vi.fn();
vi.mock('@/lib/newsletter/notify', () => ({
  notifyNewSubscriber: (...args: unknown[]) => notifyNewSubscriber(...args),
}));

import { POST } from '../../app/api/subscribe/route';

function request(body: unknown): Request {
  return new Request('http://localhost/api/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

afterEach(() => {
  addSubscriber.mockReset();
  notifyNewSubscriber.mockReset();
});

describe('POST /api/subscribe', () => {
  it('rejects invalid JSON with 400', async () => {
    const res = await POST(request('{not json'));
    expect(res.status).toBe(400);
    expect(addSubscriber).not.toHaveBeenCalled();
  });

  it('rejects a missing or malformed email with 400', async () => {
    expect((await POST(request({}))).status).toBe(400);
    expect((await POST(request({ email: 'nope' }))).status).toBe(400);
    expect(addSubscriber).not.toHaveBeenCalled();
  });

  it('returns fake success on honeypot hit without writing', async () => {
    const res = await POST(request({ email: 'a@b.com', website: 'spam.example' }));
    expect(res.status).toBe(200);
    expect(addSubscriber).not.toHaveBeenCalled();
  });

  it('subscribes a valid email and notifies Discord for a new subscriber', async () => {
    addSubscriber.mockResolvedValue(true);
    const res = await POST(request({ email: 'reader@example.com', source: 'post-my-slug' }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(addSubscriber).toHaveBeenCalledWith('ciprianrarau', 'reader@example.com', 'post-my-slug');
    expect(notifyNewSubscriber).toHaveBeenCalledWith('ciprianrarau', 'reader@example.com', 'post-my-slug');
  });

  it('stays quiet on a repeat signup of an active subscriber', async () => {
    addSubscriber.mockResolvedValue(false);
    const res = await POST(request({ email: 'reader@example.com' }));
    expect(res.status).toBe(200);
    expect(notifyNewSubscriber).not.toHaveBeenCalled();
  });

  it('sanitizes the source field', async () => {
    addSubscriber.mockResolvedValue(true);
    await POST(request({ email: 'reader@example.com', source: '<script>x</script>' }));
    expect(addSubscriber).toHaveBeenCalledWith('ciprianrarau', 'reader@example.com', 'scriptxscript');
  });

  it('returns 502 when storage write fails', async () => {
    addSubscriber.mockRejectedValue(new Error('table down'));
    const res = await POST(request({ email: 'reader@example.com' }));
    expect(res.status).toBe(502);
  });
});
