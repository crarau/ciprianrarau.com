import * as React from 'react';
import { render } from '@react-email/render';
import { NewPostEmail } from './NewPostEmail';

const SITE = 'https://ciprianrarau.com';

type Post = {
  slug: string;
  frontmatter: { title: string; publishDate: string; excerpt?: string };
  content: string;
};

/** Content up to the first H2: the post's intro, what the email carries. */
export function intro(content: string): string {
  const withoutMermaid = content.replace(/```mermaid[\s\S]*?```/g, '');
  const cut = withoutMermaid.search(/\n## /);
  let text = cut >= 0 ? withoutMermaid.slice(0, cut) : withoutMermaid;
  if (text.length > 2600) {
    const paragraphBreak = text.lastIndexOf('\n\n', 2600);
    text = paragraphBreak > 400 ? text.slice(0, paragraphBreak) : text.slice(0, 2600);
  }
  // Site-relative links and images must become absolute in an email.
  return text
    .trim()
    .replaceAll('](/', `](${SITE}/`)
    .replaceAll('src="/', `src="${SITE}/`)
    .replaceAll('href="/', `href="${SITE}/`);
}

export async function renderNewPostEmail(
  post: Post,
  postUrl: string,
  unsubscribeUrl: string,
): Promise<{ html: string; text: string }> {
  const date = new Date(post.frontmatter.publishDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const element = (
    <NewPostEmail
      title={post.frontmatter.title}
      date={date}
      excerpt={post.frontmatter.excerpt}
      introMarkdown={intro(post.content)}
      postUrl={postUrl}
      unsubscribeUrl={unsubscribeUrl}
    />
  );
  const html = await render(element);
  const text = [
    post.frontmatter.title,
    '',
    post.frontmatter.excerpt ?? '',
    '',
    `Read the full post: ${postUrl}`,
    '',
    `You're getting this because you subscribed on ciprianrarau.com or ideaplaces.com.`,
    `Unsubscribe: ${unsubscribeUrl}`,
  ].join('\n');
  return { html, text };
}
