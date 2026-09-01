import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import readingTime from 'reading-time';
import { unified, type Plugin } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeSlug from 'rehype-slug';
import rehypePrism from 'rehype-prism-plus';
import rehypeStringify from 'rehype-stringify';
import type { Root } from 'mdast';

const stripMermaidCodeBlocks: Plugin<[], Root> = () => (tree) => {
  tree.children = tree.children.filter(
    (node) => !(node.type === 'code' && node.lang === 'mermaid'),
  );
};

export type PostFrontmatter = {
  title: string;
  excerpt?: string;
  author?: string;
  publishDate: string;
  updateDate?: string;
  category?: string;
  tags?: string[];
  image?: string;
  draft?: boolean;
  substack?: boolean;
  linkedin?: string;
  contentType?: string;
};

export type PostMeta = {
  slug: string;
  frontmatter: PostFrontmatter;
  readingMinutes: number;
};

export type Post = PostMeta & {
  content: string;
};

const BLOG_DIR = path.join(process.cwd(), 'content', 'blog');

function listFiles(): string[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith('.md') || f.endsWith('.mdx'));
}

function readPost(file: string): Post {
  const slug = file.replace(/\.mdx?$/, '');
  const raw = fs.readFileSync(path.join(BLOG_DIR, file), 'utf8');
  const { data, content } = matter(raw);
  const minutes = Math.max(1, Math.round(readingTime(content).minutes));
  return {
    slug,
    frontmatter: data as PostFrontmatter,
    content,
    readingMinutes: minutes,
  };
}

export function getAllPosts(): PostMeta[] {
  return listFiles()
    .map((f) => readPost(f))
    .filter((p) => !p.frontmatter.draft)
    .sort((a, b) => {
      const da = new Date(a.frontmatter.publishDate).getTime();
      const db = new Date(b.frontmatter.publishDate).getTime();
      return db - da;
    })
    .map(({ content: _content, ...meta }) => meta);
}

// Drafts are unlisted, not blocked: excluded from getAllPosts (list, RSS,
// sitemap) but served here so a direct link can be shared for review.
export function getPost(slug: string): Post | null {
  const files = listFiles();
  const file = files.find((f) => f.replace(/\.mdx?$/, '') === slug);
  if (!file) return null;
  return readPost(file);
}

export function getRecentPosts(limit = 6): PostMeta[] {
  return getAllPosts().slice(0, limit);
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export async function renderPostHtml(markdown: string): Promise<string> {
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(stripMermaidCodeBlocks)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeSlug)
    .use(rehypePrism, { ignoreMissing: true })
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(markdown);
  return String(file);
}
