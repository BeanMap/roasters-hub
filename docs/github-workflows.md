# GitHub Workflows & CI/CD Guide

> Kompletna dokumentacja procesów CI/CD dla agentów i developerów.  
> **Ground truth:** Ten plik opisuje AKTUALNY stan workflowów w `.github/workflows/`.

---

## 📋 Spis treści

1. [Architektura Pipeline](#architektura-pipeline)
2. [Git Hooks & Branch Strategy](#git-hooks--branch-strategy)
3. [Preview Database (PR)](#preview-database-pr)
4. [CI z Ephemeral DB](#ci-z-ephemeral-db)
5. [Production Deploy](#production-deploy)
6. [Wymagane Secrets](#wymagane-secrets)
7. [Komendy diagnostyczne](#komendy-diagnostyczne)
8. [Rollback](#rollback)
9. [Troubleshooting](#troubleshooting)

---

## Git Hooks & Branch Strategy

### ZŁOTA REGUŁA

**PO KAŻDEJ zmianie kodu lub bazy danych — wynik ZAWSZE na nowym branchu.**
**NIGDY nie pushuj bezpośrednio do `main`.**

Merge tylko przez PR po review. Wyjątek: zmiany TYLKO w plikach dokumentacji/instrukcji.

### Git Hooks (setup)

Repo używa `.githooks/` (nie husky — monorepo z `.git` w root).

**Setup (raz na środowisko):**
```bash
git config core.hooksPath .githooks
```

**Hooki:**

| Hook | Skrypt | Cel |
|------|--------|-----|
| `pre-commit` | `tools/consistency_check.py` | Spójność ROADMAP ↔ kod ↔ docs |
| `pre-push` | `tools/branch-guard.sh` | Blokuje push kodu/DB do main |

### Jak działa branch-guard

Pre-push hook (`tools/branch-guard.sh`) analizuje pliki zmienione w commitach pushowanych do `main`:

| Wymaga brancha | Dozwolone na main |
|----------------|-------------------|
| `web/src/**` | `CLAUDE.md`, `AGENTS.md` |
| `web/prisma/**` | `ROADMAP.md`, `PROJECT_STATUS.md` |
| `web/package.json`, `web/next.config.ts` | `docs/**` |
| `tools/**`, `.github/**` | `.tmp/`, `.claude/` |

**Bypass (awaryjny, NIE ZALECANY):** `git push --no-verify`

### Flow pracy z branchami

```
1. git checkout -b feat/opis-zmiany        # nowy branch
2. ... kodowanie, commity ...
3. git push origin feat/opis-zmiany        # push na branch
4. Otwórz PR w GitHub
5. Review (człowiek) → merge przez PR
6. git checkout main && git pull            # aktualizuj lokalny main
```

**Nazewnictwo branchy:**
| Worker | Pattern | Przykład |
|--------|---------|----------|
| Agent | `feat/agent-YYYY-WW` | `feat/agent-2026-14` |
| Marek | `feat/mn-<slug>` | `feat/mn-email-notifications` |
| Krzysztof | `feat/kk-<slug>` | `feat/kk-stripe-integration` |

---

## Architektura Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              PULL REQUEST                                    │
│                              (feat/* branch)                                 │
└──────────────────────┬──────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PREVIEW DATABASE WORKFLOW                            │
│                         (.github/workflows/preview-db.yml)                   │
├─────────────────────────────────────────────────────────────────────────────┤
│  1. Create Neon branch (preview-<branch-name>)                              │
│  2. Run migrations (jeśli nowe)                                             │
│  3. Run seed (ZAWSZE — każdy preview ma dane do testowania)                 │
│  4. Set Vercel DATABASE_URL (scoped to branch)                              │
│  5. Vercel Preview Deployment                                               │
└──────────────────────┬──────────────────────────────────────────────────────┘
                       │
                       ▼
              ┌─────────────────┐
              │  Preview URL    │
              │  (testuj tutaj) │
              └─────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              MERGE TO MAIN                                   │
└──────────────────────┬──────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      PRODUCTION DEPLOY WORKFLOW                              │
│                      (.github/workflows/production-deploy.yml)               │
├─────────────────────────────────────────────────────────────────────────────┤
│  Job 1: CI (Lint, TypeScript, Tests)                                        │
│       └─► Czy kod jest poprawny?                                            │
│                                                                             │
│  Job 2: Migrate & Seed Production DB                                        │
│       └─► Używa DATABASE_URL z GitHub Secrets                               │
│       └─► Migracje + Seed (tylko przy zmianie seed/migrations)              │
│                                                                             │
│  Job 3: Vercel Auto-Deploy (poza workflow)                                  │
│       └─► Vercel automatycznie deployuje na push do main                    │
└──────────────────────┬──────────────────────────────────────────────────────┘
                       │
                       ▼
              ┌─────────────────┐
              │ Production URL  │
│ https://beanmap-web.vercel.app │
              └─────────────────┘
```

---

## Preview Database (PR)

Każdy Pull Request automatycznie dostaje **własną, izolowaną bazę danych**.

### Jak to działa

**Trigger:** PR `opened`, `synchronize`, `reopened` (pomijany dla docs-only — patrz [CI Paths Ignore](#ci-paths-ignore))

1. **Neon Branch Creation**
   - Nazwa: `preview-<branch-name>`
   - Parent: `main` (kopia produkcji)
   - Automatyczne czyszczenie przy zamknięciu PR

2. **Migrations & Seed**
   - Sprawdza `git diff` na `web/prisma/migrations/`
   - Odpala `prisma migrate deploy` (tylko jeśli nowe migracje)
   - Odpala `prisma/seed_cafes.ts` **ZAWSZE** (każdy preview ma dane)

3. **Vercel Integration**
   - Tworzy branch-scoped `DATABASE_URL`
   - Vercel używa tej zmiennej dla preview deployments
   - URL: `https://<branch>-<project>.vercel.app`

### Komendy diagnostyczne

```bash
# Status workflow dla PR
cd /workspaces/roasters-hub
gh run list --branch <nazwa-brancha> --limit 5

# Logi błędów
cd /workspaces/roasters-hub
gh run view <run-id> --log-failed

# Lista Neon branchy
# (przez Neon Console: https://console.neon.tech)
```

### Cleanup (automatyczny)

Przy zamknięciu PR:
- Usuwa Neon branch `preview-<branch-name>`
- Usuwa Vercel env var `DATABASE_URL` (scoped)

---

## CI z Ephemeral DB

Każdy PR przechodzi **CI z izolowaną bazą danych** — testy i build uruchamiają się na tymczasowym Neon branchu.

### Jak to działa

**Workflow:** `.github/workflows/ci.yml`
**Trigger:** PR do `main` (pomijany dla docs-only — patrz [CI Paths Ignore](#ci-paths-ignore))

**Job 1: Lint, Type Check & Unit Tests**
- `npm run lint` — ESLint
- `npx tsc --noEmit` — TypeScript
- `npm run test:coverage` — Vitest z coverage → Codecov

**Job 2: Integration Tests** (wymaga Job 1; nazwa wymagana przez branch protection `main`)
1. Lokalny Postgres 16 (service container) — bez Neon, nic do sprzątania
2. `prisma migrate deploy` na pustej bazie + kontrola driftu schema ↔ migracje
3. `npm run test:integration`
4. Seed danych demo, `npm run build`
5. Playwright smoke (chromium + Mobile Chrome) na `next start`

> Preview na Vercelu NIE buduje się automatycznie z gałęzi (`vercel.json` → `git.deploymentEnabled`).
> Buduje go workflow `preview-db.yml` po utworzeniu bazy gałęzi — dzięki temu nie ma
> nieudanych buildów „bez bazy” i maili „Preview deployment failed”.

### CI Paths Ignore

Oba workflowy (`ci.yml` i `preview-db.yml`) pomijają PR-y które zmieniają **tylko** pliki dokumentacji:

```
ROADMAP.md, PROJECT_STATUS.md, CLAUDE.md, AGENTS.md,
docs/**, .tmp/**, .claude/**, .agents/**
```

**Dlaczego:** Docs-only changes nie kompilują kodu, nie zmieniają DB, nie wymagają testów. PR z samą aktualizacją ROADMAP.md można merge'ować natychmiast bez czekania na CI (~2 min oszczędności).

**Uwaga:** Jeśli PR zmienia kod + dokumentację, CI uruchamia się normalnie (bo kod triggeruje workflow).

### Dlaczego ephemeral?

| Preview DB (preview-db.yml) | Ephemeral DB (ci.yml) |
|------------------------------|-----------------------|
| Trwa przez życie PR | Żyje tylko przez duration workflowu |
| Służy do ręcznego testowania | Służy do automatycznych testów CI |
| Nazwa: `preview-<branch>` | Nazwa: `ci-<run_id>-<attempt>` |

### Outputs Neon action (v6)

| Output | Opis |
|--------|------|
| `db_url` | Bezpośredni connection string |
| `db_url_pooled` | Z connection pooling (zalecany dla runtime) |
| `branch_id` | Unikalne ID brancha |
| `password` | Hasło do bazy |

**Uwaga:** W v6 nazwy outputów się zmieniły:
- `db_url_with_pooler` → `db_url_pooled`
- `username` → `role`
- `parent_branch_id` → `parent_branch`

---

## Production Deploy

Deploy na produkcję działa w **dwóch fazach**:

### Faza 1: Database (GitHub Actions)

**Trigger:** Push do `main` ze zmianami w:
- `web/prisma/seed*.ts`
- `web/prisma/migrations/**`
- `.github/workflows/production-deploy.yml`

**Jobs:**

| Job | Cel | Czas |
|-----|-----|------|
| `ci` | Lint, TypeScript, Unit Tests | ~40s |
| `migrate-and-seed` | Migracje + Seed na produkcji | ~30s-1min |

**Uwaga:** Seed używa `createMany` (batch insert) zamiast sekwencyjnych `upsert` — 620 relacji cafe-roaster w ~2s zamiast ~5 min.

### Faza 2: Vercel Deployment (Auto)

Vercel automatycznie deployuje na push do `main` (pomijany dla docs-only — patrz [Vercel Ignored Build](#vercel-ignored-build)):
- **Nie wymaga** workflow GitHub Actions
- Deployment pojawia się w GitHub jako status check
- Produkcja: `https://beanmap-web.vercel.app`

### Vercel Ignored Build

Plik `vercel.json` zawiera `ignoreCommand` który pomija build Vercel gdy push dotyczy **tylko** plików dokumentacji:

```
docs/**, ROADMAP.md, PROJECT_STATUS.md, CLAUDE.md, AGENTS.md,
web/AGENTS.md, .tmp/**, .claude/**, .agents/**
```

**Dlaczego:** Docs-only changes nie zmieniają kodu aplikacji — nie ma potrzeby budowania Next.js. Push samego ROADMAP.md nie triggeruje ani CI GitHub Actions ani Vercel deploy (~1-2 min oszczędności).

**Uwaga:** Jeśli push zmienia kod + dokumentację, Vercel deploy uruchamia się normalnie (bo kod triggeruje build).

### Monitorowanie statusu

```bash
# Lista workflowów na main
cd /workspaces/roasters-hub
gh run list --branch main --limit 5

# Szczegóły konkretnego runu
gh run view <run-id>

# Tylko błędy
gh run view <run-id> --log-failed

# Status deploymentu Vercel
gh api repos/BeanMap/roasters-hub/deployments --jq '.[0] | {environment, state}'
```

---

## Wymagane Secrets

### GitHub Repository Secrets

Ustaw w: `https://github.com/BeanMap/roasters-hub/settings/secrets/actions`

| Secret | Skąd wziąć | Użycie |
|--------|-----------|--------|
| `DATABASE_URL` | Vercel Dashboard → Project → Settings → Environment Variables | Production DB connection (pooled) |
| `DIRECT_URL` | Vercel Dashboard → Project → Settings → Environment Variables | Production DB connection (direct, dla migracji) |
| `NEON_API_KEY` | Neon Console → Project → API Keys | Tworzenie/usuwanie preview branches |
| `NEON_PROJECT_ID` | Neon Console → Project Settings → General | ID projektu Neon |
| `VERCEL_TOKEN` | Vercel → Settings → Tokens | Integracja z Vercel API |
| `VERCEL_PROJECT_ID` | Vercel Dashboard → Project → Settings → General | ID projektu Vercel |

### Skąd wziąć DATABASE_URL i DIRECT_URL

1. Wejdź: https://vercel.com/dashboard
2. Wybierz projekt `beanmap-web`
3. Settings → Environment Variables
4. Skopiuj wartość `DATABASE_URL` (sekcja Production)
5. Dodaj do GitHub Secrets z tą samą nazwą
6. To samo dla `DIRECT_URL`

**Uwaga:** Te wartości są IDENTYCZNE jak w lokalnym `.env` (plik `web/.env`).

---

## Komendy diagnostyczne

### Podstawowe (każdy agent powinien znać)

```bash
# ─── Lista ostatnich runów ─────────────────────────────────────
cd /workspaces/roasters-hub
gh run list --limit 10

# ─── Ostatni nieudany run ──────────────────────────────────────
gh run list --status failure --limit 1

# ─── Szczegóły konkretnego runu ────────────────────────────────
# Najpierw weź ID z listy, potem:
gh run view <id>

# ─── Tylko błędy (najszybszy sposób) ───────────────────────────
gh run view <id> --log-failed

# ─── Pełne logi konkretnego joba ───────────────────────────────
gh run view <id> --log | grep -A 30 "Error"

# ─── Status deploymentu Vercel ─────────────────────────────────
gh api repos/BeanMap/roasters-hub/deployments --jq '.[0:3] | .[] | {id, environment, created_at, sha}'

# ─── Szczegóły konkretnego deploymentu ─────────────────────────
gh api repos/BeanMap/roasters-hub/deployments/<id>/statuses --jq '.[0]'
```

### Zaawansowane

```bash
# Trigger workflow ręcznie (wymaga uprawnień)
gh workflow run production-deploy.yml --ref main

# Lista wszystkich workflowów
gh workflow list

# Szczegóły workflowu
gh workflow view production-deploy.yml
```

---

## Rollback

### Scenariusz 1: Cofnięcie kodu (Git)

```bash
# Cofnij ostatni commit (zachowaj zmiany w working directory)
git revert HEAD

# Push do main (automatycznie triggeruje workflow)
git push origin main
```

### Scenariusz 2: Cofnięcie zmian w bazie (Neon)

Neon ma **7-dniową historię** (Time Travel):
1. Wejdź: https://console.neon.tech
2. Wybierz branch `main`
3. Time Travel → wybierz punkt w czasie przed zmianami
4. Create branch from this point / Reset to this point

### Scenariusz 3: Ręczny fix bazy

```bash
# Lokalnie z produkcyjną bazą
cd /workspaces/roasters-hub/web
export DATABASE_URL="<production-url>"
npx prisma migrate deploy
# lub napraw ręcznie przez Prisma Studio
npx prisma studio
```

---

## Troubleshooting

### Problem: `DATABASE_URL secret is not set`

**Objaw:**
```
❌ Error: DATABASE_URL secret is not set
```

**Rozwiązanie:**
1. Skopiuj wartość z Vercel Dashboard
2. Dodaj do GitHub Secrets: https://github.com/BeanMap/roasters-hub/settings/secrets/actions
3. Ustaw nazwę: `DATABASE_URL`
4. Ustaw nazwę: `DIRECT_URL` (taka sama lub direct connection)

### Problem: `Connection url is empty`

**Objaw:**
```
Error: Connection url is empty. See https://pris.ly/d/config-url
```

**Przyczyna:** Secret jest ustawiony, ale workflow go nie widzi.

**Rozwiązanie:**
- Sprawdź czy secret jest w Repository Secrets (nie Environment Secrets)
- Uruchom workflow ponownie

### Problem: `Error! You specified VERCEL_PROJECT_ID but forgot VERCEL_ORG_ID`

**Objaw:**
```
Error! You specified VERCEL_PROJECT_ID but forgot VERCEL_ORG_ID
```

**Rozwiązanie:**
- Nie używaj `amondnet/vercel-action` do deployu produkcji
- Vercel i tak deployuje automatycznie na push do main
- Workflow `production-deploy.yml` skupia się na bazie danych, nie na deployu

### Problem: Workflow trwa bardzo długo (>5 min)

**Objaw:**
- Migrate & Seed wisi przez 5+ minut

**Przyczyna:**
- Neon Free plan = wolniejsze połączenia
- Duże migracje na istniejącej bazie
- Cold start bazy po okresie bezczynności

**Rozwiązanie:**
- Czekaj, to normalne dla cold start (~1-2 min dodatkowego czasu)
- Dla produkcji rozważ Neon Pro (szybsze połączenia)
- Seed używa batch insert (`createMany`) — 620 relacji w ~2s

### Problem: Preview DB nie działa

**Objaw:**
- Preview deployment pokazuje "Database error"
- Brak danych w preview

**Sprawdź:**
```bash
# Czy Neon branch istnieje?
gh run view <run-id> --log | grep "Neon branch"

# Czy Vercel ma DATABASE_URL?
# (Sprawdź w Vercel Dashboard → Project → Settings → Environment Variables)
```

**Rozwiązanie:**
- Zamknij i otwórz PR ponownie (triggeruje recreation)
- Lub: `git commit --allow-empty -m "trigger redeploy" && git push`

---

## Checklist dla Agentów

Przed rozpoczęciem pracy z CI/CD:

- [ ] Czytałem `PROJECT_STATUS.md` i `ROADMAP.md`
- [ ] Sprawdziłem `gh run list --limit 5`
- [ ] Wszystkie wymagane secrets są ustawione (jeśli nie → zgłoś)
- [ ] Pracuję na branchu feature (nigdy bezpośrednio na main) — enforced przez `pre-push` hook
- [ ] Znam komendę `gh run view <id> --log-failed` na wypadek błędów
- [ ] Mam skonfigurowane git hooks: `git config core.hooksPath .githooks`

---

## Zobacz też

- `CLAUDE.md` — ogólne instrukcje procesowe, ZŁOTA REGUŁA
- `AGENTS.md` — instrukcje specyficzne dla OpenCode, git hooks setup
- `.githooks/` — pre-commit i pre-push hooki
- `tools/branch-guard.sh` — skrypt blokujący push kodu do main
- `.github/workflows/` — kod źródłowy workflowów
- `web/prisma/` — migracje i seedy


## Branch Protection — Setup Checklist

**Cel:** Blokada push do `main` na poziomie GitHub (nie tylko lokalny hook).
**Uwaga:** Lokalny `branch-guard.sh` to pierwsza linia obrony — to jest druga, enforced przez GitHub.

**Setup:** https://github.com/BeanMap/roasters-hub/settings/branches → Add rule → `main`

### Wymagane ustawienia

- [ ] **Branch name pattern:** `main`
- [ ] ✅ **Require a pull request before merging**
- [ ] ✅ **Require status checks to pass before merging** → wybierz:
  - `Lint, Type Check & Unit Tests` (z CI workflow)
  - `Integration Tests` (z CI workflow)
  - `manage-preview-db` (z Preview Database workflow)
- [ ] ✅ **Require branches to be up to date before merging**
- [ ] ❌ **Require approvals** → **ODZNACZONE** (agent merge'uje automatycznie po CI ✅)
- [ ] ❌ **Allow force pushes** → OFF (nigdy nie zezwalaj)
- [ ] ❌ **Allow deletions** → OFF

### Dlaczego bez approvals?

Mały zespół (2 osoby + agent) nie potrzebuje formalnego review process.
**CI jest gate'em jakości** — lint, tsc, testy, build, integration tests.
Jeśli CI przechodzi → kod jest gotowy do merge.

### Dlaczego to ważne?

| Scenariusz | Bez branch protection | Z branch protection |
|------------|----------------------|---------------------|
| Przypadkowy push do main | ✅ Dojdzie do skutku | ❌ Zablokowane |
| Bypass hooka (--no-verify) | ✅ Dojdzie do skutku | ❌ Zablokowane |
| Merge bez passing CI | ✅ Możliwy | ❌ Wymaga passing checks |

### Double Guard — jak działają obie blokady

```
┌─────────────────────────────────────────────────────────────┐
│  Linia 1: branch-guard.sh (lokalny pre-push hook)           │
│  ✅ Blokuje 99% przypadków (ludzie + agenty)                │
│  ⚠️  Można obejść: --no-verify                              │
├─────────────────────────────────────────────────────────────┤
│  Linia 2: GitHub Branch Protection (server-side)            │
│  ✅ Nie do obejścia (nawet z --no-verify)                   │
│  ✅ Wymaga PR + passing CI (bez approvala)                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Auto-Flow — "Zapisz zmiany"

Gdy użytkownik powie **"zapisz"**, **"commit"**, **"push"**, **"wdróż"** — agent wykonuje pełny flow w tle:

```
1. git checkout -b feat/<krótki-opis>
2. git add + git commit
3. git push origin <branch>
4. gh pr create --auto
5. Polling: gh run list --branch <branch> (czeka na CI)
6. Jeśli CI ✅ → gh pr merge --squash --delete-branch
7. Jeśli CI ❌ → napraw błędy + push na ten sam PR → powrót do kroku 5
```

**Użytkownik widzi tylko:** *"Zmiany zapisane, PR #X zmergowany."*

### Kiedy NIE auto-merge

- Zmiana struktury bazy (nowa migracja) — pokaż link do PR, poproś o potwierdzenie
- Duża zmiana (>5 plików, >200 linii) — pokaż link do PR, poproś o review
- Pierwszy deploy nowej funkcji — pokaż podsumowanie przed merge

### NIGDY

- `git push origin main` (zablokowane przez Branch Protection)
- `gh pr merge --admin` (omija politykę repozytorium)
- Commit bez uruchomienia consistency check

---

**Last Updated:** 2026-04-04 (Neon Actions v6, ephemeral CI DB, seed always, branch protection, auto-flow, docs-only CI skip, batch insert optimization, Vercel ignoreCommand)  
**Maintainer:** @MN (Marek Nadra)
