/**
 * Blog post feed as JSON. The machine-readable counterpart of /rss.xml,
 * consumed by ideaplaces.com to render its "From the blog" section (the
 * same federation pattern as ideaplaces.com/api/manifest, in the other
 * direction). Absolute URLs so consumers can link straight back here.
 */

import { NextResponse } from 'next/server';
import { getAllPosts } from '@/lib/blog';

const SITE = 'https://ciprianrarau.com';
const DEFAULT_AUTHOR = 'Ciprian (Chip) Rarau';

export const dynamic = 'force-static';
export const revalidate = 300;

export function GET(): NextResponse {
  const posts = getAllPosts().map((p) => ({
    slug: p.slug,
    title: p.frontmatter.title,
    excerpt: p.frontmatter.excerpt ?? '',
    author: p.frontmatter.author ?? DEFAULT_AUTHOR,
    publishDate: p.frontmatter.publishDate,
    category: p.frontmatter.category ?? null,
    readingMinutes: p.readingMinutes,
    url: `${SITE}/blog/${p.slug}`,
  }));

  return NextResponse.json(posts, {
    headers: {
      'Cache-Control': 'public, max-age=300, s-maxage=300',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    },
  });
}

export function OPTIONS(): NextResponse {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Max-Age': '86400',
    },
  });
}
