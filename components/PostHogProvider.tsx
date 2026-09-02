'use client';

import posthog from 'posthog-js';
import { PostHogProvider as PHProvider, usePostHog } from 'posthog-js/react';
import { useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

// Same PostHog project as the rest of the portfolio; this site reports as
// app "ciprianrarau" (the public project key, safe to ship client-side).
const POSTHOG_KEY =
  process.env.NEXT_PUBLIC_POSTHOG_KEY || 'phc_REr8yvSNak9ePrzkQmEJlC1JSMxZLME1QhXntAplPh7';

function getEnvironment(): string {
  if (typeof window === 'undefined') return 'unknown';
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') return 'local';
  return 'production';
}

if (typeof window !== 'undefined') {
  posthog.init(POSTHOG_KEY, {
    api_host: 'https://us.i.posthog.com',
    capture_pageview: false,
    capture_pageleave: true,
    loaded: (ph) => {
      ph.register({
        environment: getEnvironment(),
        // Renamed from 'ciprianrarau' on 2026-09-02; rows before then carry
        // the old name.
        app: 'ciprianrarau.com',
      });
    },
  });
}

function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const posthogClient = usePostHog();

  useEffect(() => {
    if (pathname && posthogClient) {
      let url = window.origin + pathname;
      if (searchParams.toString()) {
        url = url + '?' + searchParams.toString();
      }
      posthogClient.capture('$pageview', { $current_url: url });
    }
  }, [pathname, searchParams, posthogClient]);

  return null;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      {children}
    </PHProvider>
  );
}
