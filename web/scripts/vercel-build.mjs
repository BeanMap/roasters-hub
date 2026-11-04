#!/usr/bin/env node
/**
 * Vercel build entry point (`npm run vercel-build`, wired in /vercel.json).
 *
 * Why this exists: migrations used to run in a GitHub Action *in parallel*
 * with the Vercel build. New code could go live before its schema existed
 * (500s, try/catch "migration gap" workarounds), and a failed migration did
 * not stop the deploy. Now:
 *
 *   production → `prisma migrate deploy` runs first; if it fails the build
 *                fails and Vercel keeps serving the previous deployment.
 *   preview    → never touches the production database. The branch database
 *                (DATABASE_URL_<BRANCH>, created by .github/workflows/preview-db.yml)
 *                must exist, otherwise the build stops with a clear message.
 *   other      → plain `next build`.
 */
import { execSync } from "node:child_process";

const env = process.env.VERCEL_ENV;
const run = (cmd, extraEnv = {}) =>
  execSync(cmd, { stdio: "inherit", env: { ...process.env, ...extraEnv } });

/** Neon: migrations need a direct (non-pooled) connection for advisory locks. */
function directUrl() {
  if (process.env.DIRECT_URL) return process.env.DIRECT_URL;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return url.replace(/-pooler(\.[^/]*neon\.tech)/, "$1");
}

function branchKey(ref) {
  return `DATABASE_URL_${ref.replace(/[^a-zA-Z0-9]/g, "_").toUpperCase()}`;
}

if (env === "production") {
  console.log("▶ Applying database migrations (production)…");
  run("npx prisma migrate deploy", { DATABASE_URL: directUrl() });
} else if (env === "preview") {
  const ref = process.env.VERCEL_GIT_COMMIT_REF ?? "";
  const key = branchKey(ref);
  if (!process.env[key]) {
    console.error(
      `\n✖ No preview database for branch "${ref}" (${key} is not set).\n` +
        "  Preview deployments must not use the production database.\n" +
        "  Open a pull request: the 'Preview Database' workflow creates a Neon\n" +
        "  branch, sets this variable and redeploys the preview automatically.\n"
    );
    process.exit(1);
  }
  console.log(`▶ Preview build using branch database ${key}`);
}

run("npx next build");
