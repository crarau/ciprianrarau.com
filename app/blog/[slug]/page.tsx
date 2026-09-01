import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Container } from '@/components/Container';
import { SubscribePrompt } from '@/components/SubscribePrompt';
import { SubscribePopup } from '@/components/SubscribePopup';
import { BlogReadTracker } from '@/components/BlogReadTracker';
import { getAllPosts, getPost, formatDate, renderPostHtml } from '@/lib/blog';

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return { title: 'Not found' };
  return {
    robots: post.frontmatter.draft ? { index: false, follow: false } : undefined,
    title: post.frontmatter.title,
    description: post.frontmatter.excerpt,
    openGraph: {
      title: post.frontmatter.title,
      description: post.frontmatter.excerpt,
      type: 'article',
      publishedTime: post.frontmatter.publishDate,
      authors: post.frontmatter.author ? [post.frontmatter.author] : undefined,
      tags: post.frontmatter.tags,
    },
  };
}

export default async function PostPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();
  const html = await renderPostHtml(post.content);

  return (
    <>
      <Header />
      <main>
        <article className="pt-16 pb-20 md:pt-24">
          <Container size="narrow">
            <Link
              href="/blog"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground-muted hover:text-primary transition-colors mb-10"
            >
              <ArrowLeft size={14} strokeWidth={2.5} />
              All posts
            </Link>
            <header className="mb-12">
              <div className="flex flex-wrap items-center gap-3 mb-5 text-xs uppercase tracking-widest font-mono text-foreground-muted">
                <time dateTime={post.frontmatter.publishDate}>
                  {formatDate(post.frontmatter.publishDate)}
                </time>
                {post.frontmatter.category && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="text-secondary font-semibold">{post.frontmatter.category}</span>
                  </>
                )}
                <span aria-hidden="true">·</span>
                <span>{post.readingMinutes} min read</span>
              </div>
              <h1 className="font-heading text-4xl md:text-5xl font-extrabold leading-[1.1] tracking-tight mb-6">
                {post.frontmatter.title}
              </h1>
              {post.frontmatter.excerpt && (
                <p className="text-lg md:text-xl leading-relaxed text-foreground-muted max-w-2xl">
                  {post.frontmatter.excerpt}
                </p>
              )}
            </header>
            <div
              className="prose prose-lg max-w-none prose-headings:font-heading prose-headings:tracking-tight prose-h2:mt-12 prose-h2:mb-4 prose-h3:mt-8 prose-h3:mb-3 prose-pre:bg-clay-900 prose-pre:text-clay-50 prose-code:before:content-none prose-code:after:content-none prose-img:rounded-lg prose-a:text-primary prose-a:no-underline hover:prose-a:underline"
              dangerouslySetInnerHTML={{ __html: html }}
            />
            {post.frontmatter.tags && post.frontmatter.tags.length > 0 && (
              <div className="mt-16 pt-8 border-t border-border-light flex flex-wrap gap-2">
                {post.frontmatter.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-3 py-1 text-xs font-mono text-foreground-muted bg-background-alt border border-border-light rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
            <SubscribePrompt source={slug} />
          </Container>
        </article>
        <SubscribePopup source={slug} />
        <BlogReadTracker slug={slug} />
      </main>
      <Footer />
    </>
  );
}
