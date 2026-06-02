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

### Content rules

- **First person singular** (`I`, `my`, `me`). Not `we`.
- **No client names**: use generic terms (`a healthcare startup`, `a SaaS company`). Exceptions: WISK.ai, IdeaPlaces, well-known tools (AWS, Stripe, etc.).
- **No team member names** in prose.
- **No markdown tables** in posts that sync to Substack (Substack API does not support them).

## Environment Variables

Pulled at runtime by the Container App. Set in Azure Key Vault and bound as Container App secrets:

- `RESEND_API_KEY` — used by `/api/contact` and `/api/subscribe`
- `RESEND_AUDIENCE_ID` — newsletter audience
- `RESEND_FROM` — sender address (defaults to `Ciprian Rarau <noreply@ciprianrarau.com>`)
- `RECIPIENT_EMAIL` — contact form destination (defaults to `chip@ideaplaces.com`)

Turnstile is wired into the legacy site but not the new contact form. To re-add, set `TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` and validate the token in `app/api/contact/route.ts`.

## Deployment

Push to `main` triggers `.github/workflows/deploy.yml`:

1. Build Docker image from `./Dockerfile`
2. Push to Azure Container Registry (`vars.ACR_LOGIN_SERVER`)
3. Update Azure Container App revision (`vars.AZURE_CONTAINER_APP`)
4. Health check: poll `https://${FQDN}/` until 200 (max 150 seconds)
5. Discord failure notification via `secrets.DISCORD_WEBHOOK_CHIP_LUCA`

The Dockerfile listens on port **4321** to match the existing Container App ingress targetPort. If the ingress targetPort is changed, update `ENV PORT` in the Dockerfile to match.

OIDC authentication, no stored Azure credentials.

## Cross-linking with ideaplaces.com

Header and Footer link out to `ideaplaces.com`. The reverse link (ideaplaces.com → ciprianrarau.com) lives in the `ideaplaces-website` repo and should be added there separately.

## Style Guide

Live preview of the Clay & Code tokens at `/style-guide` would be a future addition. For now, the `_legacy-astro/src/pages/style-guide.astro` is a reference for what to rebuild.

## Image Generation

Images for posts can be generated via the Gemini Image API. The script `_legacy-astro/scripts/generate-image.sh` uses `gemini-3-pro-image-preview` (default) and accepts a prompt + output path. Port to `scripts/` when needed.
