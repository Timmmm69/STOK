import type { PrismaClient } from "../../generated/prisma/client";
import { getDatabaseUrl, getHealthDatabaseTimeoutMs } from "../config/server-env";
import { createPrismaClient } from "./client";

const globalDatabase = globalThis as typeof globalThis & {
  stokPrisma?: PrismaClient;
};

export function getPrismaClient(): PrismaClient {
  const client =
    globalDatabase.stokPrisma ??
    createPrismaClient(getDatabaseUrl(), { timeoutMs: getHealthDatabaseTimeoutMs() });

  if (process.env.NODE_ENV !== "production") {
    globalDatabase.stokPrisma = client;
  }

  return client;
}
