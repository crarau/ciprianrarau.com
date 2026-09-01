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
 *   npx tsx scripts/newsletter/send-post.mjs --auto            # announce new posts (deploy hook)
 *   npx tsx scripts/newsletter/send-post.mjs --slug my-post    # announce one post
 *   npx tsx scripts/newsletter/send-post.mjs --slug my-post --to a@b.com   # test send, no ledger
 *   npx tsx scripts/newsletter/send-post.mjs --seed            # mark all published posts as sent
 *   npx tsx scripts/newsletter/send-post.mjs --auto --dry-run  # print what would happen
 *
 * Env: ACS_CONNECTION_STRING, NEWSLETTER_STORAGE_CONNECTION_STRING,
 *      NEWSLETTER_UNSUBSCRIBE_SECRET
 */

import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { TableClient } from '@azure/data-tables';
import { EmailClient } from '@azure/communication-email';
import { unsubscribeToken } from './token.mjs';
import { renderNewPostEmail } from './render-email.tsx';

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

async function sendToRecipient(emailClient, secret, post, recipient) {
  const postUrl = `${SITE}/blog/${post.slug}?utm_source=newsletter&utm_medium=email&utm_campaign=${post.slug}`;
  const token = unsubscribeToken(recipient.list, recipient.email, secret);
  const unsubscribeUrl = `${SITE}/unsubscribe?token=${token}`;
  const oneClickUrl = `${SITE}/api/unsubscribe?token=${token}`;
  const { html, text } = await renderNewPostEmail(post, postUrl, unsubscribeUrl);

  const message = {
    senderAddress: FROM,
    replyTo: [{ address: FROM }],
    content: {
      subject: post.frontmatter.title,
      html,
      plainText: text,
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

  const recipients = mode.to
    ? [{ email: mode.to, list: 'ciprianrarau' }]
    : await activeRecipients();

  console.log(`Post: ${post.slug} ("${post.frontmatter.title}")`);
  console.log(`Recipients: ${recipients.length}${mode.to ? ' (test send)' : ''}`);

  if (mode.dryRun) {
    for (const r of recipients) console.log(`  would send to ${r.email} (${r.list})`);
    const previewPath = path.join(process.cwd(), `newsletter-preview-${post.slug}.html`);
    const token = unsubscribeToken('ciprianrarau', 'preview@example.com', secret);
    const { html } = await renderNewPostEmail(
      post,
      `${SITE}/blog/${post.slug}?utm_source=newsletter&utm_medium=email&utm_campaign=${post.slug}`,
      `${SITE}/unsubscribe?token=${token}`,
    );
    fs.writeFileSync(previewPath, html);
    console.log(`Dry run: no emails sent. Preview written to ${previewPath}`);
    return;
  }

  const emailClient = new EmailClient(requireEnv('ACS_CONNECTION_STRING'));
  let sent = 0;
  let failed = 0;
  for (const recipient of recipients) {
    try {
      await sendToRecipient(emailClient, secret, post, recipient);
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
