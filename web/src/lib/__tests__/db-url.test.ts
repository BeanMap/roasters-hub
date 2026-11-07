import { describe, expect, it } from "vitest";
import {
  PRODUCTION_DB_ENDPOINT,
  getDatabaseUrl,
  isLocalDatabaseUrl,
  neonEndpointId,
} from "@/lib/db-url";
import * as buildConfig from "../../../scripts/production-db.mjs";

const PROD_POOLED = `postgresql://u:p@${PRODUCTION_DB_ENDPOINT}-pooler.c-3.eu-central-1.aws.neon.tech/neondb`;
const BRANCH_POOLED = "postgresql://u:p@ep-wandering-violet-al7zjly6-pooler.c-3.eu-central-1.aws.neon.tech/neondb";

describe("db-url", () => {
  it("mirrors the production endpoint used by the Vercel build", () => {
    expect(buildConfig.PRODUCTION_DB_ENDPOINT).toBe(PRODUCTION_DB_ENDPOINT);
    expect(buildConfig.endpointId(PROD_POOLED)).toBe(PRODUCTION_DB_ENDPOINT);
  });

  it("extracts the Neon endpoint id from pooled and direct URLs", () => {
    expect(neonEndpointId(PROD_POOLED)).toBe(PRODUCTION_DB_ENDPOINT);
    expect(neonEndpointId(PROD_POOLED.replace("-pooler", ""))).toBe(PRODUCTION_DB_ENDPOINT);
    expect(neonEndpointId("postgresql://u:p@localhost:5432/db")).toBeNull();
    expect(neonEndpointId(undefined)).toBeNull();
  });

  it("uses the integration's branch database on previews", () => {
    const env = { VERCEL_ENV: "preview", DATABASE_URL: BRANCH_POOLED } as unknown as NodeJS.ProcessEnv;
    expect(getDatabaseUrl(env)).toBe(BRANCH_POOLED);
  });

  it("refuses the production database on previews", () => {
    const env = { VERCEL_ENV: "preview", DATABASE_URL: PROD_POOLED } as unknown as NodeJS.ProcessEnv;
    expect(() => getDatabaseUrl(env)).toThrow(/production database/);
  });

  it("uses DATABASE_URL in production", () => {
    const env = { VERCEL_ENV: "production", DATABASE_URL: PROD_POOLED } as unknown as NodeJS.ProcessEnv;
    expect(getDatabaseUrl(env)).toBe(PROD_POOLED);
  });

  it("detects local Postgres", () => {
    expect(isLocalDatabaseUrl("postgresql://u:p@localhost:5432/db")).toBe(true);
    expect(isLocalDatabaseUrl("postgresql://u:p@ep-x-pooler.eu-central-1.aws.neon.tech/db")).toBe(false);
    expect(isLocalDatabaseUrl(undefined)).toBe(false);
  });
});
