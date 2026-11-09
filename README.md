# LLM Review Pro

Production-ready blog for daily Large Language Model (LLM) coverage — news, features, comparisons, and tutorials. Built for Google AdSense quality standards and technical SEO.

**Stack:** Next.js 16 (App Router) + React 19 + TypeScript · SQLite (`better-sqlite3`, WAL) + Drizzle ORM · Tailwind CSS v4 · Markdown (unified/remark/rehype, sanitized) · PM2 + Nginx on a VPS.

---

## Quick start (local dev)

```bash
# 1. Install
npm install

# 2. Configure
cp .env.example .env
# Edit .env: SESSION_SECRET=$(openssl rand -base64 32)
# ADMIN_EMAIL / ADMIN_PASSWORD for the seed admin

# 3. Database
npm run db:setup
# runs: migrate (SQL) → seed (authors/categories/posts/pages) → hydrate (Markdown→HTML)

# 4. Run
npm run dev
# → http://localhost:3000 (site) · http://localhost:3000/admin/login (admin)
```

**Seed admin:** `admin@example.com` / `Admin123!` (from `.env` — change it).
**Sample content:** 5 LLM posts, 4 categories, 8 tags, 2 authors, 6 trust pages.

## Useful scripts

| Script | What it does |
|---|---|
| `npm run dev` | Next dev (Turbopack) |
| `npm run build` | Production build (SSG + ISR for posts) |
| `npm run start` | Start production server (PM2 in prod) |
| `npm run migrate` | Apply `migrations/*.sql` (idempotent) |
| `npm run seed` | Seed demo data + admin user |
| `npm run hydrate` | Re-render stored Markdown → HTML caches |
| `npm run setup-admin` | Create/update admin from env |
| `npm run backup` | One-off DB backup (`VACUUM INTO`) |
| `npm run publish` | Publish due scheduled posts (cron) |

## Project structure

```
app/
  layout.tsx              Root layout: fonts, JSON-LD (WebSite+Organization), Header/Footer, consent
  page.tsx                Home (hero, featured, latest grid, category sections)
  blog/                   Index + [slug] post (TOC, FAQ, breadcrumbs, related, prev/next, OG image)
  category/[slug]/, tag/[slug]/, author/[slug]/   Paginated listings
  search/, archive/       Server-side search (noindex), month archive
  about/, privacy-policy/, terms-of-service/, disclaimer/, cookie-policy/, editorial-policy/
                          Trust pages (Markdown from DB, editable in /admin/pages)
  contact/                Form (Server Action, honeypot, rate-limited)
  not-found.tsx           Custom 404 with popular posts (no ads)
  sitemap.ts, robots.ts   Dynamic sitemap (lastmod) + robots.txt
  feed.xml/route.ts, ads.txt/route.ts
  opengraph-image.tsx     Global OG image; blog/[slug]/opengraph-image.tsx is per-post
  admin/
    login/                Public login (rate-limited, bcrypt, JWT cookie)
    (protected)/          Auth layout + dashboard, posts (editor + SEO checklist),
                          categories, tags, authors, media, pages, messages,
                          settings, backup
  api/                    preview (Markdown→HTML), upload (→WebP), backup, views, revalidate
components/
  AdSlot.tsx              Lazy, CLS-safe ad unit (renders only after consent)
  CookieConsent.tsx       First-party banner; loads AdSense only after accept
                          (or Google CMP via NEXT_PUBLIC_GOOGLE_CMP_URL)
  PostCard, Pagination, Breadcrumbs, TableOfContents, ShareButtons, …
lib/
  site.ts  env-driven site config + ads toggles
  db.ts / schema.ts / queries.ts   SQLite + Drizzle; published-only public reads
  auth.ts / dal.ts       jose JWT sessions + Data Access Layer
  markdown.ts            unified pipeline (GFM, slug, highlight, sanitize) + TOC/FAQ parse
  seo.ts                 Metadata builders + JSON-LD (Article, FAQPage, Breadcrumb, Person…)
  validators.ts          Zod schemas for every mutation
  rate-limit.ts          In-memory sliding window (login, contact)
scripts/
  migrate.mjs seed.mjs hydrate-html.mjs setup-admin.mjs backup.mjs publish-scheduled.mjs
migrations/001_init.sql  Full schema + indexes + FKs
deploy/nginx.conf        HTTPS (Let's Encrypt), www redirect, gzip/brotli, caching
ecosystem.config.js       PM2 (single instance — required for SQLite WAL)
DEPLOYMENT.md             Step-by-step Ubuntu VPS guide
```

## Content model

Markdown stored in `posts.content`; `content_html` is a render cache for fast TTFB. Save hydrates HTML + reading time, snapshots a revision, and adds a 301 redirect when the slug changes. Public reads enforce `status='published' AND published_at <= now` so drafts never leak (or reach sitemap).

## SEO (built-in)

- `generateMetadata` everywhere: unique title/description/canonical/OG/Twitter, `lang="en"`.
- JSON-LD: `WebSite` (+`SearchAction`), `Organization`, `Article`, `BreadcrumbList`, `Person`, `FAQPage` (when FAQ present).
- Dynamic `sitemap.xml` (with `lastmod`), `robots.txt`, `feed.xml` (RSS 2.0), per-post `opengraph-image` (next/og).
- ISR + `generateStaticParams` for posts (`revalidate` 1d, `revalidatePath` on save); semantic HTML, WCAG AA, `next/image` sizes, lazy below-fold images.
- `noindex`: search results, admin, tag pages with <3 posts, per-post toggle.

## AdSense readiness

- `<AdSlot />`: reserved height (no CLS), lazy via `IntersectionObserver`, ≤3/page, never on admin/404/search/thin pages, per-post `allowAds` opt-out.
- Consent: first-party banner (localStorage + cookie, `llmreviewpro:consent` event); AdSense script loads **only after accept**. Set `NEXT_PUBLIC_GOOGLE_CMP_URL` for a Google-certified CMP (EEA/UK/CH).
- `/ads.txt` from `NEXT_PUBLIC_ADSENSE_PUB_ID`; verification meta from `NEXT_PUBLIC_ADSENSE_VERIFICATION`. Global toggle `NEXT_PUBLIC_ADS_ENABLED`.

## Admin (`/admin`)

Login (bcrypt + httpOnly JWT, 7-day, rate-limited 10/15 min). Dashboard (counts, recent, top-by-views). Posts: create/edit/delete/duplicate, draft/scheduled/published/archived, Markdown editor + live preview + WebP upload, per-post SEO fields + live checklist. Manage categories/tags/authors/pages, media library, contact inbox, revisions, settings, one-click backup (`/api/backup` + `VACUUM INTO`).

Scheduled publishing: `scripts/publish-scheduled.mjs` via cron every 5 min (see `DEPLOYMENT.md`).

## Security & performance notes

- Zod on every mutation, `rehype-sanitize` on render (strips scripts/handlers, AdSense-CSP compatible), CSP + HSTS + `X-Frame-Options` etc. in `next.config.ts`, upload MIME/size checks (5 MB), honeypot + rate limits on contact/login.
- Daily backup: `cron → node scripts/backup.mjs` (keeps 14 days). One-click export in `/admin/backup`.

## Deploy

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for the full Ubuntu VPS runbook (Node 20, PM2, Nginx, Let's Encrypt, cron).

## License

Proprietary — all rights reserved. Replace sample data before public launch.
