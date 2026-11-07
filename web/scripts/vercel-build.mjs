#!/usr/bin/env node
/**
 * Vercel build entry point (`npm run vercel-build`, wired in /vercel.json).
 *
 * Databases come from the Vercel ↔ Neon integration (store neon-aero-prism):
 *   production → Neon branch `main` (endpoint PRODUCTION_DB_ENDPOINT)
 *   preview    → Neon branch `preview/<git branch>`, created by the
 *                integration from `main` before the build starts, i.e. a
 *                copy of PRODUCTION data. The integration overrides
 *                DATABASE_URL / DATABASE_URL_UNPOOLED for that deployment.
 *
 * Both run `prisma migrate deploy` before `next build`, so a PR's migrations
 * are tried on a copy of production before they reach production. If
 * migrations fail the build fails and Vercel keeps the previous deployment.
 *
 * GUARD: a preview build stops if its database is the production endpoint
 * (e.g. the integration did not create a branch), and a production build
 * stops if its database is anything else. DIRECT_URL is ignored on purpose:
 * it is a manually set project variable that also reaches previews.
 */
import { execSync } from "node:child_process";
import { PRODUCTION_DB_ENDPOINT, endpointId, unpooled } from "./production-db.mjs";

const env = process.env.VERCEL_ENV;
const run = (cmd, extraEnv = {}) =>
  execSync(cmd, { stdio: "inherit", env: { ...process.env, ...extraEnv } });

function fail(message) {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
}

if (env === "production" || env === "preview") {
  const url = process.env.DATABASE_URL;
  if (!url) fail("DATABASE_URL is not set (Vercel ↔ Neon integration missing?).");
  const endpoint = endpointId(url);
  if (!endpoint) fail("DATABASE_URL is not a Neon connection string.");

  if (env === "preview" && endpoint === PRODUCTION_DB_ENDPOINT) {
    fail(
      `Preview build would use the PRODUCTION database (${endpoint}).\n` +
        "  Previews must run on their own Neon branch. Check Vercel → Storage →\n" +
        "  neon-aero-prism → beanmap → 'Create database branch for deployment: Preview'."
    );
  }
  if (env === "production" && endpoint !== PRODUCTION_DB_ENDPOINT) {
    fail(
      `Production build points at ${endpoint}, expected ${PRODUCTION_DB_ENDPOINT}.\n` +
        "  If production really moved, update web/scripts/production-db.mjs in a PR."
    );
  }

  // Integration-provided direct URL of the SAME endpoint, else derive it.
  const direct =
    endpointId(process.env.DATABASE_URL_UNPOOLED) === endpoint
      ? process.env.DATABASE_URL_UNPOOLED
      : unpooled(url);

  console.log(`▶ ${env}: database endpoint ${endpoint} — applying migrations…`);
  run("npx prisma migrate deploy", { DATABASE_URL: direct });
}

run("npx next build");
