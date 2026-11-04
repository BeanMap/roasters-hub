import { describe, expect, it } from "vitest";
import { branchDatabaseEnvKey, getDatabaseUrl, isLocalDatabaseUrl } from "@/lib/db-url";

describe("db-url", () => {
  it("uses the branch database on preview branches", () => {
    const env = {
      VERCEL_GIT_COMMIT_REF: "feat/mn-cafe",
      DATABASE_URL: "postgres://prod",
      DATABASE_URL_FEAT_MN_CAFE: "postgres://branch",
    } as unknown as NodeJS.ProcessEnv;
    expect(branchDatabaseEnvKey("feat/mn-cafe")).toBe("DATABASE_URL_FEAT_MN_CAFE");
    expect(getDatabaseUrl(env)).toBe("postgres://branch");
  });

  it("uses DATABASE_URL on main", () => {
    const env = { VERCEL_GIT_COMMIT_REF: "main", DATABASE_URL: "postgres://prod" } as unknown as NodeJS.ProcessEnv;
    expect(getDatabaseUrl(env)).toBe("postgres://prod");
  });

  it("detects local Postgres", () => {
    expect(isLocalDatabaseUrl("postgresql://u:p@localhost:5432/db")).toBe(true);
    expect(isLocalDatabaseUrl("postgresql://u:p@ep-x-pooler.eu-central-1.aws.neon.tech/db")).toBe(false);
    expect(isLocalDatabaseUrl(undefined)).toBe(false);
  });
});
