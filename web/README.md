# Roasters Hub — Web Application

Katalog palarni specialty coffee. Platforma B2B łącząca roasterów z kawiarniami i konsumentami.

**Live:** https://beanmap-web.vercel.app

---

## Stack

Next.js 16.2.1 · TypeScript 5 · Tailwind CSS v4 · Prisma 7.5 · Vercel Postgres (Neon) · Clerk · Uploadthing · Resend

## Quick Start

```bash
# 1. Zainstaluj zależności (generuje Prisma client via postinstall)
cd web && npm install

# 2. Skonfiguruj zmienne środowiskowe
cp .env.example .env.local
# → Wypełnij wartościami: DATABASE_URL, DIRECT_URL (Vercel Postgres),
#   CLERK_SECRET_KEY, NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
#   UPLOADTHING_TOKEN, RESEND_API_KEY

# 3. Uruchom migracje i seed
npx prisma migrate dev
npx prisma db seed

# 4. Uruchom dev server
npm run dev
# → http://localhost:3000
```

## Lokalnie bez Neona (Docker) i testy

```bash
npm run db:local:up                       # Postgres 16 w Dockerze
export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/beanmap
npm run db:local:reset                    # migracje od zera + dane demo
npm run dev                               # http://localhost:3000
```

Aplikacja sama wybiera sterownik: lokalny Postgres → `pg`, Neon → serverless.

| Co | Komenda |
|----|---------|
| Lint + typy + unit | `npm run lint && npx tsc --noEmit && npm test` |
| E2E smoke (app musi działać) | `E2E_BASE_URL=http://localhost:3000 npm run e2e:smoke -- --project=chromium --project="Mobile Chrome"` |
| Rozjazd schematu vs migracje | `npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script` |

## Baza danych — zasady (ważne)

- **Zmiana schematu = nowa migracja** (`npx prisma migrate dev --name ...`). Nigdy `prisma db push` na produkcji — CI (job *Fresh DB + E2E Smoke*) wykrywa rozjazd.
- **Migracje produkcyjne** uruchamia build Vercela (`scripts/vercel-build.mjs`) *przed* `next build`. Nieudana migracja = nieudany build = zostaje poprzednia wersja.
- **Preview** zawsze na własnej gałęzi Neon (workflow *Preview Database*). Bez niej build preview kończy się czytelnym błędem (pierwszy push PR-a), a workflow po utworzeniu bazy sam uruchamia deploy — preview nigdy nie łączy się z produkcją.
- **Produkcja nie jest seedowana automatycznie.** Dane bazowe (palarnie, kawiarnie): Actions → *Production Database* → Run workflow. Dane demo (recenzje, eventy) nie trafiają na produkcję.
- Migracje muszą być **addytywne** (dodaj kolumnę → przenieś dane → usuń starą w osobnym PR), żeby poprzednia wersja aplikacji działała podczas rollbacku.

## Aktualny Stan

Sprawdź [`/PROJECT_STATUS.md`](../PROJECT_STATUS.md) — co działa, co nie, co jest następne.

## Agent Instructions

Patrz [`AGENTS.md`](AGENTS.md) w tym katalogu — konwencje, wersje stacku, ISR rules.

## Dokumentacja

- **Nawigacja:** [`docs/OVERVIEW.md`](../docs/OVERVIEW.md)
- **Architektura:** [`docs/architecture/`](../docs/architecture/)
- **Design:** [`docs/design/stitch-brief.md`](../docs/design/stitch-brief.md)
- **Roadmap:** [`/ROADMAP.md`](../ROADMAP.md)
