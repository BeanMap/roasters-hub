# Project Status

> **This is the ONLY file that describes CURRENT reality.**
> Architecture docs (`docs/architecture/`) describe INTENT — what the system should look like.
> When they conflict with this file, **this file wins.**

---

## Last Updated
2026-05-18 21:30 | @AGENT — Code review fixes merged (6 PRs: ISR slug revalidation, UploadThing server-side limits, pagination filter preservation, N+1 → groupBy, admin auth consolidation, build hygiene). All @AGENT tasks completed.

---

## Confirmed Stack

| Warstwa | Technologia | Status |
|---------|-------------|--------|
| Framework | Next.js 16.2.1 (App Router) | ✅ deployed |
| DB | **Vercel Postgres (Neon)** | ✅ provisioned, 4 migrations (init + reviews + cafe + api_keys), 9 models, 50 seed roasters |
| ORM | Prisma 7.5 + @prisma/adapter-neon | ✅ schema ready, singleton active (`db`), Neon adapter configured |
| Auth | **Clerk** (`@clerk/nextjs`) | ✅ ClerkProvider in layout, sign-in/sign-up routes, clerkMiddleware, auth helpers |
| Storage | **Uploadthing** (MVP) → Cloudflare R2 (growth) | ✅ configured, route handler + dashboard upload UI |
| Hosting | Vercel | ✅ deployed |
| Email | Resend | ✅ 3 transactional emails (registration, verified, rejected) + newsletter digest |
| Analytics | Plausible | ✅ script tag gated by env var |
| i18n | **next-intl** | ✅ EN/PL/DE translations, `[locale]` routing, locale switcher (PR #59-61) |

---

## What Is Deployed and Working

- Homepage `/` — **ISR (1h)**, Prisma queries, fully styled
- Catalog `/roasters` — **ISR (1h)**, filters, search, pagination — Prisma queries
- Roaster profiles `/roasters/[slug]` — **ISR (1h)**, Prisma queries, related roasters
- Interactive map `/map` — **ISR (1h)**, Leaflet, Prisma queries for markers
- Registration form `/register` — 3-step wizard, **connected to Server Action** (creates PENDING roaster in DB)
- Admin panel UI `/admin/pending` — verify/reject UI, **connected to Server Actions**
- Profile event tracking — `trackEvent` Server Action records PAGE_VIEW, WEBSITE_CLICK, SHOP_CLICK, CONTACT_CLICK to `profile_events` table
- SEO country pages `/roasters/country/[country]` — **ISR (1h)**, `generateStaticParams`, Prisma queries
- Roaster dashboard `/dashboard/roaster` — profile editing, analytics stats, Clerk-protected
- Email notifications — Resend: registration notification, verify/reject emails (`lib/email.ts`)
- Reviews system — submit, approve/reject moderation, display on roaster profiles (`/admin/reviews`)
- Cafe accounts — CAFE role, save/unsave roasters (`/dashboard/cafe`)
- **Cafe Profiles** — `/cafes` catalog (ISR), `/cafes/[slug]` profile, `/register/cafe` 3-step wizard, `/admin/cafes` moderation, `/dashboard/cafe` owner panel, `/dashboard/saved-roasters`, map cafe pins + toggle, "Gdzie wypić" on roaster profiles, cafe CTA on homepage
- Partner API — `GET /api/v1/roasters`, `GET /api/v1/roasters/[slug]`, ApiKey auth (`lib/api-auth.ts`)
- Newsletter digest — `POST /api/newsletter/digest` (cron-triggered)
- PWA — manifest.json, apple-web-app meta, theme color
- **i18n** — `next-intl` with `[locale]` routing, full translations EN/PL/DE for all user/admin pages, redesigned locale switcher
- **Versioning:** `package.json` version displayed in footer, npm scripts `version:patch/minor/major`
- **Deploy:** https://beanmap-web.vercel.app (protected by Clerk auth on /admin routes)

---

## What Is Built But NOT Connected to Backend

| Feature | File | What's Missing |
|---------|------|----------------|
| ~~Newsletter signup~~ | ~~`web/src/app/page.tsx`~~ | **DONE** — connected to `subscribeNewsletter` action |

---

## What Does NOT Exist Yet (despite being documented in architecture docs)

_(All planned files now exist)_

**Removed (no longer needed):**
```
web/src/lib/supabase.ts       — NOT NEEDED (replaced by Clerk)
```

**Note:** `web/src/lib/db.ts` — Prisma singleton with Neon adapter, eksportuje `db`.

---

## Active Work

**@AGENT:** (brak — wszystkie zadania zrealizowane)

**@MN:** [IN PROGRESS] Taksonomia danych + Zasilenie bazy kawiarni w PL
**@MN:** [P1] Clerk Production environment — utworzenie Production instance w Clerk, podmiana kluczy w Vercel
**@MN:** [P1] Environment segregation audit — Uploadthing, Resend, Plausible klucze Dev vs Prod
**@MN:** [P1] Podpięcie domeny — DNS na Vercel, `beanmap.pl` wciąż na parkingu
**@MN:** [P1] Strony prawne — uzupełnienie placeholderów (NIP, REGON, adres, IOD)
**@MN:** [P3] Dark mode — pełna implementacja (tylko `dark:prose-invert` na legal pages)
**@MN:** [P3] SEO — `sitemap.ts`, `robots.ts`, JSON-LD structured data, canonical URLs, OG images
**@MN:** [P2] Fix regex phone extractora — `website.adapter.ts`
**@MN:** [P2] "List Your Cafe" — uspójnienie UX/copy z rejestracją palarni
**@MN:** [P2] SVG warianty logo

**Completed recently:**
- ✅ Code review fixes (2026-05-18, PRs #94-99):
  - ISR slug revalidation — `revalidateEntity()` helper, 6 sites fixed in `image.actions.ts` + `cafe.actions.ts`
  - UploadThing server-side limits — `userImage.onUploadComplete` validates before `db.image.create()`
  - Pagination preserves filters — `buildPageHref()` utility applied to `/roasters` + `/cafes`
  - N+1 → groupBy on country/city pages — single `review.groupBy()` instead of per-cafe loop
  - Admin auth consolidation — `requireAdminPage()` in layout gate, -56 duplicated lines across 14 pages
  - Build hygiene — removed empty root `package-lock.json`, fixed outdated `next.config.ts` comment
- ✅ Site Audit 2026-05-02 — all 12/14 issues fixed and verified on production (PR #77) (2026-05-03)
- ✅ Bot sign-up protection disabled in Clerk Dashboard — `/sign-up` works (2026-05-03)
- ✅ ROADMAP updated with Clerk Production + Infrastructure audit tasks (2026-05-03)
- ✅ i18n EN/PL/DE — `next-intl` with `[locale]` routing, full translations for all user/admin pages (~310 keys per locale), redesigned locale switcher with dark dropdown (PR #59-61) (2026-04-23)
- ✅ Data Consistency + Public Proposal Flow — Cafe.openingHours String→Json migration, OpeningHoursPicker component (Smart Monday), /suggest/cafe + /suggest/roastery public forms, admin cafe master editor (7 sections), admin roaster master editor (8 sections), nav CTAs "Zaproponuj miejsce" in header/footer/listings (2026-04-16)
- ✅ Enrichment UX Redesign — AdminNav global nav, run list w/ keywords/location inline, new run form w/ EnrichmentTag (persistent per entityType), split layout (EntityListPanel + EntityCard + SplitLayout), photo selection via Unsplash + UploadThing, single-click apply (applyEntityProposals), bulkApplyByConfidence, APPROVED status removed (2026-04-14)
- ✅ Enrichment Admin UI — `/admin/enrichment`: run history, new run form, entity-first proposal review, bulk approve by confidence, NAME_CHANGE modal, completeness score, apply Server Action, SlugRedirect model + 301 redirects (2026-04-13)
- ✅ Cafe Hierarchy & Map Thumbnails — coverImageUrl fallback on map, /cafes/country/[country], /cafes/country/[country]/city/[city], 4-level breadcrumb (2026-04-05)
- ✅ UX Quality Audit — 14 test scenarios on production, 28 PASS, 3 HIGH + 5 MEDIUM issues documented (`.tmp/ux-quality-audit-2026-04-04.md`) (2026-04-04)
- ✅ UX Consistency Audit — dedup reviews (47 removed), shared ReviewForm/ReviewList/StarRating, Polish→English, SVG viewBox, title fix (2026-04-04)
- ✅ Cafe addresses manual — 17 kawiarni z adresami i coords z Google Maps (2026-04-04)
- ✅ UX Polish: Cafe Amenities — icons on profile, multi-select filter in /cafes catalog (2026-04-03)
- ✅ UX Consistency: Header — "Browse Cafes" link + search placeholder update (2026-04-02)
- ✅ UX Consistency: /cafes — filtry kraju, wyszukiwanie, paginacja, breadcrumbs, result count (2026-04-02)
- ✅ UX Consistency: Cafe profile SEO — generateMetadata z nazwą kawiarni (2026-04-02)
- ✅ Cafe SEED data enhanced — 100 cafes from ECT with addresses, coords (83%), openingHours, serving[], services[] (2026-04-01)
- ✅ Cafe Profiles + Consumer Discovery — 12 tasków, 77 testów, branch feat/mn-cafe-profiles (2026-03-30)
- ✅ CR: Server Actions + Auth & middleware — 1 bug fixed (rejectRoaster revalidatePath) (2026-03-30)
- ✅ CR: Security audit — admin role check, javascript: XSS, Prisma images N+1 (2026-03-30)
- ✅ Unit tests: auth.test.ts + api-auth.test.ts — 47 tests total (2026-03-30)

---

## Next Unblocked Task

**TERAZ (@AGENT):** (brak — wszystkie zadania zrealizowane. Czekam na nowe taski od @MN.)

**TERAZ (MN):** [P1] Clerk Production — `sk_live_`/`pk_live_` klucze.
**TERAZ (MN):** [P1] Environment segregation — osobne tokeny Uploadthing/Resend dla dev.
**TERAZ (MN):** [P1] Podpięcie domeny — `beanmap.pl` na Vercel.
**TERAZ (MN):** [P3] SEO — `sitemap.ts`, `robots.ts`, JSON-LD structured data, canonical URLs, OG images.

**HUMAN ONLY blockers:** re-seed prod DB (`prisma db seed`), run new migrations on prod, buy production domain.

See `ROADMAP.md` for full task list.
