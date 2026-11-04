/**
 * Returns the appropriate database URL for the current environment.
 *
 * In Vercel Preview Deployments, reads VERCEL_GIT_COMMIT_REF to find
 * a branch-specific DATABASE_URL_<SANITIZED_BRANCH> env var (created by
 * .github/workflows/preview-db.yml). Falls back to DATABASE_URL for
 * production and local dev.
 *
 * Branch sanitization: feat/mn-cafe-profiles → DATABASE_URL_FEAT_MN_CAFE_PROFILES
 */
export function branchDatabaseEnvKey(branchRef: string): string {
  return `DATABASE_URL_${branchRef.replace(/[^a-zA-Z0-9]/g, "_").toUpperCase()}`;
}

export function getDatabaseUrl(env: NodeJS.ProcessEnv = process.env): string {
  const branchRef = env.VERCEL_GIT_COMMIT_REF;
  if (branchRef && branchRef !== "main") {
    const branchUrl = env[branchDatabaseEnvKey(branchRef)];
    if (branchUrl) return branchUrl;
  }
  return env.DATABASE_URL!;
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
