import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Container } from '@/components/Container';
import { Section } from '@/components/Section';
import { Button } from '@/components/Button';
import { CatalogProductCard } from '@/components/CatalogProductCard';
import { CompanyCard } from '@/components/CompanyCard';
import { TrackRecordItem } from '@/components/TrackRecordItem';
import { ProjectCarousel } from '@/components/ProjectCarousel';
import { PostCard } from '@/components/PostCard';
import { NewsletterForm } from '@/components/NewsletterForm';
import { fetchAllCatalogs } from '@/lib/catalog/fetcher';
import { ACTIVE_COMPANIES } from '@/lib/data/companies';
import { TRACK_RECORD } from '@/lib/data/track-record';
import { getRecentPosts } from '@/lib/blog';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <ProductsInMotion />
        <BlogTeaser />
        <Companies />
        <Portfolio />
        <TrackRecord />
        <Newsletter />
      </main>
      <Footer />
    </>
  );
}

function Hero() {
  return (
    <section className="pt-20 pb-24 md:pt-28 md:pb-32">
      <Container>
        <div className="grid gap-10 md:gap-16 md:grid-cols-[1fr_auto] md:items-center">
          <div className="order-2 md:order-1">
            <div className="flex items-center gap-3 mb-8 text-sm uppercase tracking-widest text-foreground-muted font-mono">
              <span className="inline-block h-px w-10 bg-secondary" />
              <span>Ciprian (Chip) Rarau · Founder</span>
            </div>
            <h1 className="font-heading text-5xl md:text-7xl font-extrabold leading-[1.05] tracking-tight mb-8">
              I run a portfolio of products.
            </h1>
            <p className="text-xl md:text-2xl leading-relaxed text-foreground-muted max-w-2xl mb-10">
              Across my own ventures and the companies I build with, the same problems keep
              showing up. Three instances of the same problem becomes a product.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button href="#building">See what I&apos;m building</Button>
              <Button href="/blog" variant="ghost">
                Read the blog
              </Button>
            </div>
          </div>
          <div className="order-1 md:order-2">
            <Image
              src="/chip.jpg"
              alt="Ciprian (Chip) Rarau"
              width={320}
              height={320}
              priority
              className="rounded-2xl object-cover shadow-xl border border-border-light w-40 h-40 md:w-[320px] md:h-[320px]"
            />
          </div>
        </div>
      </Container>
    </section>
  );
}

async function ProductsInMotion() {
  const catalogs = await fetchAllCatalogs();
  return (
    <Section
      id="building"
      eyebrow="What I'm building now"
      title="Products in motion"
      intro="Each one started as a pattern I kept hitting across multiple companies. Three instances of the same problem becomes a product. Live from the IdeaPlaces catalog — adding a product to ideaplaces.com adds it here."
      size="wide"
    >
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {catalogs.map((catalog) => (
          <CatalogProductCard key={catalog.slug} catalog={catalog} />
        ))}
      </div>
      <div className="mt-10 text-sm text-foreground-muted">
        More on the company page at{' '}
        <a
          href="https://ideaplaces.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary font-semibold hover:text-primary-dark"
        >
          ideaplaces.com
        </a>
        .
      </div>
    </Section>
  );
}

function Companies() {
  return (
    <Section
      eyebrow="Companies I'm building with"
      title="Parallel builds"
      intro="In any given week I'm shipping with several teams. The lens is wider than any one industry. The pattern is what carries."
      size="wide"
    >
      <div className="grid sm:grid-cols-2 gap-5">
        {ACTIVE_COMPANIES.map((c) => (
          <CompanyCard key={c.slug} company={c} />
        ))}
      </div>
    </Section>
  );
}

function Portfolio() {
  return (
    <Section
      eyebrow="Full portfolio"
      title="Hover across the work"
      intro="Past and present in one ribbon. Hover any tile to expand it. The top of the list is what I'm shipping now; the bottom is the track record that funds the present."
      size="wide"
    >
      <ProjectCarousel />
    </Section>
  );
}

function BlogTeaser() {
  const posts = getRecentPosts(4);
  return (
    <Section
      eyebrow="Latest from the blog"
      title="Notes from the work"
      intro="Production stories, not theory. The blog is where the patterns get written down before they become products."
    >
      <div>
        {posts.map((post) => (
          <PostCard key={post.slug} post={post} compact />
        ))}
      </div>
      <div className="mt-8">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-dark transition-colors"
        >
          All posts
          <ArrowRight size={14} strokeWidth={2.5} />
        </Link>
      </div>
    </Section>
  );
}

function TrackRecord() {
  return (
    <Section
      eyebrow="Track record"
      title="25 years, one instinct"
      intro="Find a real problem. Build the system that solves it. Scale it until it runs without you. The product changes. The instinct doesn't."
      size="wide"
      className="bg-background-alt border-y border-border-light"
    >
      <div>
        {TRACK_RECORD.map((item) => (
          <TrackRecordItem key={item.slug} item={item} />
        ))}
      </div>
    </Section>
  );
}

function Newsletter() {
  return (
    <Section size="narrow">
      <div className="rounded-xl border border-border bg-surface p-10">
        <div className="flex items-center gap-3 mb-3 text-sm uppercase tracking-widest text-foreground-muted font-mono">
          <span className="inline-block h-px w-10 bg-secondary" />
          <span>Newsletter</span>
        </div>
        <h2 className="font-heading text-2xl md:text-3xl font-extrabold tracking-tight mb-3">
          One short note when something ships.
        </h2>
        <p className="text-foreground-muted mb-6 leading-relaxed">
          No marketing. No drip sequences. A short note when a product ships, a blog
          post lands, or I notice a pattern worth sharing.
        </p>
        <NewsletterForm />
      </div>
    </Section>
  );
}
