/**
 * Newsletter sender. Announces a blog post to the subscriber list: the
 * post's intro in a branded email, then a "Read the full post" button back
 * to the site (UTM-tagged so reads show up in analytics), a per-recipient
 * unsubscribe link, and RFC 8058 one-click unsubscribe headers.
 *
 * Sends through Azure Communication Services as chip@ciprianrarau.com.
 * Recipients come from the `subscribers` table (both lists, deduped).
 * The `sends` table is the ledger: a post already in it is never sent
 * again, which is what makes running `--auto` on every deploy safe.
 *
 * Usage:
 *   node scripts/newsletter/send-post.mjs --auto            # announce new posts (deploy hook)
 *   node scripts/newsletter/send-post.mjs --slug my-post    # announce one post
 *   node scripts/newsletter/send-post.mjs --slug my-post --to a@b.com   # test send, no ledger
 *   node scripts/newsletter/send-post.mjs --seed            # mark all published posts as sent
 *   node scripts/newsletter/send-post.mjs --auto --dry-run  # print what would happen
 *
 * Env: ACS_CONNECTION_STRING, NEWSLETTER_STORAGE_CONNECTION_STRING,
 *      NEWSLETTER_UNSUBSCRIBE_SECRET
 */

import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeStringify from 'rehype-stringify';
import { TableClient } from '@azure/data-tables';
import { EmailClient } from '@azure/communication-email';
import { unsubscribeToken } from './token.mjs';

const SITE = 'https://ciprianrarau.com';
const FROM = 'chip@ciprianrarau.com';
const LISTS = ['ciprianrarau', 'ideaplaces'];
const AUTO_WINDOW_DAYS = 14;
const BLOG_DIR = path.join(process.cwd(), 'content', 'blog');

// ---------- args ----------

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const opt = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : null;
};

const mode = {
  auto: flag('auto'),
  seed: flag('seed'),
  slug: opt('slug'),
  to: opt('to'),
  dryRun: flag('dry-run'),
  force: flag('force'),
};

// ---------- env ----------

function requireEnv(name) {
  const v = process.env[name];
  if (!v) {
    console.error(`Missing env var ${name}`);
    process.exit(1);
  }
  return v;
}

const storageConn = requireEnv('NEWSLETTER_STORAGE_CONNECTION_STRING');
const subscribers = TableClient.fromConnectionString(storageConn, 'subscribers');
const sends = TableClient.fromConnectionString(storageConn, 'sends');

// ---------- posts ----------

function publishedPosts() {
  const now = Date.now();
  return fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith('.md') || f.endsWith('.mdx'))
    .map((f) => {
      const slug = f.replace(/\.mdx?$/, '');
      const { data, content } = matter(fs.readFileSync(path.join(BLOG_DIR, f), 'utf8'));
      return { slug, frontmatter: data, content };
    })
    .filter((p) => !p.frontmatter.draft)
    .filter((p) => new Date(p.frontmatter.publishDate).getTime() <= now)
    .sort(
      (a, b) =>
        new Date(b.frontmatter.publishDate).getTime() -
        new Date(a.frontmatter.publishDate).getTime(),
    );
}

async function sentSlugs() {
  const done = new Set();
  for await (const row of sends.listEntities({
    queryOptions: { filter: `PartitionKey eq 'post'` },
  })) {
    done.add(row.rowKey);
  }
  return done;
}

// ---------- email body ----------

/** Content up to the first H2: the post's intro, what the email carries. */
function intro(content) {
  const withoutMermaid = content.replace(/```mermaid[\s\S]*?```/g, '');
  const cut = withoutMermaid.search(/\n## /);
  let text = cut >= 0 ? withoutMermaid.slice(0, cut) : withoutMermaid;
  if (text.length > 2600) {
    const paragraphBreak = text.lastIndexOf('\n\n', 2600);
    text = paragraphBreak > 400 ? text.slice(0, paragraphBreak) : text.slice(0, 2600);
  }
  return text.trim();
}

async function renderIntroHtml(markdown) {
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(markdown);
  return String(file)
    .replaceAll('href="/', `href="${SITE}/`)
    .replaceAll('src="/', `src="${SITE}/`);
}

function emailHtml(post, introHtml, postUrl, unsubscribeUrl) {
  const date = new Date(post.frontmatter.publishDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  return `<!doctype html>
<html>
<body style="margin:0;padding:0;background:#F5F4F1;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F5F4F1;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr><td style="padding:0 20px 16px;font-family:Helvetica,Arial,sans-serif;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#7C746B;">
          Ciprian (Chip) Rarau &middot; New post
        </td></tr>
        <tr><td style="background:#FFFFFF;border:1px solid #E4E1DB;border-radius:12px;padding:36px 32px;font-family:Helvetica,Arial,sans-serif;color:#2B2723;">
          <h1 style="margin:0 0 8px;font-size:26px;line-height:1.2;color:#21517C;">${escapeHtml(post.frontmatter.title)}</h1>
          <p style="margin:0 0 24px;font-size:13px;color:#7C746B;">${date}</p>
          <div style="font-size:16px;line-height:1.65;">
            ${introHtml}
          </div>
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 8px;">
            <tr><td style="background:#21517C;border-radius:8px;">
              <a href="${postUrl}" style="display:inline-block;padding:13px 26px;font-size:15px;font-weight:bold;color:#FFFFFF;text-decoration:none;">Read the full post &rarr;</a>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:20px 24px;font-family:Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6;color:#7C746B;">
          You're getting this because you subscribed on <a href="${SITE}" style="color:#A45C36;">ciprianrarau.com</a> or <a href="https://ideaplaces.com" style="color:#A45C36;">ideaplaces.com</a>.
          One email per post, nothing else.<br>
          Ciprian Rarau &middot; Montreal, Canada &middot; <a href="${unsubscribeUrl}" style="color:#A45C36;">Unsubscribe</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function emailText(post, postUrl, unsubscribeUrl) {
  return [
    post.frontmatter.title,
    '',
    post.frontmatter.excerpt ?? '',
    '',
    `Read the full post: ${postUrl}`,
    '',
    `You're getting this because you subscribed on ciprianrarau.com or ideaplaces.com.`,
    `Unsubscribe: ${unsubscribeUrl}`,
  ].join('\n');
}

function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ---------- recipients ----------

async function activeRecipients() {
  const byEmail = new Map();
  for (const list of LISTS) {
    for await (const row of subscribers.listEntities({
      queryOptions: { filter: `PartitionKey eq '${list}' and status eq 'active'` },
    })) {
      if (!byEmail.has(row.rowKey)) byEmail.set(row.rowKey, { email: row.rowKey, list });
    }
  }
  return [...byEmail.values()];
}

// ---------- send ----------

async function sendToRecipient(emailClient, secret, post, introHtml, recipient) {
  const postUrl = `${SITE}/blog/${post.slug}?utm_source=newsletter&utm_medium=email&utm_campaign=${post.slug}`;
  const token = unsubscribeToken(recipient.list, recipient.email, secret);
  const unsubscribeUrl = `${SITE}/unsubscribe?token=${token}`;
  const oneClickUrl = `${SITE}/api/unsubscribe?token=${token}`;

  const message = {
    senderAddress: FROM,
    replyTo: [{ address: FROM }],
    content: {
      subject: post.frontmatter.title,
      html: emailHtml(post, introHtml, postUrl, unsubscribeUrl),
      plainText: emailText(post, postUrl, unsubscribeUrl),
    },
    recipients: { to: [{ address: recipient.email }] },
    headers: {
      'List-Unsubscribe': `<${oneClickUrl}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
  };

  try {
    const poller = await emailClient.beginSend(message);
    const result = await poller.pollUntilDone();
    if (result.status !== 'Succeeded') {
      throw new Error(`ACS status ${result.status}: ${result.error?.message ?? ''}`);
    }
    return true;
  } catch (err) {
    // Some header names can be rejected by the provider; the mail matters
    // more than the header, so retry once without custom headers.
    if (String(err.message).toLowerCase().includes('header')) {
      delete message.headers;
      const poller = await emailClient.beginSend(message);
      const result = await poller.pollUntilDone();
      if (result.status !== 'Succeeded') {
        throw new Error(`ACS status ${result.status}: ${result.error?.message ?? ''}`);
      }
      return true;
    }
    throw err;
  }
}

async function announce(post) {
  const secret = requireEnv('NEWSLETTER_UNSUBSCRIBE_SECRET');
  const introHtml = await renderIntroHtml(intro(post.content));

  const recipients = mode.to
    ? [{ email: mode.to, list: 'ciprianrarau' }]
    : await activeRecipients();

  console.log(`Post: ${post.slug} ("${post.frontmatter.title}")`);
  console.log(`Recipients: ${recipients.length}${mode.to ? ' (test send)' : ''}`);

  if (mode.dryRun) {
    for (const r of recipients) console.log(`  would send to ${r.email} (${r.list})`);
    const previewPath = path.join(process.cwd(), `newsletter-preview-${post.slug}.html`);
    const token = unsubscribeToken('ciprianrarau', 'preview@example.com', secret);
    fs.writeFileSync(
      previewPath,
      emailHtml(
        post,
        introHtml,
        `${SITE}/blog/${post.slug}?utm_source=newsletter&utm_medium=email&utm_campaign=${post.slug}`,
        `${SITE}/unsubscribe?token=${token}`,
      ),
    );
    console.log(`Dry run: no emails sent. Preview written to ${previewPath}`);
    return;
  }

  const emailClient = new EmailClient(requireEnv('ACS_CONNECTION_STRING'));
  let sent = 0;
  let failed = 0;
  for (const recipient of recipients) {
    try {
      await sendToRecipient(emailClient, secret, post, introHtml, recipient);
      sent++;
      console.log(`  sent to ${recipient.email}`);
    } catch (err) {
      failed++;
      console.error(`  FAILED for ${recipient.email}: ${err.message}`);
    }
  }
  console.log(`Done: ${sent} sent, ${failed} failed.`);

  if (!mode.to) {
    await sends.upsertEntity(
      {
        partitionKey: 'post',
        rowKey: post.slug,
        sentAt: new Date().toISOString(),
        recipients: sent,
        failed,
        mode: 'sent',
      },
      'Replace',
    );
    console.log(`Ledger updated: ${post.slug} marked as sent.`);
  }

  if (failed > 0 && sent === 0) process.exit(1);
}

// ---------- modes ----------

async function main() {
  const posts = publishedPosts();

  if (mode.seed) {
    const done = await sentSlugs();
    let added = 0;
    for (const post of posts) {
      if (done.has(post.slug)) continue;
      if (mode.dryRun) {
        console.log(`would seed ${post.slug}`);
        continue;
      }
      await sends.upsertEntity(
        {
          partitionKey: 'post',
          rowKey: post.slug,
          sentAt: new Date().toISOString(),
          recipients: 0,
          mode: 'seeded',
        },
        'Replace',
      );
      added++;
    }
    console.log(`Seeded ${added} posts into the ledger (${done.size} were already there).`);
    return;
  }

  if (mode.slug) {
    const post = posts.find((p) => p.slug === mode.slug);
    if (!post) {
      console.error(`No published post with slug "${mode.slug}"`);
      process.exit(1);
    }
    if (!mode.to && !mode.force) {
      const done = await sentSlugs();
      if (done.has(post.slug)) {
        console.error(`"${post.slug}" is already in the sends ledger. Use --force to resend.`);
        process.exit(1);
      }
    }
    await announce(post);
    return;
  }

  if (mode.auto) {
    const done = await sentSlugs();
    const windowStart = Date.now() - AUTO_WINDOW_DAYS * 24 * 60 * 60 * 1000;
    const candidates = posts.filter(
      (p) =>
        !done.has(p.slug) &&
        new Date(p.frontmatter.publishDate).getTime() >= windowStart,
    );
    if (candidates.length === 0) {
      console.log('No new posts to announce.');
      return;
    }
    for (const post of candidates) {
      await announce(post);
    }
    return;
  }

  console.error('Pick a mode: --auto, --slug <slug>, or --seed. Add --dry-run to preview.');
  process.exit(1);
}

await main();
