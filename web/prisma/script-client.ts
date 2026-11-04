import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Prisma client for CLI scripts (seeds, backfills, verification).
 * Uses node-postgres for a local Postgres (docker / CI) and the Neon
 * serverless driver everywhere else.
 */
export function createScriptClient(): PrismaClient {
  const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL!;
  const host = (() => {
    try {
      return new URL(connectionString).hostname;
    } catch {
      return "";
    }
  })();
  const isLocal = ["localhost", "127.0.0.1", "postgres"].includes(host);
  const adapter = isLocal
    ? new PrismaPg({ connectionString })
    : new PrismaNeon({ connectionString });
  return new PrismaClient({ adapter });
}
