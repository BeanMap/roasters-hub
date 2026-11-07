#!/usr/bin/env bash
# Fails when GitHub, Vercel and Neon disagree about which database is
# production (this happened once: GitHub secrets pointed at an old Neon
# project for months, so backups/verification ran on the wrong database).
#
# Checks, against web/scripts/production-db.mjs:
#   1. Vercel production DATABASE_URL_UNPOOLED → pinned endpoint
#      (done by prod-db-url.sh, run before this script)
#   2. NEON_API_KEY sees the pinned Neon project, and the endpoint of the
#      project's default branch is the pinned endpoint
#   3. every database-URL secret still present in GitHub
#      (LEGACY_DATABASE_URL / LEGACY_DIRECT_URL) points at the same endpoint
#
# Prints only ids, never URLs (this repository is public).
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
CFG="$ROOT/web/scripts/production-db.mjs"
PROJECT="$(node "$CFG" project)"
EXPECTED="$(node "$CFG" endpoint)"
endpoint_of() { node -e 'import(process.argv[1]).then(m => console.log(m.endpointId(process.argv[2]) ?? "(not a Neon URL)"))' "$CFG" "$1"; }
FAILED=0

# 2. Neon API key ↔ project ↔ endpoint
if [ -z "${NEON_API_KEY:-}" ]; then
  echo "::error::NEON_API_KEY is not set"; FAILED=1
else
  AUTH=(-H "Authorization: Bearer ${NEON_API_KEY}" -H "Accept: application/json")
  if ! BRANCHES="$(curl -sf "${AUTH[@]}" "https://console.neon.tech/api/v2/projects/$PROJECT/branches")"; then
    echo "::error::NEON_API_KEY cannot access Neon project $PROJECT — the GitHub secret belongs to another Neon account/organization."
    FAILED=1
  else
    DEFAULT_ID="$(jq -r '.branches[] | select(.default) | .id' <<<"$BRANCHES")"
    EP="$(curl -sf "${AUTH[@]}" "https://console.neon.tech/api/v2/projects/$PROJECT/branches/$DEFAULT_ID/endpoints" \
      | jq -r '[.endpoints[] | select(.type == "read_write")][0].id // empty')"
    if [ "$EP" = "$EXPECTED" ]; then
      echo "✔ Neon: project $PROJECT, default branch $DEFAULT_ID → $EP"
    else
      echo "::error::Neon default branch endpoint is '$EP', expected '$EXPECTED'"; FAILED=1
    fi
  fi
fi

# 3. Leftover URL secrets in GitHub must not point elsewhere
for NAME in LEGACY_DATABASE_URL LEGACY_DIRECT_URL; do
  VALUE="${!NAME:-}"
  [ -z "$VALUE" ] && { echo "✔ GitHub: $NAME not set"; continue; }
  echo "::add-mask::$VALUE"
  EP="$(endpoint_of "$VALUE")"
  if [ "$EP" = "$EXPECTED" ]; then
    echo "✔ GitHub: $NAME → $EP"
  else
    echo "::error::GitHub secret ${NAME#LEGACY_} points at '$EP', production is '$EXPECTED'. Delete it (workflows read the URL from Vercel)."
    FAILED=1
  fi
done

exit $FAILED
