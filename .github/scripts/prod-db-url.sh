#!/usr/bin/env bash
# Exports the PRODUCTION database URL into the job environment, read live
# from the Vercel project (the Neon integration keeps it there), so GitHub
# never holds a stale copy of it.
#
#   .github/scripts/prod-db-url.sh            → DATABASE_URL (direct, unpooled)
#
# Requires: VERCEL_TOKEN. Fails unless the URL's Neon endpoint equals the one
# pinned in web/scripts/production-db.mjs. The URL is masked in logs — this
# repository is PUBLIC, never echo it.
set -euo pipefail

: "${VERCEL_TOKEN:?VERCEL_TOKEN is not set}"
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
CFG="$ROOT/web/scripts/production-db.mjs"
TEAM="$(node "$CFG" team)"
PROJECT="$(node "$CFG" vercelProject)"
EXPECTED="$(node "$CFG" endpoint)"
API="https://api.vercel.com"
AUTH=(-H "Authorization: Bearer ${VERCEL_TOKEN}")

ENV_ID="$(curl -sf "${AUTH[@]}" "$API/v9/projects/$PROJECT/env?teamId=$TEAM" \
  | jq -r '[.envs[] | select(.key == "DATABASE_URL_UNPOOLED" and (.target | index("production")) and (.gitBranch == null))][0].id // empty')"
if [ -z "$ENV_ID" ]; then
  echo "::error::DATABASE_URL_UNPOOLED (production) not found in Vercel project $PROJECT"
  exit 1
fi

URL="$(curl -sf "${AUTH[@]}" "$API/v1/projects/$PROJECT/env/$ENV_ID?teamId=$TEAM" | jq -r '.value // empty')"
if [ -z "$URL" ]; then
  echo "::error::Could not read DATABASE_URL_UNPOOLED from Vercel (token lacks access?)"
  exit 1
fi
echo "::add-mask::$URL"
PASSWORD="$(node -e 'console.log(decodeURIComponent(new URL(process.argv[1]).password))' "$URL")"
[ -n "$PASSWORD" ] && echo "::add-mask::$PASSWORD"

ENDPOINT="$(CFG="$CFG" node -e 'import(process.env.CFG).then(m => console.log(m.endpointId(process.argv[1]) ?? ""))' "$URL")"
if [ "$ENDPOINT" != "$EXPECTED" ]; then
  echo "::error::Vercel production database endpoint is '$ENDPOINT', web/scripts/production-db.mjs expects '$EXPECTED'"
  exit 1
fi
echo "Production database endpoint: $ENDPOINT (matches web/scripts/production-db.mjs)"

if [ -n "${GITHUB_ENV:-}" ]; then
  echo "DATABASE_URL=$URL" >> "$GITHUB_ENV"
else
  echo "Not in GitHub Actions — URL not exported." >&2
fi
