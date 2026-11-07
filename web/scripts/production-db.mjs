/**
 * Identity of the PRODUCTION database. Not secrets: these ids are only
 * names, a connection still needs the password from Vercel.
 *
 * Production = Neon project `neon-aero-prism` (steep-smoke-16472365) in the
 * Neon organization "Vercel: mareknadra's projects", installed through the
 * Vercel Marketplace and attached to the Vercel project `beanmap`.
 * Its default branch `main` is served by endpoint ep-purple-grass-al8w7icb.
 *
 * Used by:
 *   - scripts/vercel-build.mjs   → production builds must use this endpoint,
 *                                  preview builds must NOT
 *   - src/lib/db-url.ts          → same rule at runtime (constant mirrored,
 *                                  kept equal by src/lib/__tests__/db-url.test.ts)
 *   - .github/workflows/*        → backup, alignment check, branch cleanup
 *
 * If production ever moves to another Neon project/endpoint, change it here
 * in a PR — the "Database alignment" workflow fails until Vercel and this
 * file agree again.
 */
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

export const PRODUCTION_NEON_PROJECT_ID = "steep-smoke-16472365";
export const PRODUCTION_DB_ENDPOINT = "ep-purple-grass-al8w7icb";
export const VERCEL_TEAM_ID = "team_Ao3CoQ6zPx2zmfWeSfWB5c0P";
export const VERCEL_PROJECT_ID = "prj_JeqTOVLgdbyJ2ePp7vh3lS76U6w1";

/** Neon endpoint id of a connection string ("ep-…", pooled or not), or null. */
export function endpointId(url) {
  if (!url) return null;
  try {
    const label = new URL(url).hostname.split(".")[0];
    return label.startsWith("ep-") ? label.replace(/-pooler$/, "") : null;
  } catch {
    return null;
  }
}

/** Neon: migrations need a direct (non-pooled) connection for advisory locks. */
export function unpooled(url) {
  return url.replace(/-pooler(\.[^/]*neon\.tech)/, "$1");
}

// CLI: `node scripts/production-db.mjs <name>` prints one constant (for workflows).
// Only when run directly — not when imported (e.g. from `node -e`, where argv
// can contain this file's path too).
const isCli =
  !process.execArgv.some((a) => a === "-e" || a === "--eval" || a === "-p" || a === "--print") &&
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (isCli && process.argv[2]) {
  const value = {
    project: PRODUCTION_NEON_PROJECT_ID,
    endpoint: PRODUCTION_DB_ENDPOINT,
    team: VERCEL_TEAM_ID,
    vercelProject: VERCEL_PROJECT_ID,
  }[process.argv[2]];
  if (!value) {
    console.error(`unknown name: ${process.argv[2]}`);
    process.exit(2);
  }
  console.log(value);
}
