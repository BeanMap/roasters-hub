#!/usr/bin/env bash
# Vercel "Ignored Build Step" (wired in /vercel.json).
# Exit 0 = skip the build, exit 1 = build.
#
# Note: project environment variables are NOT available in this step, so the
# "preview must have its own database" guard lives in scripts/vercel-build.mjs.

# Skip when only docs / agent files changed. Pathspecs are repo-root based
# (":/"): Vercel runs this from the project root directory (web/), and a
# change outside it (vercel.json, .github) must still count.
if git diff --quiet HEAD^ HEAD -- ':/' \
  ':!/docs/**' ':!/ROADMAP.md' ':!/PROJECT_STATUS.md' ':!/CLAUDE.md' ':!/AGENTS.md' \
  ':!/web/AGENTS.md' ':!/.tmp/**' ':!/.claude/**' ':!/.agents/**' 2>/dev/null; then
  echo "Skipping build: only documentation changed."
  exit 0
fi

exit 1
