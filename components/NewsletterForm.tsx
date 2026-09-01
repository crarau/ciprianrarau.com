'use client';

import { useState } from 'react';

type Status = 'idle' | 'submitting' | 'success' | 'error';

export const SUBSCRIBED_FLAG = 'newsletter-subscribed';

function rememberSubscribed() {
  try {
    localStorage.setItem(SUBSCRIBED_FLAG, new Date().toISOString());
  } catch {
    // storage unavailable (private mode); the flag is a convenience only
  }
}

export function NewsletterForm({
  source = 'site',
  onSuccess,
}: {
  source?: string;
  onSuccess?: () => void;
}) {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('submitting');
    setError(null);
    const fd = new FormData(event.currentTarget);
    const email = String(fd.get('email') ?? '').trim();
    const website = String(fd.get('website') ?? '');
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source, website }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Request failed (${res.status})`);
      }
      setStatus('success');
      rememberSubscribed();
      (event.target as HTMLFormElement).reset();
      onSuccess?.();
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Something went wrong');
    }
  }

  if (status === 'success') {
    return (
      <p className="text-success font-semibold">Subscribed. See you in the inbox.</p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-3">
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />
      <input
        type="email"
        name="email"
        required
        autoComplete="email"
        placeholder="you@example.com"
        className="flex-1 px-4 py-3 bg-background border border-border rounded-md text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
      />
      <button
        type="submit"
        disabled={status === 'submitting'}
        className="px-5 py-3 bg-primary text-primary-foreground text-sm font-semibold rounded-md hover:bg-primary-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
      >
        {status === 'submitting' ? 'Subscribing…' : 'Subscribe'}
      </button>
      {error && (
        <p className="text-sm text-error sm:basis-full">{error}</p>
      )}
    </form>
  );
}
