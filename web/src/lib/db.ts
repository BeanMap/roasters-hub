import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaPg } from "@prisma/adapter-pg";
import { getDatabaseUrl, isLocalDatabaseUrl } from "./db-url";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const connectionString = getDatabaseUrl();
  // Neon's serverless driver talks WebSockets and cannot reach a plain local
  // Postgres (docker / CI service container), so use node-postgres there.
  const adapter = isLocalDatabaseUrl(connectionString)
    ? new PrismaPg({ connectionString })
    : new PrismaNeon({ connectionString });
  return new PrismaClient({ adapter });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
