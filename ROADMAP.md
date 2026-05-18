# Roadmap

Framework: **Now / Next / Later** — nie sprinty. Maksymalnie 5 zadań w NOW.

Kanon stanu zadań: ten plik. Aktualizuj po każdej sesji (agent lub developer).

**Assignees:** `(@MN)` Marek Nadra · `(@AGENT)` scheduled agent · `(@UNASSIGNED)` wolne do wzięcia
**Status:** `[IN PROGRESS]` · `[BLOCKED: reason]` — dodaj przed tagiem assignee

---

## NOW

### UX Consistency: Roasters ↔ Cafes — (@AGENT) ✅ **COMPLETE** (merged to main)

> **Session:** 2026-04-02 — Audit wykonał: Playwright MCP + kod review
> **Branch:** `feat/ux-consistency-cafes` (merged)
> **Status:** 17/19 HIGH+MEDIUM done. 2x P3 przeniesione do NEXT.

**HIGH Priority (krytyczne niespójności):**
- [x] [P1] **Header: Browse Cafes link** — dodać `/cafes` do nawigacji głównej (Header.tsx) — brak discovery dla kawiarni ✅
- [x] [P1] **/cafes: filtry i wyszukiwanie** — dodać filtry kraju, search, paginację — parzystość z `/roasters` ✅
- [x] [P1] **/cafes: zdjęcia** — seed zdjęć dla kawiarni (Unsplash images) ✅
- [x] [P1] **Cafe profile: "0 roasters"** — seed relacje CafeRoasterRelation ✅
- [x] [P1] **Cafe profile: SEO title** — napraw `<title>` z nazwą kawiarni (obecnie generic "Bean Map — Discover...") ✅

**MEDIUM Priority (ulepszenia):**
- [x] [P2] **Global search placeholder** — "Find a roaster..." → "Search roasters & cafes..." ✅
- [x] [P2] **Homepage hero** — "Discover the world's specialty coffee roasters" → bardziej inclusive ✅
- [x] [P2] **Homepage stats** — dodać "X Cafes" do statystyk ✅
- [x] [P2] **Cafe profile: hero image** — dodano zdjęcie na górze profilu ✅
- [x] [P2] **Cafe profile: breadcrumbs** — Home › Cafes › [City] › Name ✅
- [x] [P2] **Map page title** — "Coffee Roasters Map" → "Coffee Roasters & Cafes Map" ✅
- [x] [P2] **Map sidebar header** — "50 beans" → "50 roasters" ✅
- [x] [P2] **Cafe description** — unikalne opisy dla każdej kawiarni ✅

**LOW Priority (nice-to-have):**
- [x] [P3] **Footer: Browse Cafes** — dodać link do stopki ✅
- [x] [P3] **Cafe verified badge** — badge weryfikacji na kartach kawiarni ✅
- [x] [P3] **Register CTA** — "List Your Cafe" obok "List Your Roastery" ✅
- [x] [P3] **Social proof** — "Gdzie wypić" sekcja na profilu palarni ✅

---

### Code Review — (@MN)

- [x] [P1] **CR: Server Actions** — review `web/src/actions/*.ts` — walidacja Zod, error handling, revalidatePath, auth guards (@MN)
- [x] [P1] **CR: Auth & middleware** — review `web/src/middleware.ts` + `web/src/lib/auth.ts` — route protection, edge cases, Clerk best practices (@MN)
- [x] [P2] **CR: Prisma queries** — review wszystkich `db.*` wywołań — N+1, brakujące select/include, indeksy, error handling (@MN)
- [x] [P2] **CR: Komponenty UI (agent-generated)** — review kodu generowanego przez agenta — accessibility, semantyczny HTML, reużywalność (@MN)
- [x] [P2] **CR: Security audit** — env vars exposure, CSRF w Server Actions, upload validation, XSS w user content (@MN)

### Site Audit — 2026-04-24 — (@AGENT)

> **Report:** `.tmp/audit-2026-04-24.md`
> **Wykonane:** 2026-04-24 — Pełny audyt usability via Playwright MCP (8 stron, 3 viewporty, 3 flow testy)

**CRITICAL:**
- [x] [CRITICAL] **/register zwraca 500 (biały ekran)** — naprawiono: `Footer.tsx` używał `getTranslations` w "use client" page → zamieniono na `useTranslations` (2026-04-25) (@AGENT)
- [x] [CRITICAL] **/register/cafe biały ekran + zły `<title>`** — naprawiono: ten sam root cause co powyżej + dodano osobny layout z `title: "Register Your Cafe"` (2026-04-25) (@AGENT)

**HIGH:**
- [x] [HIGH] **Mapa: 25 obrazków bez `alt`** — naprawiono: `MutationObserver` w `RoasterMap.tsx` dodaje `alt=""` do `img.leaflet-tile` (2026-04-25) (@AGENT)
- [x] [HIGH] **Mapa: dropdown "+ Add a place" zasłonięty przez warstwę mapy** — naprawiono: zwiększono z-index Header do `z-[1000]` i dropdown menu do `z-[1001]` (Leaflet pane ma z-index 400) (2026-04-25) (@AGENT)

**MEDIUM:**
- [x] [MEDIUM] **manifest.json 404 na każdej stronie** — zweryfikowano: manifest działa poprawnie na beanmap.pl i beanmap-web.vercel.app; audyt 2026-04-24 false positive (307 redirect Vercel → www) (2026-05-04) (@AGENT) ✅

### Site Audit — 2026-05-02 — (@AGENT) ✅ **FIXED** (PR #77 merged to main)

> **Report:** `.tmp/audit-2026-05-02.md`
> **Wykonane:** 2026-05-02 — Test rejestracji palarni, kawiarni i zakładania konta na `beanmap.pl` (Playwright MCP)
> **Session:** 2026-05-03 — @AGENT naprawił 12/14 problemów (3 CRITICAL, 5 HIGH, 4 MEDIUM). Turnstile wyłączone przez @MN w Clerk Dashboard.
> **Branch:** `feat/agent-2026-18` (merged)
> **Status:** Wszystkie CRITICAL + HIGH + MEDIUM naprawione i zweryfikowane na produkcji

**CRITICAL:**
- [x] [CRITICAL] **/sign-in zwraca HTTP 500** — naprawiono: root layout guarduje `getLocale()`/`getTranslations()` try-catch dla locale-free routes (2026-05-03) (@AGENT)
- [x] [CRITICAL] **/sign-up blokowany przez Cloudflare Turnstile** — naprawiono: wyłączone Bot sign-up protection w Clerk Dashboard (2026-05-03) (@MN)
- [x] [CRITICAL] **/register/cafe wymaga logowania, /register nie** — naprawiono: usunięto `useAuth()` z cafe page; `createCafe` przyjmuje opcjonalny `userId`; rejestracja kawiarni działa bez logowania jak palarnia (2026-05-03) (@AGENT)

**HIGH:**
- [x] [HIGH] **Brak linku "Sign in" w headerze** — naprawiono: dodano `<SignedIn>`, `<SignedOut>`, `<SignInButton>`, `<UserButton>` w Header.tsx desktop + mobile (2026-05-03) (@AGENT)
- [x] [HIGH] **/register/cafe — brak "| Bean Map" w tytule** — naprawiono: explicit title "Register Your Cafe | Bean Map" w layout.tsx (2026-05-03) (@AGENT)
- [x] [HIGH] **/register/cafe — placeholder'y "roastery"** — naprawiono: dodano cafe-specific klucze (`cafeWebsitePlaceholder` itd.) do namespace register EN/PL/DE (2026-05-03) (@AGENT)
- [x] [HIGH] **/register/cafe — podwójna strzałka "← ← Back"** — naprawiono: usunięto hardcodowane `←` (2026-05-03) (@AGENT)
- [x] [HIGH] **/register/cafe — podsumowanie nie pokazuje adresu i opisu** — naprawiono: dodano description, address, phone, email, lat/lng do review step (2026-05-03) (@AGENT)

**MEDIUM:**
- [x] [MEDIUM] **/register/cafe — brak wizualnych wskaźników kroków** — naprawiono: zastąpiono progress bar numerowanymi kółkami (zgodnie z `/register`) (2026-05-03) (@AGENT)
- [x] [MEDIUM] **/register/cafe — brak pola Email** — naprawiono: dodano email do form state, Step 2, FormData i CreateCafeSchema (2026-05-03) (@AGENT)
- [x] [MEDIUM] **Search toggle zawsze domyślnie "Search cafes"** — naprawiono: HeaderSearch dostaje `pathname` i domyślnie ustawia roasters na `/roasters` i `/register` (2026-05-03) (@AGENT)

---

## NEXT

### Cafe Seed — Manual Enrichment — (@MN)

- [x] [P2] **Cafe addresses manual** — uzupełnienie adresów i coords dla 17 kawiarni (plik `.tmp/cafes_to_complete.json`), Google Maps lookup, aktualizacja SEED (~30min) (@MN) ✅

### Cafe Profiles + Consumer Discovery — (@AGENT)

> **Spec:** `docs/superpowers/specs/2026-03-30-cafe-consumer-discovery-design.md`
> **Plan:** `docs/superpowers/plans/2026-03-30-cafe-consumer-discovery.md`
> **Wywołanie:** `/superpowers:subagent-driven-development docs/superpowers/plans/2026-03-30-cafe-consumer-discovery.md`

- [x] [P1] **DB: Cafe + CafeRoasterRelation** — Prisma schema (Cafe, CafeRoasterRelation models), extend Review z cafeId, extend UserProfile z cafeId, extend Roaster z servedAt, migracja (@MN)
- [x] [P1] **Actions: cafe CRUD + admin + relations** — createCafe, updateCafe, verifyCafe, rejectCafe, addCafeRoasterRelation, removeCafeRoasterRelation, extend review.actions dla kawiarni — z testami Vitest (@MN)
- [x] [P1] **UI: /cafes catalog + /cafes/[slug] profile** — CafeCard, CafeReviewForm, CafeReviewList, ISR 3600s (@MN)
- [x] [P1] **UI: /register/cafe wizard** — 3-step analogiczny do /register/roaster (@MN)
- [x] [P2] **UI: Admin /admin/cafes + extend /admin/reviews** — panel moderacji kawiarni, zakładka "Kawiarnie" w reviews (@MN)
- [x] [P2] **UI: /dashboard/cafe owner panel** — zarządzanie relacjami z palarniami, przeniesienie saved-roasters na /dashboard/saved-roasters (@MN)
- [x] [P2] **UI: Mapa + Roaster profile + Homepage** — piny kawiarni z toggle, sekcja "Gdzie wypić" na /roasters/[slug], CTA na homepage (@MN)

### UX Consistency Audit — 2026-04-04 — (@AGENT) ✅ **COMPLETE** (PR #32 merged)

> **Session:** 2026-04-04 — Full UX audit via Playwright MCP across 6 pages
> **Report:** `.tmp/audit-2026-04-04.md`
> **Branch:** `feat/ux-consistency-audit-2026-04-04` (merged)
> **Status:** All 5 CRITICAL+HIGH issues fixed and verified on production

- [x] [CRITICAL] **Duplicate reviews on profiles** — seed_reviews.ts run multiple times, no unique constraint on Review model → every review appears 2x on roaster AND cafe profiles (@AGENT) ✅
- [x] [HIGH] **Polish text in roaster profile** — "Gdzie wypić" + empty state in Polish, rest of UI in English (`roasters/[slug]/page.tsx:206,209`) (@AGENT) ✅
- [x] [HIGH] **SVG viewBox typo on /cafes** — `viewBox="0 0 2424"` instead of `"0 0 24 24"` in CafeFilters.tsx:72 → console error (@AGENT) ✅
- [x] [HIGH] **Title duplication on cafe pages** — "| Bean Map | Bean Map" because cafe metadata already includes "| Bean Map" and layout template adds another (@AGENT) ✅
- [x] [HIGH] **Unify review UX** — completely different review forms/lists for roasters vs cafes (star hover vs number buttons, different layouts, date formats, text casing) (@AGENT) ✅

### UX Polish — Cafe Amenities — (@AGENT) ✅ **COMPLETE**

> Przeniesione z UX Consistency — niski priorytet, nice-to-have.

- [x] [P3] **Cafe amenities icons** — ikony dla Wi-Fi, Vegan, etc. na profilu kawiarni (@AGENT) ✅
- [x] [P3] **Cafe amenities filter** — filtr po amenities w katalogu /cafes (@AGENT) ✅

### UX Quality Audit — 2026-04-04 — (@AGENT) ✅ **FINDINGS IMPLEMENTED**

> **Session:** 2026-04-04 — Full UX quality test via Playwright MCP on production
> **Report:** `.tmp/ux-quality-audit-2026-04-04.md`
> **Audit verification:** 2026-04-24 — code review confirmed all HIGH + 4/5 MEDIUM items exist in codebase
> **Status:** 3 HIGH + 4 MEDIUM implemented in code; 1 MEDIUM remaining

**HIGH Priority:**
- [x] [HIGH] **Cafe profile: Save/Bookmark feature** — `SaveCafeButton`, `saved-cafe.actions.ts`, `isCafeSaved` helper (@AGENT) ✅
- [x] [HIGH] **Cafe profile: sticky sidebar / contact card** — sticky aside with contact info, Website/Instagram/Phone links on `/cafes/[slug]` (@AGENT) ✅
- [x] [HIGH] **Cafe profile: analytics tracking** — `CafeProfileTracker`, `CafeTrackedLink` for PAGE_VIEW, WEBSITE_CLICK, CONTACT_CLICK (@AGENT) ✅

**MEDIUM Priority:**
- [x] [MEDIUM] **Title duplication on /register** — `register/layout.tsx` uses clean title "Register Your Roastery" (@AGENT) ✅
- [x] [MEDIUM] **Map H1 inconsistency** — map page title and H1 unified (audited via code) (@AGENT) ✅
- [x] [MEDIUM] **Cafe profile: cover image** — `coverImageUrl` in Prisma query + `<Image>` in cafe profile header, dashboard upload supported (@AGENT) ✅
- [x] [MEDIUM] **Cafe profile: VerifiedBadge** — `VerifiedBadge` rendered on cafe profile hero for VERIFIED cafes (@AGENT) ✅
- [x] [MEDIUM] **Mobile filters: search always visible** — move search input outside collapsible filters on mobile; keep other filters collapsed (`RoasterFilters.tsx`, `CafeFilters.tsx`) (@AGENT) ✅

### Map & Search UX Overhaul — (@MN)

> **Spec:** `docs/superpowers/specs/2026-04-05-map-search-ux-overhaul-design.md`
> **Plan:** `docs/superpowers/plans/2026-04-05-map-search-ux-overhaul.md`

- [x] [P1] **Header search: pill toggle Roasters/Cafes** — toggle wewnątrz inputa, dynamiczny placeholder, redirect do właściwej strony, localStorage sync (`components/shared/Header.tsx`) (@MN)
- [x] [P1] **Map sidebar: toggle + cafe list + cafe filters** — zastąpienie nagłówka sidebara togglem, tryb Cafes z listą kawiarni i filtrami amenities, naprawienie martwych chipów w trybie Roasters (`app/map/MapContent.tsx`) (@MN)
- [x] [P2] **Map page: extend cafe query** — dodanie `logoUrl` do select w zapytaniu cafes (`app/map/page.tsx`) (@MN)

### Cafe Hierarchy & Map Thumbnails — (@AGENT)

> **Spec:** `docs/superpowers/specs/2026-04-05-cafe-hierarchy-thumbnails-design.md`
> **Plan:** `docs/superpowers/plans/2026-04-05-cafe-hierarchy-thumbnails.md`

- [x] [P1] **Map thumbnails: coverImageUrl fallback** — add `coverImageUrl` to map query, use as fallback in `CafeMapCard` (`app/map/page.tsx`, `app/map/MapContent.tsx`) (@AGENT) ✅
- [x] [P1] **Cafe country listing page** — `/cafes/country/[country]` with city browse section, ISR 3600s (@AGENT) ✅
- [x] [P1] **Cafe city listing page** — `/cafes/country/[country]/city/[city]` with slug-based routing, ISR 3600s (@AGENT) ✅
- [x] [P2] **Cafe profile breadcrumb** — 4-level hierarchy: Home > Cafes > Country > City > Name (`cafes/[slug]/page.tsx`) (@AGENT) ✅

### Admin Dashboard — (@MN)

- [x] [P1] **Admin: dashboard statystyk** — widok `/admin` z licznikami statusów, page views 30d/all-time, tiles nawigacyjne, tabela ostatnich 10 rejestracji (@MN) ✅
- [x] [P2] **Admin: panel palarni** — `/admin/roasters` z filtrami statusu, sortowaniem newest/oldest, paginacją 25/page, liczbą views per palarnia (@MN) ✅
- [x] [P2] **Admin: logi aktywności** — `/admin/activity`: ostatnie 50 rejestracji, 50 admin notes, top 10 profili po PAGE_VIEW (30d) (@MN) ✅

### Logotyp — (@MN)

- [x] [P1] **Logotyp Bean Map** — implementacja PNG (wariant jasny), podmiana placeholder w Header, favicon + apple-icon wygenerowane z bean pin (@MN) ✅

### Look & Feel — (@MN)

- [x] [P2] **Typography: custom font pair** — Fraunces (display) + Source Sans 3 (body) przez next/font/google (@MN) ✅
- [x] [P2] **Landing polish: icon system + hero CTA + header search** — reużywalne ikony bean/cup (flat SVG), powiększona wyszukiwarka w Headerze, ujednolicenie 3 CTA w hero, podmiana ikon w community section, logo Header 65px (@MN) ✅
- [x] [P2] **UI polish: hover states + transitions** — spójne micro-animations na kartach, buttonach, nawigacji (@MN) ✅ (2026-05-16 audit: 390+ patterns across 30+ components)
- [ ] [P3] **Dark mode** — Tailwind dark: variant, persystencja preferencji (localStorage + system pref) (@MN) (tylko `dark:prose-invert` na stronach prawnych)

### SEO & Meta — (@MN)

- [ ] [P3] **CR: SEO & meta** — review `generateMetadata`, canonical URLs, structured data (JSON-LD), sitemap completeness (@MN)

### Testing — (@MN)

- [ ] [P2] **Coverage reporting** — `vitest --coverage` (v8 provider) + Codecov (free) → % pokrycia widoczny w każdym PR (~1h) (@MN)
- [ ] [P2] **Testy Server Actions** — integration testy dla `createRoaster`, `verifyRoaster`, `rejectRoaster` — mock Clerk + prawdziwa baza Neon (~4h) (@MN)
- [ ] [P3] **E2E Playwright** — implementacja specs na bazie `docs/testing/journeys/` (22 misji, 5 ról); środowisko: Vercel Preview URL; CI job na `push: main`; plan w `docs/testing/e2e/README.md` (@MN)
- [x] [P2] **Neon Preview Branches** — izolowana baza per PR/preview deployment (@MN) ✅ (3 workflowy: `preview-db.yml`, `ci.yml` ephemeral, `neon-cleanup.yml`; używają programmatic API — GitHub Integration nie jest wymagane)

### Testing Documentation — (@AGENT) ✅ **VERIFIED** (2026-05-04)

> **Weryfikacja 2026-05-04:** Wszystkie zadania były już zrealizowane — dokumentacja testowa pokrywa funkcje kawiarni.

- [x] [P2] **Testing docs: Feature Matrix** — 16+ wpisów cafe w `docs/testing/README.md` Feature Visibility Matrix ✅ (już istniały)
- [x] [P2] **Testing docs: Journey 03 rewrite** — `docs/testing/journeys/03-cafe.md` ma 4 misje (rejestracja, dashboard, relacje, saved roasters) ✅
- [x] [P2] **Testing docs: Journey 01 extend** — ma misję D (katalog kawiarni), E (profil kawiarni) ✅
- [x] [P3] **Testing docs: Journey 02 extend** — ma misję C ("Gdzie wypić") ✅
- [x] [P2] **Testing docs: Journey 04 extend** — ma misję D (weryfikacja kawiarni), E (odrzucenie kawiarni), rozszerzone C (cafe reviews tab) ✅
- [x] [P3] **Testing docs: Journey 05 extend** — ma misję B (recenzja kawiarni) ✅
- [x] [P2] **Testing docs: E2E README** — ma mapę specs cafe-registration, cafe-dashboard, admin-cafes, guest-cafes, cafe-review ✅
- [x] [P3] **Testing docs: E2E skeletons** — szkielety speców istnieją w `docs/testing/e2e/` (4 pliki, `test.skip`); do implementacji w `web/e2e/specs/journeys/` (@UNASSIGNED)

### Enrichment Engine — (@MN)

- [x] [P1] **Naprawa auth w API enrichment** — session claims zamiast currentUser() w requireAdmin(); Clerk Dashboard: session token z `{{user.public_metadata}}` (@MN)
- [x] [P2] **Testy E2E enrichment API** — ECT consent gate ✅, OSM discover Warsaw (3 places, 18 proposals) ✅, website enrich (1 cafe, 2 proposals) ✅ (@MN)
- [x] [P2] **Admin UI enrichment** — `/admin/enrichment`: historia runów, formularz new run, entity-first review z proposals, bulk approve by confidence, NAME_CHANGE modal z slug impact, completeness score, apply Server Action, SlugRedirect model + 301 redirects (@MN)
- [ ] [P2] **Fix regex phone extractora** — website adapter wyciąga nieprawidłowe wartości np. "1.15045.0" zamiast numeru telefonu (@MN)

### Data Strategy & Taxonomy — (@MN)

- [IN PROGRESS] [P1] **Taxonomia danych: palarnie i kawiarnie** — definicja jakie elementy pokazujemy na profilach palarni vs kawiarni; na co zwracamy uwagę; co jest ważne dla każdego typu (@MN)
- [IN PROGRESS] [P1] **Zasilenie bazy kawiarni w PL** — skalowalne zasilenie bazy kawiarniami w Polsce; projekt procesu skalowalnego na inne kraje (@MN)
- [ ] [P2] **Zdjęcia realne: palarnie i kawiarnie** — zebranie i dodanie realnych zdjęć do profili palarni i kawiarni (@MN)

### Legal & Compliance — (@MN)

- [IN PROGRESS] [P1] **Aspekt prawny scrapowania danych** — research jak legalnie pozyskiwać dane o kawiarniach/palarniach (GDPR, robots.txt, ToS, scraperzy vs API) (@MN)
- [x] [P1] **Cookie policy, regulamin, polityka prywatności** — implementacja stron prawnych zgodnych z AI Act + GDPR (@MN) ✅ (4 strony: cookies, privacy, terms, impressum; PL+EN; zlinkowane w Footer; placeholdery do uzupełnienia: NIP, REGON, adres, IOD)

### Data Consistency + Public Proposal Flow — (@MN)

> **Spec:** `docs/superpowers/specs/2026-04-15-cafe-roastery-data-consistency-design.md`
> **Zakres:** Uspójnienie pól schema ↔ formularze, publiczny flow "Zaproponuj miejsce", admin panel jako master editor, komponent OpeningHoursPicker

- [x] [P1] **Schema: migracja `Cafe.openingHours` String→Json + usunięcie duplikatu `cafe-services.ts`** — Prisma migration, cleanup importów (@MN) ✅
- [x] [P1] **Komponent `OpeningHoursPicker`** — `web/src/components/shared/OpeningHoursPicker.tsx` — row-per-day, Smart Monday propagacja Pon→Pt, selekty 15-min, reużywany w formularzach i adminie (@MN) ✅
- [x] [P1] **UI: `/suggest/cafe` + `/suggest/roastery`** — accordion (3 sekcje: wymagane / kontakt / szczegóły), `ProposeCafeSchema`, `ProposeRoasterSchema`, server actions bez auth, success state in-place, `/frontend-design` + `/form-cro` + `/tailwind-patterns` (@MN) ✅
- [x] [P2] **Admin master editor: kawiarnie** — sidebar 7 sekcji (Tożsamość / Lokalizacja / Kontakt / Godziny / Serwisy / Zdjęcia / Admin), wszystkie pola ze schematu, unsaved-changes warning, admin hints per field, `/frontend-design` (@MN) ✅
- [x] [P2] **Admin master editor: palarnie** — sidebar 8 sekcji, analogicznie do kawiarni, wszystkie pola ze schematu (@MN) ✅
- [x] [P2] **Nawigacja: CTA "Zaproponuj miejsce"** — dropdown w Header ("Mam palarnię" → /register vs "Znam świetne miejsce" → /suggest), banery na listingach /cafes i /roasters, linki w Footer (@MN) ✅

### UX Improvements — (@MN)

- [ ] [P2] **"List Your Cafe" — uspójnienie z palarnią** — wyrównanie UX/copy flow rejestracji kawiarni do standardu rejestracji palarni (@MN)
- [ ] [P2] **UX improvements: automatyzacja + manualne + Robson** — zmiany UX wynikające z feedbacku (Robson) i audytu; automatyzacja + ręczne poprawki (@MN)

### Infrastructure — (@MN)

- [ ] [P1] **Clerk Production environment** — utworzenie środowiska Production w Clerk Dashboard (obecnie tylko Development z `sk_test_`); podmiana kluczy w Vercel na `pk_live_`/`sk_live_`; konfiguracja Attack Protection dla Production; przekonfigurowanie Google OAuth redirect URI (@MN)
- [ ] [P1] **Environment segregation: Uploadthing** — stworzyć osobny Uploadthing app dla dev; podmienić `UPLOADTHING_TOKEN` w `.env.local` na klucz dev (obecnie `sk_live_` wszędzie — dev testy uploadują do produkcji) (@MN)
- [ ] [P1] **Environment segregation: Resend** — założyć `re_test_...` klucz w Resend dla dev; podmienić `RESEND_API_KEY` w `.env.local`; ustawić `ADMIN_EMAIL` na produkcji (obecnie nieustawione — admin nie dostaje powiadomień) (@MN)
- [ ] [P2] **Environment segregation: Plausible** — przy wdrożeniu analityki: osobny site ID dla dev i prod (obecnie nieaktywne — Phase 2) (@MN)
- [x] [P2] **Bug: Cafe dashboard używa złego Uploadthing endpointa** — `web/src/app/dashboard/cafe/client.tsx:170` używa `endpoint="roasterImage"` zamiast `cafeImage`; dedykowany endpoint cafeImage istnieje ale jest nieużywany (@AGENT) ✅
- [x] [P1] **Podpięcie domeny** — zakup domeny + konfiguracja DNS w Vercel (@MN) ✅
- [ ] [P2] **Maile firmowe (cafe)** — konfiguracja firmowych skrzynek email dla kawiarni (@MN)

### i18n: PL / EN / DE — (@AGENT) ✅ **COMPLETE**

- [x] [P2] **Wersja PL/EN/DE (modułowo)** — modułowa implementacja i18n (`next-intl`): architektura, routing per locale, tłumaczenia PL/EN/DE dla wszystkich stron użytkownika i admina; locale switcher redesign (PR #59-61) (@AGENT) ✅

### UX Enhancement — Images, Geocoding, Reviews — (@AGENT)

> **Spec:** `docs/superpowers/specs/2026-05-04-ux-enhancement-design.md`
> **Zakres:** Wspólny model Image (zastępuje RoasterImage), geokodowanie adresów przez Nominatim, autouzupełnianie adresu, pula zdjęć domyślnych admina, upload zdjęć przez użytkowników z kolejką zatwierdzania, recenzje tylko dla zalogowanych (userId zamiast authorName), galeria zdjęć na profilach, lightbox, drag-and-drop sortowanie, konfigurowalne limity.

- [x] [P1] **DB: Image + AppSettings + Review zmiany** — nowy model `Image` (entityType, status, isDefault, isPrimary), `AppSettings` (limity), `Review.userId` + unique constraints (@AGENT) ✅ ~~⚠️ `RoasterImage` wciąż istnieje obok `Image` — do zmigrowania~~
- [x] [P1] **Migracja `RoasterImage` → `Image`** — usunięcie starego modelu, aktualizacja endpointów (`uploadthing/core.ts`, `roaster.actions.ts`), typów (`MapContent.tsx`), seedów (`seed.ts`), migracja SQL (@AGENT) ✅ (2026-05-16)
- [x] [P1] **lib/geocoding.ts** — wrapper Nominatim: `geocodeAddress()`, `searchAddress()`, rate limiting 1 req/s, User-Agent header (@AGENT) ✅
- [x] [P1] **AddressAutocomplete + MiniMap** — komponenty: debounced input z dropdown sugestii, statyczna mapka Leaflet z pinezką potwierdzającą współrzędne (@AGENT) ✅
- [x] [P1] **Integracja autocomplete we wszystkich formularzach** — register/cafe, register/roaster (nowy krok adresu), admin detail (LocationSection), dashboard (@AGENT) ✅
- [x] [P1] **Image actions** — `uploadImage`, `approveImage`, `rejectImage`, `deleteImage`, `setPrimaryImage`, `reorderImages`, `addDefaultImage` (@AGENT) ✅
- [x] [P1] **UploadThing: defaultImage + userImage** — nowe endpointy, admin-default pool, user upload z PENDING statusem (@AGENT) ✅
- [x] [P2] **/admin/images** — zarządzanie pulą domyślną: grid, upload, delete, filter (CAFE/ROASTER), max 20 (@AGENT) ✅
- [x] [P2] **/admin/images/pending** — kolejka zatwierdzania: lista miniaturek, Approve/Reject, powód odrzucenia (@AGENT) ✅
- [x] [P2] **/admin/settings** — konfiguracja limitów: `imageMaxTotal`, `imageMaxPerUser`, `imageMaxPerOwner`, `defaultPoolMax` (@AGENT) ✅
- [x] [P2] **Dashboard: sekcja Gallery** — upload zdjęć przez właściciela (max 3), drag-and-drop sortowanie, ustawianie isPrimary, usuwanie (@AGENT) ✅
- [x] [P1] **Review auth gate** — `ReviewForm` tylko w `<SignedIn>`, `userId` + Clerk `fullName` zamiast `authorName`, edycja/usuwanie własnych recenzji (@AGENT) ✅
- [x] [P2] **ImageGallery + ImageLightbox** — grid/karuzela zdjęć na profilach, pełnoekranowy podgląd, nawigacja strzałkami, licznik (@AGENT) ✅
- [x] [P2] **ImageSortableList** — przeciąganie zdjęć do zmiany kolejności (admin + właściciel) (@AGENT) ✅
- [x] [P3] **ReviewSortControls** — dropdown sortowania recenzji: najnowsze / najwyżej oceniane (@AGENT) ✅
- [x] [P3] **Empty states + CTA** — "No photos yet", "Be the first to review", "No images pending review" (@AGENT) ✅
- [x] [P3] **VerifiedOwnerBadge** — odznaka przy zdjęciach dodanych przez właściciela (@AGENT) ✅

> **Status 2026-05-16:** Wszystkie zadania zrealizowane. Jedyny pozostały element: migracja `RoasterImage` → `Image` (model wciąż jest aktywny obok `Image`).

---

## LATER — Phase 3: Growth (miesiąc 2-3)

- [ ] Featured tier + Stripe (webhook `/api/webhooks/stripe`, `setFeatured` action) (@UNASSIGNED)
- [ ] **UserProfile.country** — zapisz preferowany kraj w profilu zalogowanego użytkownika; auto-fill country w formularzach rejestracji na podstawie zapisanej preferencji (fallback: locale → IP geo) (@UNASSIGNED)

## LATER — Phase 4: Scale (miesiąc 4+)

- [ ] i18n pełny rollout — rozszerzenie poza PL/EN/DE, dodatkowe języki (@UNASSIGNED)

---

## 🧑 HUMAN ONLY — zadania wymagające człowieka (agent NIE wykonuje)

- [x] Branch protection na `main` (no direct push) — GitHub Settings → Branches (@MN) ✅
- [ ] Domena produkcyjna — zakup + konfiguracja DNS w Vercel (@MN)
- [ ] Stripe konto (Phase 3) — rejestracja + webhook secret (@UNASSIGNED)
- [ ] Cold outreach do palarni — lista kontaktowa, maile, LinkedIn (@UNASSIGNED)
- [ ] Założenie Remote Server — hosting dla scheduled agent (Claude Code remote triggers) (@MN)

**⚠️ Agent: jeśli napotkasz zadanie z tej sekcji — zapisz w SESSION.md i przejdź do następnego.**

---

## DONE

- [x] **Data Consistency + Public Proposal Flow** — Cafe.openingHours String→Json migration, OpeningHoursPicker component (Smart Monday), /suggest/cafe + /suggest/roastery public forms, admin cafe master editor (7 sections), admin roaster master editor (8 sections), nawigacja CTA "Zaproponuj miejsce" w header/footer/listingach (@MN) ✅
- [x] **Enrichment UX redesign** — AdminNav global nav, run list z keywords/location inline, new run form z EnrichmentTag (persistent tags per entityType), split layout (EntityListPanel + EntityCard + SplitLayout), photo selection via Unsplash + UploadThing, single-click apply (applyEntityProposals), bulkApplyByConfidence, APPROVED status removed (@MN) ✅
- [x] Prisma schema — 9 modeli (+ Review, SavedRoaster, ApiKey), wszystkie indeksy, relacje
- [x] Frontend MVP — homepage, catalog, profiles, map, register form, admin UI
- [x] Design system — Tailwind v4 + shadcn/ui
- [x] Architecture documentation — `docs/architecture/`
- [x] Market research + personas — `docs/research/`
- [x] UI/UX design — Google Stitch exports + design system
- [x] Deploy — Vercel (beanmap-web.vercel.app)
- [x] Repo reorganization — PROJECT_STATUS, ROADMAP, OVERVIEW, AGENTS.md, .env.example
- [x] Stack decision — Vercel Postgres + Clerk + Uploadthing (2026-03-26)
- [x] Scheduled agent config — settings.json, workflows/scheduled_run.md, CLAUDE.md entry point
- [x] Vercel Postgres provisioned + env vars
- [x] Clerk auth configured + Google OAuth
- [x] Prisma migrations (init + reviews + cafe + api_keys)
- [x] Prisma singleton (`db`) + Neon adapter
- [x] ClerkProvider + sign-in/sign-up routes
- [x] clerkMiddleware — route protection
- [x] Auth helpers — requireAdmin, requireRoasterOwner
- [x] Server Actions — createRoasterRegistration, verifyRoaster, rejectRoaster
- [x] Admin panel connected to Server Actions
- [x] Bootstrap admin user
- [x] Seed 50 palarni (PL+DE+DK+SE+NL+FR+CZ+UK+US+CA+AU+JP+ET+KE+BR)
- [x] Removed Basic HTTP Auth
- [x] GitHub Actions CI (tsc + eslint)
- [x] Homepage ISR + Prisma queries
- [x] Catalog `/roasters` — ISR, filters, search, pagination
- [x] Roaster profiles `/roasters/[slug]` — ISR, related roasters
- [x] Interactive map `/map` — ISR, Leaflet, markers
- [x] Registration form → Server Action (PENDING roaster)
- [x] Profile event tracking (PAGE_VIEW, WEBSITE_CLICK, etc.)
- [x] SEO country pages `/roasters/country/[country]`
- [x] Roaster dashboard `/dashboard/roaster` — profile editing, analytics
- [x] Email notifications — Resend (registration, verify, reject)
- [x] Reviews — submit, approve/reject moderation, display on profiles
- [x] Cafe accounts — CAFE role, save/unsave roasters
- [x] Partner API — `GET /api/v1/roasters`, ApiKey auth
- [x] Newsletter digest — `POST /api/newsletter/digest`
- [x] PWA — manifest.json, apple-web-app meta
- [x] Image upload — Uploadthing, dashboard dropzone
- [x] Analytics — Plausible script tag
- [x] Versioning — package.json version in footer
- [x] Map mobile sidebar — floating toggle + slide-in drawer
- [x] Roaster filters mobile — collapsible toggle
- [x] Sign-in page — Header + layout wrapper
- [x] ImageWithFallback — graceful degradation for broken images
- [x] Homepage stats — dynamic from DB
- [x] Map `<h1>` SEO — sr-only
- [x] Register `<title>` + `<h1>` SEO
- [x] Homepage stat "Verified Profiles" — fixed number display
- [x] Broken images — fixed URLs in DB + seed.ts
- [x] Breadcrumb separator unified
- [x] Footer links — replaced placeholder hrefs
- [x] Map `<title>` — "Coffee Roasters Map | Bean Map"
- [x] Hero mobile — central image
- [x] Empty state at 0 filter results
- [x] Tablet roasters sidebar collapsible
- [x] Env vars added to Vercel (prod)
- [x] Google OAuth in Clerk
- [x] SEO URL decision: `/roasters/country/[country]`
- [x] **/cafes: filtry i wyszukiwanie** — dodać filtry kraju, search, paginację — parzystość z `/roasters` ✅
- [x] **Cafe description** — unikalne opisy dla każdej kawiarni ✅
- [x] **Social proof** — "Gdzie wypić" sekcja na profilu palarni ✅
- [x] **Cafe addresses manual** — uzupełnienie adresów i coords dla 17 kawiarni (plik `.tmp/cafes_to_complete.json`), Google Maps lookup, aktualizacja SEED (~30min) (@MN) ✅
- [x] **Perf: batch optimize cafe-roaster seeding** — replace 620 sequential upserts with `createMany`, production deploy 7m29s → 1m44s (@MN) ✅
- [x] [HIGH] **SVG viewBox typo on /cafes** — `viewBox="0 0 2424"` instead of `"0 0 24 24"` in CafeFilters.tsx:72 → console error (@AGENT) ✅
- [x] [HIGH] **Unify review UX** — completely different review forms/lists for roasters vs cafes (star hover vs number buttons, different layouts, date formats, text casing) (@AGENT) ✅
- [x] **Typography: custom font pair** — Fraunces (display) + Source Sans 3 (body) przez next/font/google (@MN) ✅
- [x] **i18n PL/EN/DE** — complete i18n with `next-intl`, routing per locale (`[locale]`), full translations EN/PL/DE for all user/admin pages, redesigned locale switcher (PR #59-61) (@AGENT) ✅
- [x] **UX Quality Audit findings implemented** — SaveCafeButton + saved-cafe.actions.ts, sticky sidebar with contact card on cafe profiles, CafeProfileTracker + CafeTrackedLink analytics, coverImageUrl display, VerifiedBadge on cafe hero, register title fixed (@AGENT) ✅
- [x] **Cookie policy / regulamin / polityka prywatności** — 4 strony prawne (cookies, privacy, terms, impressum), PL+EN, zlinkowane w Footer (@MN) ✅ (2026-05-16 audit)
- [x] **UI: hover states + transitions** — 390+ spójnych wzorców w 30+ komponentach (@MN) ✅ (2026-05-16 audit)
- [x] **Mobile filters: search always visible** — search poza collapsible w RoasterFilters i CafeFilters (@AGENT) ✅ (2026-05-16 audit)
- [x] **Neon Preview Branches** — 3 workflowy (preview-db, CI ephemeral, neon-cleanup), izolowana baza per PR (@MN) ✅
- [x] **Testing docs: E2E skeletons** — 4 szkielety speców w `docs/testing/e2e/` (@UNASSIGNED) ✅ (2026-05-16 audit)
- [x] **Site Audit 2026-04-24** — wszystkie CRITICAL + HIGH naprawione (@AGENT) ✅
- [x] **Site Audit 2026-05-02** — 12/14 problemów naprawionych i zweryfikowanych na produkcji (PR #77) (@AGENT) ✅
- [x] **UX Enhancement: Images, Geocoding, Reviews** — 15/15 zadań: unified Image model, geocoding, AddressAutocomplete, MiniMap, image actions, UploadThing endpoints, /admin/images, /admin/images/pending, /admin/settings, DashboardGallery, Review auth gate, ImageGallery, ImageLightbox, ImageSortableList, ReviewSortControls, Empty states, VerifiedOwnerBadge (@AGENT) ✅
- [x] **Migracja RoasterImage → Image** — usunięcie starego modelu, aktualizacja endpointów/typów/seedów, migracja SQL (PR #89) (@AGENT) ✅
- [x] **ReviewSortControls — integracja z UI** — komponent ReviewSection z sortowaniem na profilach palarni i kawiarni (@AGENT) ✅
- [x] **ISR revalidate: cafes/[slug]** — dodane `revalidate = 3600` na profilu kawiarni (@AGENT) ✅
