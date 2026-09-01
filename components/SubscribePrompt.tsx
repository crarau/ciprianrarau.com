import { NewsletterForm } from './NewsletterForm';

/**
 * End-of-post subscribe box. The reader just finished an article; this is
 * the moment to offer the next one.
 */
export function SubscribePrompt({ source }: { source: string }) {
  return (
    <div className="mt-12 rounded-xl border border-border bg-surface p-8">
      <div className="flex items-center gap-3 mb-3 text-sm uppercase tracking-widest text-foreground-muted font-mono">
        <span className="inline-block h-px w-10 bg-secondary" />
        <span>Newsletter</span>
      </div>
      <h2 className="font-heading text-xl md:text-2xl font-extrabold tracking-tight mb-2">
        Get the next post by email
      </h2>
      <p className="text-foreground-muted mb-5 leading-relaxed text-sm md:text-base">
        One email when a post lands, from chip@ciprianrarau.com. No drip, no
        marketing, unsubscribe anytime.
      </p>
      <NewsletterForm source={`post-${source}`} />
    </div>
  );
}
