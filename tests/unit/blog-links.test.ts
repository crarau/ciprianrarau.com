import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

// Every internal link in every blog post must resolve to something that
// exists: another post (with the /blog/ prefix), a file under public/, or an
// app route. This gates the deploy, so a broken internal link cannot ship.
// It exists because posts linked to /some-post-slug without the /blog/
// prefix, the 404s went unnoticed, and new posts copied the broken pattern.

const ROOT = process.cwd();
const BLOG_DIR = path.join(ROOT, 'content', 'blog');
const PUBLIC_DIR = path.join(ROOT, 'public');
const APP_DIR = path.join(ROOT, 'app');

const postFiles = fs.readdirSync(BLOG_DIR).filter((f) => /\.mdx?$/.test(f));
const postSlugs = new Set(postFiles.map((f) => f.replace(/\.mdx?$/, '')));

const appRoutes = new Set(
  fs
    .readdirSync(APP_DIR, { withFileTypes: true })
    .filter(
      (d) =>
        d.isDirectory() &&
        fs
          .readdirSync(path.join(APP_DIR, d.name))
          .some((f) => /^(page|route)\.(tsx?|jsx?)$/.test(f)),
    )
    .map((d) => d.name),
);

type LinkRef = { file: string; target: string };

function extractInternalLinks(file: string): LinkRef[] {
  const raw = fs.readFileSync(path.join(BLOG_DIR, file), 'utf8');
  const refs: LinkRef[] = [];
  for (const match of raw.matchAll(/!?\[[^\]]*\]\((\/[^)\s]*)\)/g)) {
    refs.push({ file, target: match[1] });
  }
  const frontImage = raw.match(/^image:\s*(\/\S+)\s*$/m);
  if (frontImage) refs.push({ file, target: frontImage[1] });
  return refs;
}

function classify(target: string): string | null {
  const clean = target.split(/[?#]/)[0].replace(/\/$/, '') || '/';
  if (clean === '/' || clean === '/blog') return null;
  const blogMatch = clean.match(/^\/blog\/([^/]+)$/);
  if (blogMatch) {
    return postSlugs.has(blogMatch[1])
      ? null
      : `links to /blog/${blogMatch[1]} but no post with that slug exists`;
  }
  if (clean.startsWith('/images/') || clean.includes('.')) {
    return fs.existsSync(path.join(PUBLIC_DIR, clean))
      ? null
      : `links to ${clean} but that file does not exist under public/`;
  }
  const topSegment = clean.split('/')[1];
  if (appRoutes.has(topSegment)) return null;
  if (postSlugs.has(topSegment)) {
    return `links to ${clean} which is a post slug missing the /blog/ prefix (use /blog/${topSegment})`;
  }
  return `links to ${clean} which matches no app route, post, or public file`;
}

describe('blog internal links', () => {
  it('finds blog posts to check', () => {
    expect(postFiles.length).toBeGreaterThan(0);
  });

  for (const file of postFiles) {
    it(`${file} has no broken internal links`, () => {
      const problems = extractInternalLinks(file)
        .map((ref) => {
          const problem = classify(ref.target);
          return problem ? `${ref.file}: ${problem}` : null;
        })
        .filter(Boolean);
      expect(problems).toEqual([]);
    });
  }
});
