/**
 * Database URL for the current environment.
 *
 * Every environment uses DATABASE_URL. On Vercel the Neon integration sets
 * it: production → Neon branch `main`; preview → a per-deployment Neon
 * branch `preview/<git branch>` (copy of production). Locally / in CI it is
 * your own Postgres.
 *
 * Guard: a preview deployment must never reach the production database.
 * The constant mirrors web/scripts/production-db.mjs (used by the build);
 * src/lib/__tests__/db-url.test.ts keeps both equal.
 */
export const PRODUCTION_DB_ENDPOINT = "ep-purple-grass-al8w7icb";

/** Neon endpoint id of a connection string ("ep-…", pooled or not), or null. */
export function neonEndpointId(url: string | undefined): string | null {
  if (!url) return null;
  try {
    const label = new URL(url).hostname.split(".")[0];
    return label.startsWith("ep-") ? label.replace(/-pooler$/, "") : null;
  } catch {
    return null;
  }
}

export function getDatabaseUrl(env: NodeJS.ProcessEnv = process.env): string {
  const url = env.DATABASE_URL!;
  if (env.VERCEL_ENV === "preview" && neonEndpointId(url) === PRODUCTION_DB_ENDPOINT) {
    throw new Error("Preview deployment must not use the production database");
  }
  return url;
}

/** True for a plain Postgres on this machine (docker, CI service container). */
export function isLocalDatabaseUrl(url: string | undefined): boolean {
  if (!url) return false;
  try {
    const { hostname } = new URL(url);
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "postgres";
  } catch {
    return false;
  }
}
