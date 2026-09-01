'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { NewsletterForm, SUBSCRIBED_FLAG } from './NewsletterForm';

const DISMISSED_UNTIL = 'newsletter-popup-dismissed-until';
const SHOW_AFTER_MS = 8000;
const DISMISS_DAYS = 30;

function shouldShow(): boolean {
  try {
    if (localStorage.getItem(SUBSCRIBED_FLAG)) return false;
    const until = localStorage.getItem(DISMISSED_UNTIL);
    if (until && Date.now() < Number(until)) return false;
    return true;
  } catch {
    return false;
  }
}

function rememberDismissed() {
  try {
    localStorage.setItem(
      DISMISSED_UNTIL,
      String(Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000),
    );
  } catch {
    // storage unavailable; worst case we ask again next visit
  }
}

/**
 * The reading nudge: a slide-in card that appears after a few seconds on a
 * blog post. Subscribing or dismissing it writes localStorage so it never
 * nags the same reader twice (dismissal expires after 30 days; a
 * subscription silences it for good).
 */
export function SubscribePopup({ source }: { source: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!shouldShow()) return;
    const timer = setTimeout(() => setOpen(true), SHOW_AFTER_MS);
    return () => clearTimeout(timer);
  }, []);

  if (!open) return null;

  function close() {
    rememberDismissed();
    setOpen(false);
  }

  function closeAfterSubscribe() {
    setTimeout(() => setOpen(false), 2500);
  }

  return (
    <div
      role="dialog"
      aria-label="Subscribe to the newsletter"
      className="fixed bottom-4 right-4 left-4 sm:left-auto sm:w-[26rem] z-50 rounded-xl border border-border bg-surface shadow-xl p-6 animate-[popup-in_0.3s_ease-out]"
    >
      <button
        type="button"
        onClick={close}
        aria-label="Dismiss"
        className="absolute top-3 right-3 p-1 text-foreground-muted hover:text-foreground transition-colors"
      >
        <X size={16} strokeWidth={2.5} />
      </button>
      <h2 className="font-heading text-lg font-extrabold tracking-tight mb-1.5 pr-6">
        Get the next post by email
      </h2>
      <p className="text-sm text-foreground-muted leading-relaxed mb-4">
        One email when a post lands. No drip, no marketing, unsubscribe
        anytime.
      </p>
      <NewsletterForm source={`popup-${source}`} onSuccess={closeAfterSubscribe} />
    </div>
  );
}
