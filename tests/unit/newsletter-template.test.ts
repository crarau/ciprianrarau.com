import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { describe, expect, it } from 'vitest';
import { intro, renderNewPostEmail } from '../../scripts/newsletter/render-email';

// Email clients ignore stylesheets, so a single unconstrained <img> (post
// screenshots are 1200 to 1600px wide) forces the 600px layout open and
// the whole email stops wrapping in Gmail. This suite renders every real
// post through the react-email template and fails if any image could ship
// without its inline width constraint, or any link stay site-relative.

const BLOG_DIR = path.join(process.cwd(), 'content', 'blog');

const posts = fs
  .readdirSync(BLOG_DIR)
  .filter((f) => /\.mdx?$/.test(f))
  .map((f) => {
    const { data, content } = matter(fs.readFileSync(path.join(BLOG_DIR, f), 'utf8'));
    return {
      slug: f.replace(/\.mdx?$/, ''),
      frontmatter: data as { title: string; publishDate: string; excerpt?: string },
      content,
    };
  });

function renderPost(post: (typeof posts)[number]) {
  return renderNewPostEmail(
    post,
    `https://ciprianrarau.com/blog/${post.slug}`,
    'https://ciprianrarau.com/unsubscribe?token=x',
  );
}

describe('newsletter email template', () => {
  it('finds posts to check', () => {
    expect(posts.length).toBeGreaterThan(0);
  });

  for (const post of posts) {
    it(`${post.slug} renders email-safe`, async () => {
      const { html, text } = await renderPost(post);
      const imgs = html.match(/<img[^>]*>/g) ?? [];
      const unconstrained = imgs.filter((tag) => !/max-width:\s*100%/.test(tag));
      expect(unconstrained).toEqual([]);
      expect(html).not.toContain('src="/');
      expect(html).not.toContain('href="/');
      const escapedTitle = post.frontmatter.title
        .replace(/&/g, '&amp;')
        .replace(/'/g, '&#x27;')
        .replace(/"/g, '&quot;');
      expect(html).toContain(escapedTitle);
      expect(text).toContain(`https://ciprianrarau.com/blog/${post.slug}`);
    });
  }

  it('intro cuts at the first H2 and absolutizes links', () => {
    const md = 'Hello [a link](/blog/x) here.\n\n![shot](/images/blog/x/y.jpg)\n\n## Section\n\nBody';
    const cut = intro(md);
    expect(cut).not.toContain('## Section');
    expect(cut).toContain('](https://ciprianrarau.com/blog/x)');
    expect(cut).toContain('](https://ciprianrarau.com/images/blog/x/y.jpg)');
  });
});
