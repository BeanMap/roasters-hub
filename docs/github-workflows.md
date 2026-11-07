# GitHub Workflows & CI/CD Guide

> Kompletna dokumentacja procesów CI/CD dla agentów i developerów.  
> **Ground truth:** Ten plik opisuje AKTUALNY stan workflowów w `.github/workflows/`.

---

## 📋 Spis treści

1. [Architektura Pipeline](#architektura-pipeline)
2. [Git Hooks & Branch Strategy](#git-hooks--branch-strategy)
3. [Preview (PR) — baza = kopia produkcji](#preview-pr--baza--kopia-produkcji)
4. [CI (lokalny Postgres)](#ci-lokalny-postgres)
5. [Production Deploy](#production-deploy)
6. [Wymagane Secrets](#wymagane-secrets)
7. [Komendy diagnostyczne](#komendy-diagnostyczne)
8. [Backup i odtwarzanie danych](#backup-i-odtwarzanie-danych)
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

Zasada: **nic nie trafia na produkcję bez testu**, a dane produkcji zmieniają się tylko przez migracje w PR.

```
PR (feat/*)
 ├─ ci.yml ─────────────── lint · tsc · unit · Integration Tests (lokalny Postgres 16:
 │                          migracje od zera, drift, testy integracyjne, seed demo, build, E2E)
 │                          → "Integration Tests" jest wymagany na main
 ├─ preview-db.yml ─────── zleca Vercelowi build preview dla head commitu PR
 │      └─ Vercel ↔ Neon ─ integracja tworzy/używa gałęzi Neon `preview/<branch>`
 │                          z produkcyjnego `main` (= kopia PRODUKCJI) i podmienia
 │                          DATABASE_URL tego deploymentu
 │      └─ vercel-build ── strażnik: endpoint ≠ produkcja → migrate deploy → next build
 └─ (zamknięcie PR) ────── usunięcie gałęzi Neon `preview/<branch>`
merge → main
 ├─ Vercel production ──── vercel-build: endpoint = produkcja → migrate deploy → next build
 │                          (błąd migracji = build failed, stara wersja dalej działa)
 └─ production-deploy.yml  alignment GitHub ↔ Vercel ↔ Neon + verify (read-only)
co noc ─ db-backup.yml ─── zaszyfrowany pg_dump (30 dni), w niedzielę test odtworzenia
co noc ─ neon-cleanup.yml  usuwa gałęzie preview/* bez otwartego PR
```

Tożsamość produkcyjnej bazy jest zapisana w jednym miejscu: `web/scripts/production-db.mjs`
(projekt Neon `steep-smoke-16472365` „neon-aero-prism”, endpoint `ep-purple-grass-al8w7icb`,
organizacja Neon „Vercel: mareknadra's projects”, projekt Vercel `beanmap`). To nie są sekrety.

---

## Preview (PR) — baza = kopia produkcji

**Workflow:** `.github/workflows/preview-db.yml` („Preview Deployment”)
**Trigger:** PR `opened`, `synchronize`, `reopened` (budowa), `closed` (sprzątanie)

1. Workflow wywołuje Vercel API (`VERCEL_TOKEN`) i zleca build preview dla head commitu PR.
   Vercel sam nie buduje gałęzi (`vercel.json` → `git.deploymentEnabled`: tylko `main`) — dzięki temu
   gałąź Neon powstaje tylko dla PR-ów (Neon Free: limit 10 gałęzi na projekt).
2. Przed buildem integracja Vercel ↔ Neon (Vercel → Storage → `neon-aero-prism` → projekt `beanmap` →
   „Create Database Branch For Deployment: Preview”, „Require Active Resource Before Deploy”) tworzy lub
   ponownie używa gałęzi **`preview/<git branch>`** odgałęzionej od produkcyjnego `main` i ustawia
   `DATABASE_URL`, `DATABASE_URL_UNPOOLED` itd. tego deploymentu na tę gałąź.
3. `web/scripts/vercel-build.mjs`:
   - **przerywa build**, jeśli `DATABASE_URL` wskazuje endpoint produkcji (np. integracja nie utworzyła gałęzi),
   - uruchamia `prisma migrate deploy` na gałęzi preview — migracje PR-a są testowane na kopii produkcji,
   - `next build`.
4. W runtime `web/src/lib/db-url.ts` ma ten sam strażnik (preview + endpoint produkcji = wyjątek).

Gałąź Neon powstaje przy **pierwszym** deployu PR-a i jest używana przy kolejnych pushach (dane z chwili
pierwszego deployu). Świeża kopia: Neon Console → Branches → `preview/<branch>` → *Reset from parent*,
potem Redeploy w Vercelu.

`DIRECT_URL` z Vercela jest ignorowany przez build (ręcznie ustawiona zmienna, trafia też do preview).

### Sprzątanie

- zamknięcie PR → `preview-db.yml` usuwa `preview/<branch>`,
- usunięcie gałęzi git → `neon-cleanup.yml`,
- co noc (03:15 UTC) i ręcznie → `neon-cleanup.yml` usuwa każdą gałąź `preview/*` bez otwartego PR.

Skrypt `.github/scripts/neon-delete-preview.sh` dotyka wyłącznie gałęzi `preview/*` i odmawia usunięcia
gałęzi domyślnej.

---

## CI (lokalny Postgres)

**Workflow:** `.github/workflows/ci.yml` · **Trigger:** PR do `main` (pomijany dla docs-only)

**Job 1: Lint, Type Check & Unit Tests** — `npm run lint`, `npx tsc --noEmit`, `npm run test:coverage`

**Job 2: Integration Tests** (wymagany przez branch protection `main`)
1. Lokalny Postgres 16 (service container) — bez Neon, nic do sprzątania
2. `prisma migrate deploy` na pustej bazie + kontrola driftu schema ↔ migracje
3. `npm run test:integration`
4. Seed danych demo, `npm run build`
5. Playwright smoke (chromium + Mobile Chrome) na `next start`

### Paths ignore

`ci.yml` pomija PR-y zmieniające **tylko** `ROADMAP.md, PROJECT_STATUS.md, CLAUDE.md, AGENTS.md,
web/AGENTS.md, docs/**, .tmp/**, .claude/**, .agents/**`. Vercel pomija takie buildy przez `ignoreCommand`
(`web/scripts/vercel-ignore-build.sh`).

---

## Production Deploy

1. **Vercel** buduje `main` automatycznie. `vercel-build.mjs` sprawdza, że `DATABASE_URL` wskazuje endpoint
   z `production-db.mjs` (inaczej build failed), wykonuje `prisma migrate deploy`, potem `next build`.
   Nieudana migracja = nieudany build = dalej działa poprzedni deployment.
2. **`production-deploy.yml`** („Production Database”):
   - `alignment` — PR-y zmieniające DB-plumbing, push do main, codziennie 04:40 UTC:
     - adres produkcji czytany **na żywo z Vercela** (`.github/scripts/prod-db-url.sh`, `VERCEL_TOKEN`),
       jego endpoint musi być równy przypiętemu w `production-db.mjs`,
     - `NEON_API_KEY` musi widzieć projekt produkcyjny, a endpoint jego gałęzi domyślnej musi być ten sam,
     - jeśli w GitHubie nadal istnieją sekrety `DATABASE_URL` / `DIRECT_URL`, muszą wskazywać ten sam
       endpoint (`.github/scripts/db-alignment.sh`). Taki rozjazd (GitHub → stary projekt Neon) już raz
       długo pozostał niezauważony.
   - `verify` — liczności tabel (read-only); `verify-production.ts` dodatkowo odmawia pracy na bazie innej
     niż produkcyjna.
   - ręcznie (`workflow_dispatch`, `confirm=production`): upsert danych bazowych (palarnie, kawiarnie, relacje).

### Poprawki danych

Zawsze jako migracja SQL w PR (`web/prisma/migrations/<timestamp>_<opis>/migration.sql`), idempotentna,
z komentarzem „dlaczego”. Preview PR-a wykona ją na kopii produkcji — sprawdzasz efekt w przeglądarce,
dopiero merge uruchamia ją na produkcji. Przykład: `20261107000000_backfill_roaster_cover_images`.
Nigdy ręcznych UPDATE-ów na produkcji.

---

## Wymagane Secrets

`https://github.com/BeanMap/roasters-hub/settings/secrets/actions`

| Secret | Skąd | Użycie |
|--------|------|--------|
| `VERCEL_TOKEN` | Vercel → Account Settings → Tokens (zakres: team „mareknadra's projects”) | build preview, odczyt adresu produkcji z Vercela |
| `NEON_API_KEY` | Neon Console → org „Vercel: mareknadra's projects” → Settings → API keys (najlepiej klucz ograniczony do projektu `neon-aero-prism`) | usuwanie gałęzi `preview/*`, alignment |
| `BACKUP_PASSPHRASE` | wygeneruj (np. `openssl rand -base64 32`) i **zapisz w menedżerze haseł** — bez niego backupu nie odszyfrujesz | szyfrowanie backupów |

**Nie są już potrzebne:** `DATABASE_URL`, `DIRECT_URL` (adres czytany z Vercela), `NEON_PROJECT_ID`,
`VERCEL_PROJECT_ID` (stałe w `web/scripts/production-db.mjs`). Jeśli `DATABASE_URL`/`DIRECT_URL` jeszcze
istnieją, alignment sprawdza, że wskazują produkcję — najlepiej je usunąć.

Repo jest **publiczne**: logi i artefakty Actions widzi każdy zalogowany użytkownik GitHuba. Skrypty
maskują adresy (`::add-mask::`) i wypisują tylko identyfikatory endpointów.

---

## Komendy diagnostyczne

```bash
gh run list --limit 10                      # ostatnie runy
gh run list --status failure --limit 1      # ostatni nieudany
gh run view <id> --log-failed               # tylko błędy
gh workflow run production-deploy.yml --ref main   # alignment + verify ręcznie
gh workflow run db-backup.yml --ref main           # backup (+ test odtworzenia)
gh workflow run neon-cleanup.yml --ref main        # sprzątanie gałęzi preview
```

Gałęzie Neon: https://console.neon.tech/app/projects/steep-smoke-16472365/branches

---

## Backup i odtwarzanie danych

### Co jest backupowane

| Mechanizm | Zakres | Gdzie |
|-----------|--------|-------|
| Neon point-in-time restore | ostatnie **6 godzin** (plan Free; płatne plany: do 7–30 dni) | Neon Console → Backup & Restore |
| `db-backup.yml` | pełny `pg_dump` co noc 02:00 UTC, **30 dni** | artefakt `db-backup-<data>` w Actions (zaszyfrowany) |
| Test odtworzenia | co niedzielę 02:30 UTC: odszyfrowanie, `pg_restore` do pustego Postgresa 17, porównanie liczby wierszy w każdej tabeli | job `restore-test` |

### Pomyłka sprzed < 6 h → Neon point-in-time restore

1. https://console.neon.tech/app/projects/steep-smoke-16472365 → **Backup & Restore**.
2. Gałąź `main`, wybierz moment **przed** pomyłką.
3. Najpierw utwórz gałąź z tego momentu i sprawdź na niej dane.
4. Gdy dane są dobre: **Restore** gałęzi `main` do tego momentu. Neon zachowuje stan sprzed restore jako
   osobną gałąź (można wrócić). Endpoint i connection string produkcji się nie zmieniają.
5. Vercel: odśwież cache ISR redeployem produkcji, jeśli strony pokazują stare dane.

### Starsza pomyłka → nocny backup

1. Actions → *Database Backup* → run z wybranej nocy → pobierz artefakt `db-backup-<data>`.
2. Odszyfruj (hasło `BACKUP_PASSPHRASE` z menedżera haseł):
   ```bash
   sha256sum -c SHA256SUMS
   gpg --decrypt --output production.dump production.dump.gpg
   ```
3. Odtwórz **do nowej gałęzi Neon**, nie bezpośrednio na produkcję: Neon Console → Branches → *Create branch*
   (np. `restore-<data>`), skopiuj jej connection string (direct), potem
   (pg_restore ≥ 17, np. przez `docker run --rm -v "$PWD:/in" postgres:17 pg_restore …`):
   ```bash
   pg_restore --dbname="<URL gałęzi restore>" --clean --if-exists --no-owner --no-acl production.dump
   ```
4. Zweryfikuj dane na tej gałęzi (`DATABASE_URL=<URL> npx tsx prisma/verify-production.ts`).
5. Przywrócenie na produkcję to **decyzja człowieka**: pojedyncze rekordy przenieś migracją SQL w PR;
   całość — w oknie serwisowym `pg_restore --clean` na gałąź `main`, po wcześniejszym utworzeniu gałęzi-kopii
   `main` (punkt powrotu).

### Cofnięcie deployu (kod)

- **Vercel Instant Rollback:** Vercel → projekt `beanmap` → Deployments → poprzedni produkcyjny deployment →
  ⋯ → **Instant Rollback** (sekundy, bez buildu). Na planie **Hobby** tylko do *bezpośrednio poprzedniego*
  deploymentu produkcyjnego — dalej wstecz: `git revert` + PR (albo Vercel Pro). Rollback kodu **nie cofa migracji** — jeśli nowa migracja
  zmieniła/usunęła kolumny, starszy kod może jej nie obsłużyć; wtedy napraw migracją „do przodu”.
- Po rollbacku Vercel nie promuje automatycznie kolejnych buildów `main` — po naprawie: Deployments →
  nowy deployment → *Promote to Production* (albo „Undo Rollback”).
- Trwale: `git revert <sha>` na gałęzi `feat/mn-…` → PR → merge.

---

## Troubleshooting

### Preview: „Preview build would use the PRODUCTION database”

Integracja nie podmieniła `DATABASE_URL` dla deploymentu. Sprawdź Vercel → Storage → `neon-aero-prism` →
Projects → `beanmap` → ⋯ → Update Project Connection: Preview zaznaczone w „Create Database Branch For
Deployment”. Potem Redeploy preview. To zabezpieczenie działa zgodnie z planem — nie obchodź go.

### Production: „Production build points at ep-…, expected ep-…”

Produkcja Vercela wskazuje inną bazę niż przypięta w `web/scripts/production-db.mjs`. Jeśli przeniesienie
bazy było zamierzone — zmień stałe w PR. Jeśli nie — sprawdź integrację Neon w Vercelu, zanim cokolwiek
zbudujesz.

### Alignment: „NEON_API_KEY cannot access Neon project …”

Sekret pochodzi z innego konta/organizacji Neon. Utwórz klucz w organizacji „Vercel: mareknadra's projects”
i podmień sekret.

### Preview: deployment wisi na „Neon” / brak gałęzi

Limit gałęzi Neon Free (10). Uruchom `neon-cleanup.yml` ręcznie albo usuń zbędne `preview/*` w konsoli.

### `Connection url is empty`

Krok `prod-db-url.sh` się nie wykonał albo `VERCEL_TOKEN` nie ma dostępu do projektu — zobacz jego log.

---

## Checklist dla Agentów

Przed rozpoczęciem pracy z CI/CD:

- [ ] Czytałem `PROJECT_STATUS.md` i `ROADMAP.md`
- [ ] Sprawdziłem `gh run list --limit 5`
- [ ] Wszystkie wymagane secrets są ustawione (`VERCEL_TOKEN`, `NEON_API_KEY`, `BACKUP_PASSPHRASE`; jeśli nie → zgłoś)
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
