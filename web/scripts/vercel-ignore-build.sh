#!/usr/bin/env bash
# Vercel "Ignored Build Step" (wired in /vercel.json).
# Exit 0 = skip the build, exit 1 = build.

# Preview without its own database: skip quietly instead of building against
# production. The Preview Database workflow redeploys once the DB exists.
if [ "$VERCEL_ENV" = "preview" ]; then
  KEY="DATABASE_URL_$(echo "$VERCEL_GIT_COMMIT_REF" | sed 's/[^a-zA-Z0-9]/_/g' | tr '[:lower:]' '[:upper:]')"
  if [ -z "${!KEY}" ]; then
    echo "Skipping preview build: $KEY not set yet (no preview database)."
    exit 0
  fi
fi

# Skip when only docs / agent files changed.
if git diff --quiet HEAD^ HEAD -- . \
  ':!docs/**' ':!ROADMAP.md' ':!PROJECT_STATUS.md' ':!CLAUDE.md' ':!AGENTS.md' \
  ':!web/AGENTS.md' ':!.tmp/**' ':!.claude/**' ':!.agents/**' 2>/dev/null; then
  echo "Skipping build: only documentation changed."
  exit 0
fi

exit 1
