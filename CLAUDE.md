# ciprianrarau.com — Claude Instructions

## Overview

Personal portfolio, blog, and projects site for Ciprian (Chip) Rarau. **Next.js 15 + React 19 + Tailwind v3.** Deployed to Azure Container Apps.

The previous Astro version is preserved under `_legacy-astro/` on this branch as a reference during the migration. **Do not edit anything under `_legacy-astro/`.** It is dead code, kept only so the migration can grab old layouts and content if something is missing. It will be deleted once the new site has been live for a stable stretch.

## Stack

- **Framework:** Next.js 15 (App Router), React 19, TypeScript 5
- **Styling:** Tailwind v3 with custom Clay & Code design tokens
- **Markdown:** `unified` + `remark` + `rehype` (NOT MDX — plain markdown so `<5%` style content does not parse as JSX)
- **Forms:** Resend API (contact, newsletter)
- **Icons:** lucide-react
- **Fonts:** Inter (sans + heading) + JetBrains Mono via `next/font/google`
- **Output:** Standalone (`output: 'standalone'`) for Docker
- **Dev port:** 5310

## Brand

- **Palette:** Clay & Code, generated via Styleguide Generator (conversation `6e0eecd1-1830-43af-ba27-0b84b0469dd6`, version `0ae9aec4-1e4f-4ff7-a064-27b29f4e5a66`).
- **Colors:** Cream `#F5F4F1` background, deep navy `#21517C` primary, terracotta `#A45C36` secondary, amber `#F29E4C` accent.
- **Type:** Inter 700/800 for headings (Söhne is paid; we substitute Inter at heavier weights with `tracking-tight`).
- **Brand mark:** A cream "C" arc on a rounded deep-navy square. Lives in `app/icon.svg`, `app/apple-icon.tsx`, `app/opengraph-image.tsx`. Replaces the Vercel triangle scaffold default.

To regenerate or update the palette, follow `/styleguide-generate` (in ideaplaces-meta `.claude/prompts/`).

## Directory Structure

```
ciprianrarau.com/
├── app/
│   ├── (marketing pages: page.tsx, about, cv, contact, blog, blog/[slug])
│   ├── api/
│   │   ├── contact/        # Resend send-email
│   │   ├── subscribe/      # Resend audience add
│   │   ├── posts/          # blog feed JSON (consumed by ideaplaces.com's "From the blog")
│   │   └── health/         # liveness probe
│   ├── icon.svg            # browser tab icon
│   ├── apple-icon.tsx      # 180x180 home-screen icon
│   ├── opengraph-image.tsx # 1200x630 social share
│   ├── rss.xml/            # RSS feed
│   ├── sitemap.ts          # /sitemap.xml
│   ├── robots.ts           # /robots.txt
│   ├── globals.css         # Tailwind layers + Prism theme
│   └── layout.tsx          # root layout, metadata, fonts
├── components/             # React primitives (Header, Footer, Section, Button, ProductCard, ProjectCarousel, etc.)
├── lib/
│   ├── data/               # hardcoded products, companies, track record, projects
│   └── blog.ts             # markdown loader + renderer
├── content/blog/           # blog posts (.md with frontmatter)
├── public/
│   ├── projects/           # carousel images (10 PNGs)
│   ├── images/blog/        # post inline images
│   ├── images/diagrams/    # pre-rendered mermaid PNGs
│   └── resume.pdf          # CV download
├── _legacy-astro/          # frozen Astro version, deleted at cleanup
├── Dockerfile              # multi-stage Next.js standalone build
├── tailwind.config.ts
└── next.config.ts
```

## Development

```bash
npm install
npm run dev       # http://localhost:5310
npm run build     # production build
npm run start     # serve the build on 5310
npm run typecheck # tsc --noEmit
npm run lint
npm run test:unit # vitest, tests/unit/ (contact form route)
```

## Adding a Blog Post

Create a markdown file under `content/blog/<slug>.md`:

```markdown
---
title: "Your title"
publishDate: 2026-04-25T12:00:00Z
author: Ciprian Rarau
excerpt: "One- to three-sentence summary used in lists, OG, and SEO."
category: Building
tags: [tag-one, tag-two]
substack: true
draft: false
---

Body in plain markdown. Code fences, GFM tables, mermaid PNG references all
work. Do NOT use raw `<jsx>` — the renderer is markdown, not MDX.
```

The Substack sync workflow at `.github/workflows/substack-sync.yml` watches `content/blog/**` and also supports manual runs via `workflow_dispatch`.

### Substack sync operations (as of 2026-08-31)

- **It is automatic again.** The `chips-mac` runner was re-registered on Chip's new Mac on
  2026-08-31, so a push touching `content/blog/**` syncs to Substack on its own. Nothing needs
  to be run by hand in the normal case. Runbook:
  `ideaplaces-devops/github-actions-runners/README.md`.
- **Subtitle limit: 255 characters.** Substack rejects a longer `draft_subtitle` with
  `400 Subtitle is too long`, and the sync maps a post's `excerpt` onto the subtitle, so an
  over-long excerpt means the post **cannot sync at all**. Confirmed against the API, not
  guessed. See the content rules below.
- **Publishing emails subscribers.** New posts publish with `send: True`, so each one hits
  every subscriber's inbox; updates to an already-published post use `send: False` and do not.
  **Always `--dry-run` first** to see exactly what would go out, and when several posts are
  pending, publish them deliberately with `--post <slug>` rather than letting one run send them
  all at once.
- **Azure auth is OIDC, not a human session.** The workflow logs in as
  `github-actions-ideaplaces` over GitHub OIDC (the same app registration `deploy.yml` uses,
  which already holds Key Vault Secrets User on `kv-ideaplaces`). It no longer depends on
  anyone's interactive `az login`. The login is pinned to a per-run `AZURE_CONFIG_DIR` because
  `azure/login`'s post-step runs `az account clear`, which against the default `~/.azure` would
  log Chip out of his own Mac on every sync.
- **Failures are announced on Discord** in `#ciprianrarau-production`, and the message names
  the cause: a broken OIDC federation, a revoked Key Vault role, a rejected Substack cookie, a
  Cloudflare challenge, or an excerpt over the 255-character limit.
- **The cookie** lives in Key Vault `kv-ideaplaces` / `substack-cookie` (the `substack.sid`
  value, URL-encoded `s%3A...`). Refreshed 2026-08-31. **When it expires** (the sync fails with
  401 and Discord says the cookie is rejected): Substack signs in by a 6-digit emailed code;
  request it at substack.com/sign-in for ciprarau@gmail.com, read the code with the `gmail` CLI
  (`gmail search "from:no-reply@substack.com subject:verification"`), enter it in the SAME
  browser session that requested it, then store the fresh `substack.sid` back in the vault.
- **Running it by hand** (only needed when the Mac is unavailable, or to publish one post
  deliberately): from a checkout, `export SUBSTACK_URL=https://chiprarau.substack.com` and
  `SUBSTACK_COOKIE` from the vault, then `python3 scripts/substack/sync.py --dry-run`,
  `--list`, or `--post <slug>`. Deps are `scripts/substack/requirements.txt`; on a Mac with a
  Homebrew Python you need a venv, since PEP 668 makes a bare `pip3 install` fail.
- **Fallback: Cloudflare blocks plain requests from chipdev** (datacenter IP), so `sync.py` gets
  403 there before it ever authenticates. A headed Chromium under `xvfb-run` passes the
  challenge where headless does not; capture that browser's `cf_clearance` cookie plus its exact
  User-Agent, inject both into `sync.py`'s requests session, and publish with `--post <slug>`.
  Clearances expire in about 30 minutes. **The `chips-mac` runner exists precisely to avoid all
  of this** (residential IP), so this is only for when that Mac is off or offline.

Mermaid diagrams in posts use pre-rendered PNGs from `public/images/diagrams/`. To re-process diagrams, run `npm run process-mermaid` (`scripts/process-mermaid-diagrams.cjs`).

### Voice Guidelines

The blog should feel like coffee with a senior technical leader who has battle scars and shares them. Five qualities:

1. **Grounded conviction.** No hedging. Speak from experience.
2. **Stakes and numbers first.** Lead with dollar figures, client counts, consequences.
3. **The why before the how.** Three or four paragraphs of narrative before the first code block.
4. **Warm directness.** Preserve the energy from voice transcripts.
5. **Philosophical anchoring.** Every post anchors to a principle the reader carries away.

### Categories (existing posts use varied values; legacy taxonomy was)

`Building`, `Shipping`, `Thinking`, `Operating`, `Workflow`. Real posts also use `AI`, etc. The schema accepts any string.

### Show the value: proof over prose (the format, settled 2026-08-31)

Chip: "I like the new blog format, putting screenshots and examples. I'm super interested in
showing value." Reference posts: `style-is-data-rebrand-in-one-shot.md` and
`the-help-center-that-films-itself.md`. Every post from now on:

- **The first scroll carries the proof.** A real screenshot of the thing right after the opening
  claim, before any explanation. Before/after composites (labelled bands, ImageMagick `-append`)
  when the post is about a change.
- **Every major claim gets a visual or a link the reader can act on.** Screenshots come from the
  REAL product in session (never mockups); "press play on one yourself" beats a paragraph about
  video; "it is live, you can go play with it" beats a feature list. Link the live pages, the raw
  artifacts (versioned immutable URLs so they never break), and the IdeaPlaces products.
- **Post images** go under `public/images/blog/<post-slug>/` as compressed JPEGs (~90 quality,
  1200 to 1600px wide, under ~300KB). Mermaid stays conceptual and goes through
  `npm run process-mermaid`.
- **Verify the rendered page locally before pushing** (dev server on 5310, check every image's
  naturalWidth in a real browser), because the VS Code preview cannot resolve `/images/...`.
- **Concrete numbers that show value, sparingly**: one "73 minutes, unattended" or "1:10 vs 1:07"
  carries more than a paragraph; do not pad with stats.

### Content rules

- **First person singular** (`I`, `my`, `me`). Not `we`.
- **No client names**: use generic terms (`a healthcare startup`, `a SaaS company`). Exceptions: WISK.ai, IdeaPlaces, well-known tools (AWS, Stripe, etc.).
- **Anything IdeaPlaces is fair game, by name, with links.** Chip holds full IP on the IdeaPlaces portfolio, so posts should name the products and link to them (tourcockpit.com, styleguide.ideaplaces.com, ideaplaces.com, and the rest). Chip, 2026-08-31: "for any project that is there, you can put links to it, to all of them." Public product pages only; never internal URLs, keys, or customer data.
- **No team member names** in prose.
- **No markdown tables** in posts that sync to Substack (Substack API does not support them).
- **Keep `excerpt` under 255 characters.** It becomes the Substack subtitle, and Substack
  rejects anything longer, which blocks the whole post from syncing. Two posts silently could
  not sync for weeks because of this.

## Newsletter (our own list, no third-party provider)

The subscriber list is ours, in Azure Table Storage (`stideaplacesnewsletter` in
`rg-ideaplaces`, managed by Terraform in ideaplaces-devops `newsletter.tf`).
Sending goes through Azure Communication Services as `chip@ciprianrarau.com`
(fully verified domain on `acs-ideaplaces`). Resend is NOT used for the
newsletter anymore; it remains only behind the contact form.

- **`subscribers` table**: PartitionKey is the list (`ciprianrarau` or
  `ideaplaces`), RowKey the lowercased email, `status` is `active` or
  `unsubscribed`. `/api/subscribe` here writes the `ciprianrarau` partition;
  ideaplaces.com's own `/api/subscribe` writes `ideaplaces`. Unsubscribing
  flips status, never deletes: the row is also the suppression record.
- **`sends` table**: the announcement ledger. A post whose slug is in it is
  never emailed again. All pre-newsletter posts were seeded on 2026-09-01.
- **Sending**: `scripts/newsletter/send-post.mjs`. The deploy workflow runs
  `--auto` after every deploy: it announces published posts (publishDate in
  the last 14 days) that are not in the ledger, to both lists deduped, one
  personalized email per recipient with an HMAC unsubscribe link
  (`/unsubscribe?token=...`) and RFC 8058 one-click headers. Test with
  `--slug <slug> --to you@example.com` (no ledger write) or `--dry-run`
  (writes an HTML preview). `--seed` marks the backlog as sent.
- **Subscribe surfaces**: homepage newsletter box, end-of-post box
  (`SubscribePrompt`), and a slide-in popup 8s into reading a post
  (`SubscribePopup`; localStorage-silenced after subscribe or dismiss).
- **Discord ping**: a genuinely new subscriber (or a returning unsubscribed
  one) posts a line to the private #subscribers channel via
  `NEWSLETTER_DISCORD_WEBHOOK` (`lib/newsletter/notify.ts`); repeat signups
  of an active address stay quiet. Best effort, never fails the signup.
- **Read analytics**: PostHog (same project as the portfolio, app
  `ciprianrarau`), wired in `components/PostHogProvider.tsx`. Every blog
  post also captures a `blog_read` event (`components/BlogReadTracker.tsx`)
  with slug, seconds the tab was actually visible, and max scroll depth,
  sent on tab-hide/leave via sendBeacon; take max(seconds) per `read_id`
  when analyzing.
- **Tokens**: `lib/newsletter/token.ts` (app) and
  `scripts/newsletter/token.mjs` (sender) must stay byte-identical; the
  `newsletter-token.test.ts` lockstep test enforces it.
- **Secrets**: `NEWSLETTER_STORAGE_CONNECTION_STRING` and
  `NEWSLETTER_UNSUBSCRIBE_SECRET` (Container App via Terraform, GitHub
  Actions secrets for the send job, both mirrored in `kv-ideaplaces`), plus
  `ACS_CONNECTION_STRING` (`acs-connection-string-ciprianrarau` in the
  vault) for the send job only. The web app never sends email.

## Environment Variables

Pulled at runtime by the Container App. Set in Azure Key Vault and bound as Container App secrets:

- `RESEND_API_KEY`: used by `/api/contact`
- `RESEND_AUDIENCE_ID`: legacy Resend audience (no longer written to)
- `RESEND_FROM` — sender address (defaults to `Ciprian Rarau <noreply@ideaplaces.com>`)
- `RECIPIENT_EMAIL` — contact form destination (defaults to `chip@ideaplaces.com`)
- `NEWSLETTER_STORAGE_CONNECTION_STRING`: subscriber list Table Storage
- `NEWSLETTER_UNSUBSCRIBE_SECRET`: HMAC key for unsubscribe tokens

**CRITICAL: the sender domain must be verified in Resend.** The Resend account (key `resend-api-key-ciprianrarau` in `kv-ideaplaces`) is on the free plan with a single verified domain: `ideaplaces.com`. Sending from any `@ciprianrarau.com` address returns a 403 `validation_error` and the contact form breaks with "Could not send message right now" (this happened in June 2026). If `ciprianrarau.com` is ever added and verified in Resend (requires a paid plan or replacing the domain), `RESEND_FROM` can move back to `noreply@ciprianrarau.com`. The deploy workflow's end-to-end contact check guards this either way.

Turnstile is wired into the legacy site but not the new contact form. To re-add, set `TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` and validate the token in `app/api/contact/route.ts`.

## Deployment

Push to `main` triggers `.github/workflows/deploy.yml`:

1. Typecheck + unit tests (`npm run typecheck`, `npm run test:unit`) — the build fails if either fails
2. Build Docker image from `./Dockerfile`
3. Push to Azure Container Registry (`vars.ACR_LOGIN_SERVER`)
4. Update Azure Container App revision (`vars.AZURE_CONTAINER_APP`)
5. Health check: poll `https://${FQDN}/` until 200 (max 150 seconds)
6. End-to-end contact form check: POST a real message to `/api/contact` and fail the deploy unless Resend delivers it (one short "Deploy check" email per deploy lands in the inbox as positive confirmation)
7. Discord failure notification via `secrets.DISCORD_WEBHOOK_CHIP_LUCA`

The Dockerfile listens on port **4321** to match the existing Container App ingress targetPort. If the ingress targetPort is changed, update `ENV PORT` in the Dockerfile to match.

OIDC authentication, no stored Azure credentials.

## Cross-linking with ideaplaces.com

Header and Footer link out to `ideaplaces.com`. The reverse link (ideaplaces.com → ciprianrarau.com) lives in the `ideaplaces-website` repo and should be added there separately.

## Style Guide

Live preview of the Clay & Code tokens at `/style-guide` would be a future addition. For now, the `_legacy-astro/src/pages/style-guide.astro` is a reference for what to rebuild.

## Image Generation

Images for posts can be generated via the Gemini Image API. The script `_legacy-astro/scripts/generate-image.sh` uses `gemini-3-pro-image-preview` (default) and accepts a prompt + output path. Port to `scripts/` when needed.
