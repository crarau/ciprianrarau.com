import { afterEach, describe, expect, it, vi } from 'vitest';

const addSubscriber = vi.fn();
vi.mock('@/lib/newsletter/store', () => ({
  addSubscriber: (...args: unknown[]) => addSubscriber(...args),
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

  it('subscribes a valid email to the ciprianrarau list with its source', async () => {
    addSubscriber.mockResolvedValue(undefined);
    const res = await POST(request({ email: 'reader@example.com', source: 'post-my-slug' }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(addSubscriber).toHaveBeenCalledWith('ciprianrarau', 'reader@example.com', 'post-my-slug');
  });

  it('sanitizes the source field', async () => {
    addSubscriber.mockResolvedValue(undefined);
    await POST(request({ email: 'reader@example.com', source: '<script>x</script>' }));
    expect(addSubscriber).toHaveBeenCalledWith('ciprianrarau', 'reader@example.com', 'scriptxscript');
  });

  it('returns 502 when storage write fails', async () => {
    addSubscriber.mockRejectedValue(new Error('table down'));
    const res = await POST(request({ email: 'reader@example.com' }));
    expect(res.status).toBe(502);
  });
});
