#!/usr/bin/env bash
# Deletes Neon preview branches of the PRODUCTION project
# (web/scripts/production-db.mjs). Only branches named `preview/<git branch>`
# — created by the Vercel ↔ Neon integration — are ever touched; the default
# branch is refused even if its name matches.
#
#   neon-delete-preview.sh <git branch>      delete preview/<git branch>
#   neon-delete-preview.sh --stale           delete preview/* whose git branch
#                                            has no open pull request
#                                            (needs GH_TOKEN, GITHUB_REPOSITORY)
set -euo pipefail

: "${NEON_API_KEY:?NEON_API_KEY is not set}"
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
PROJECT="$(node "$ROOT/web/scripts/production-db.mjs" project)"
API="https://console.neon.tech/api/v2/projects/$PROJECT"
AUTH=(-H "Authorization: Bearer ${NEON_API_KEY}" -H "Accept: application/json")

BRANCHES="$(curl -sf "${AUTH[@]}" "$API/branches")" || {
  echo "::error::Neon API: cannot list branches of $PROJECT (NEON_API_KEY must belong to that project's organization)"
  exit 1
}

delete_branch() { # <neon branch name>
  local name="$1" id default
  id="$(jq -r --arg n "$name" '.branches[] | select(.name == $n) | .id' <<<"$BRANCHES")"
  default="$(jq -r --arg n "$name" '.branches[] | select(.name == $n) | .default' <<<"$BRANCHES")"
  if [ -z "$id" ]; then echo "Neon branch '$name' not found — nothing to delete."; return 0; fi
  if [ "$default" = "true" ] || [[ "$name" != preview/* ]]; then
    echo "::error::Refusing to delete '$name' ($id)"; return 1
  fi
  echo "Deleting Neon branch $name ($id)"
  curl -sf -X DELETE "${AUTH[@]}" "$API/branches/$id" > /dev/null
}

if [ "${1:-}" = "--stale" ]; then
  : "${GH_TOKEN:?GH_TOKEN is not set}"
  OPEN="$(curl -sf -H "Authorization: Bearer $GH_TOKEN" \
    "https://api.github.com/repos/$GITHUB_REPOSITORY/pulls?state=open&per_page=100" | jq -r '.[].head.ref')"
  jq -r '.branches[] | select(.name | startswith("preview/")) | .name' <<<"$BRANCHES" | while read -r name; do
    if grep -qxF "${name#preview/}" <<<"$OPEN"; then
      echo "Keeping $name (open PR)"
    else
      delete_branch "$name"
    fi
  done
else
  [ -n "${1:-}" ] || { echo "usage: $0 <git branch> | --stale" >&2; exit 2; }
  delete_branch "preview/$1"
fi
