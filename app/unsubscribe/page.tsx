import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Container } from '@/components/Container';
import { verifyUnsubscribeToken } from '@/lib/newsletter/token';
import { markUnsubscribed } from '@/lib/newsletter/store';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Unsubscribe',
  robots: { index: false },
};

type SearchParams = Promise<{ token?: string }>;

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { token } = await searchParams;
  const secret = process.env.NEWSLETTER_UNSUBSCRIBE_SECRET;

  let outcome: 'done' | 'invalid' | 'error' = 'invalid';
  let email = '';

  if (token && secret) {
    const payload = verifyUnsubscribeToken(token, secret);
    if (payload) {
      email = payload.email;
      try {
        await markUnsubscribed(payload.list, payload.email);
        outcome = 'done';
      } catch (err) {
        console.error('[newsletter] unsubscribe failed:', (err as Error).message);
        outcome = 'error';
      }
    }
  }

  return (
    <>
      <Header />
      <main>
        <section className="pt-20 pb-24 md:pt-28">
          <Container size="narrow">
            {outcome === 'done' && (
              <>
                <h1 className="font-heading text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
                  You&apos;re unsubscribed.
                </h1>
                <p className="text-lg text-foreground-muted leading-relaxed mb-8">
                  {email} won&apos;t get new-post emails anymore. No hard
                  feelings, the posts are always at{' '}
                  <Link href="/blog" className="text-primary font-semibold hover:text-primary-dark">
                    ciprianrarau.com/blog
                  </Link>
                  .
                </p>
                <p className="text-sm text-foreground-muted">
                  Changed your mind? Subscribe again from any post.
                </p>
              </>
            )}
            {outcome === 'invalid' && (
              <>
                <h1 className="font-heading text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
                  That link doesn&apos;t work.
                </h1>
                <p className="text-lg text-foreground-muted leading-relaxed">
                  The unsubscribe link is incomplete or expired. Reply to any
                  newsletter email and I&apos;ll take you off the list myself.
                </p>
              </>
            )}
            {outcome === 'error' && (
              <>
                <h1 className="font-heading text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
                  Something went wrong.
                </h1>
                <p className="text-lg text-foreground-muted leading-relaxed">
                  The unsubscribe didn&apos;t save. Try the link again in a
                  minute, or reply to any newsletter email and I&apos;ll remove
                  you myself.
                </p>
              </>
            )}
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
