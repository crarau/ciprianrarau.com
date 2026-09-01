'use client';

import { useEffect } from 'react';
import posthog from 'posthog-js';

/**
 * Measures how long a post is actually read. Counts only the time the tab
 * is visible, tracks the deepest scroll, and captures a `blog_read` event
 * whenever the reader leaves (tab hidden or page unloaded), via sendBeacon
 * so the event survives navigation. A reader who returns to the tab
 * produces further events with growing totals under the same read_id, so
 * analysis takes the max seconds per read_id.
 */
export function BlogReadTracker({ slug }: { slug: string }) {
  useEffect(() => {
    const readId = Math.random().toString(36).slice(2);
    let visibleMs = 0;
    let visibleSince: number | null =
      document.visibilityState === 'visible' ? Date.now() : null;
    let maxScrollPct = 0;

    function onScroll() {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      if (scrollable > 0) {
        maxScrollPct = Math.max(
          maxScrollPct,
          Math.min(100, Math.round((window.scrollY / scrollable) * 100)),
        );
      }
    }

    function flushVisible() {
      if (visibleSince !== null) {
        visibleMs += Date.now() - visibleSince;
        visibleSince = null;
      }
    }

    function send() {
      const seconds = Math.round(visibleMs / 1000);
      if (seconds < 3) return;
      posthog.capture(
        'blog_read',
        { slug, seconds, scroll_pct: maxScrollPct, read_id: readId },
        { transport: 'sendBeacon' },
      );
    }

    function onVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        flushVisible();
        send();
      } else {
        visibleSince = Date.now();
      }
    }

    function onPageHide() {
      flushVisible();
      send();
    }

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pagehide', onPageHide);
    return () => {
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pagehide', onPageHide);
    };
  }, [slug]);

  return null;
}
