# Agent Instructions — Roasters Hub Web App

## Kolejność Orientacji (ZAWSZE czytaj w tej kolejności)

1. **`/PROJECT_STATUS.md`** (root) — co faktycznie istnieje vs. co opisują dokumenty
2. **Ten plik** — konwencje specyficzne dla tej aplikacji
3. Odpowiedni doc architektury — tylko jeśli potrzebny do bieżącego zadania

**ZASADA: Dokumenty architektury opisują INTENCJĘ. `PROJECT_STATUS.md` opisuje RZECZYWISTOŚĆ.**

**Multi-Worker:** Zadania w ROADMAP.md mają tagi assignee `(@MN)`, `(@KK)`, `(@AGENT)`, `(@UNASSIGNED)`. Agent bierze TYLKO `(@AGENT)` lub `(@UNASSIGNED)`. Pełne reguły → `CLAUDE.md` sekcja "Multi-Worker Coordination".

---

## Faktyczne Wersje Stack (dokumenty mogą podawać inne)

| Pakiet | Faktyczna wersja |
|--------|-----------------|
| Next.js | **16.4.4** |
| React | **19.2.4** |
| Prisma | **7.10.1** |
| Tailwind CSS | **4** |
| Auth | **Clerk** (`@clerk/nextjs` ^6.39.8) |
| DB | **Vercel Postgres** (Neon) |
| Storage | **Uploadthing** (MVP) → Cloudflare R2 |
| TypeScript | **5** | — |

⚠️ **To nie jest Next.js, którego znasz z treningu.** App Router, Server Actions i konwencje plików
mogą różnić się od danych treningowych. W razie wątpliwości sprawdź `package.json` i istniejące wzorce kodu.
Przed pisaniem kodu sprawdź istniejące wzorce w `src/`.

---

## Kluczowe Ograniczenia

- **Prisma 7: `url`/`directUrl` NIE w `schema.prisma`** — powoduje błąd P1012. W `prisma.config.ts` blok `datasource` obsługuje TYLKO `url` i `shadowDatabaseUrl` (bez `directUrl`).
- **`prisma/schema.prisma` migracje muszą być sekwencyjne** — ogłoś w teamie przed uruchomieniem `prisma migrate dev`
- **`src/proxy.ts` (dawniej middleware.ts) — jedna osoba modyfikuje na raz** — wpływa na całą aplikację
- **Kolizje slugów** — obsługuje `src/lib/slug.ts` (`hard-beans` → `hard-beans-opole` → `hard-beans-opole-2`)

---

## CI — Architektura i Pułapki

### Struktura jobów (DLACZEGO tak, nie inaczej)

**Job 1 (lint-typecheck-test):** lint → tsc → unit tests. BEZ buildu.
**Job 2 (integration):** create Neon branch → migrations → integration tests → **build** → delete Neon branch.

Build jest w Job 2, bo `next build` wywołuje `generateStaticParams` na WSZYSTKICH stronach z `db.*` — ISR prerendering potrzebuje prawdziwego połączenia z bazą. Z placeholder URL build exploduje na 13+ stronach.

### Pułapki które już spotkaliśmy

**`npm ci` vs `npm install`:**
- `npm ci` waliduje CAŁY lock file przed instalacją i pada na `@napi-rs/wasm-runtime` (opcjonalny WASM fallback dla rolldown/tailwindcss-oxide) — jego transitive deps `@emnapi/runtime` i `@emnapi/core` nie mają resolved entries w lock file bo nigdy nie były instalowane na tym OS.
- Fix: używamy `npm install` (nie `npm ci`) w obu workflowach CI i preview-db.

**Clerk publishable key:**
- Clerk waliduje FORMAT klucza przy buildzie. `pk_test_placeholder` nie przejdzie.
- Poprawny format: `pk_test_<base64(domain$)>`. Placeholder w CI: `pk_test_ZXhhbXBsZS5jbGVyay5hY2NvdW50cy5kZXYk` (base64 z `example.clerk.accounts.dev$`).

**Resend API key:**
- `new Resend(key)` jest wywoływane na poziomie modułu (import time) w `/api/newsletter/digest/route.ts`. Build pada bez klucza.
- Fix: `RESEND_API_KEY: re_placeholder` w kroku Build w ci.yml.

**`generateStaticParams` bez try-catch:**
- Każda strona dynamiczna (`[slug]`, `[country]`) wywołuje `generateStaticParams` przy buildzie. Bez try-catch pada jeśli DB jest niedostępna.
- Fix: zawsze wrap w try-catch zwracający `[]` + `export const dynamicParams = true`.
- **Reguła: każda nowa strona z `generateStaticParams` + `db.*` MUSI mieć try-catch i `dynamicParams = true`.**

### Sprawdzanie CI bez udziału człowieka

```bash
gh run list --branch <branch> --limit 5
gh run view <run-id> --log-failed   # tylko logi nieudanych kroków
```

---

## ISR + revalidation (OBOWIĄZKOWE)

Wszystkie strony z zapytaniami Prisma mają `export const revalidate = 3600`.

**Reguła: każda nowa strona z `db.*` musi mieć `export const revalidate = 3600`.**

**Reguła: każdy Server Action zmieniający dane MUSI wywołać `revalidatePath()` dla WSZYSTKICH stron, które wyświetlają te dane.** Checklist:
- `/` — homepage stats (roasterCount, countryCount)
- `/roasters` — katalog
- `/roasters/[slug]` — profil
- `/map` — markery
- `/admin/pending` — kolejka admina

---

## Konwencja Commitów

```
[SCOPE] action: description
```
Scopes: `DB | AUTH | ACTION | UI | SEED | INFRA | DOCS | AGENT`

Commit `[AGENT] update: ...` = aktualizacja plików orientacyjnych projektu.

---

## Protokół Końca Sesji

Po każdej sesji zapisz `.tmp/SESSION.md` (gitignored):

```markdown
## Session [data]
Started: [co mówiło PROJECT_STATUS — aktywne zadanie]
Completed: [co zostało zrobione]
Tested: [co zostało zweryfikowane]
Blocked by: [jeśli coś blokuje]
Next: [dokładny następny krok]
```

Na początku kolejnej sesji czytaj: `.tmp/SESSION.md` → `PROJECT_STATUS.md` → ten plik.

---

## Preview Database Isolation

Każdy PR dostaje izolowany Neon branch — preview deploye nie dotykają produkcyjnych danych.

**Mechanizm:**
1. Workflow `preview-db.yml` tworzy Neon branch `preview-<branch-name>` przy otwarciu PR
2. Ustawia w Vercel env var `DATABASE_URL_<SANITIZED_BRANCH>` (np. `DATABASE_URL_FEAT_MN_CAFE_PROFILES`)
3. Aplikacja czyta `VERCEL_GIT_COMMIT_REF` → szuka branch-specific URL → fallback na `DATABASE_URL`
4. Przy zamknięciu PR: usuwa Neon branch + Vercel env var

**Konwencja nazewnictwa:**
- Neon branch: `preview-feat-mn-cafe-profiles` (lowercase, hyphens)
- Vercel env var: `DATABASE_URL_FEAT_MN_CAFE_PROFILES` (uppercase, underscores)

**Wymagane GitHub Secrets:**

| Secret | Opis | Gdzie znaleźć |
|--------|------|---------------|
| `NEON_PROJECT_ID` | ID projektu Neon | ✅ już istnieje |
| `NEON_API_KEY` | Neon API Key | ✅ już istnieje |
| `VERCEL_TOKEN` | Personal Access Token | Vercel → Account Settings → Tokens |
| `VERCEL_PROJECT_ID` | ID projektu Vercel | Vercel → Project → Settings → General |

**Uwaga:** Neon Free plan ma limit 10 branchy — nie trzymaj za dużo otwartych PRów naraz.

**Ręczne czyszczenie** (jeśli workflow nie wykonał się przy zamknięciu PR):
1. Neon Dashboard → Branches → usuń `preview-<branch-name>`
2. Vercel → Project → Settings → Environment Variables → usuń `DATABASE_URL_<BRANCH>`

---

## Kluczowe Pliki Referencyjne

| Plik | Cel |
|------|-----|
| `prisma/schema.prisma` | Definicja DB — source of truth dla modeli |
| `src/types/certifications.ts` | Typy i stałe dla certyfikatów, roast styles, origins |
| `docs/architecture/api-design.md` | Blueprint dla `ActionResult<T>`, Zod schemas, Server Actions |
| `docs/seed-roasters.md` | Lista 60+ palarni do seedu produkcyjnego |

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
