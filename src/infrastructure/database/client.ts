import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../../generated/prisma/client";

type DatabaseClientOptions = {
  timeoutMs?: number;
};

export function createPrismaClient(
  databaseUrl: string,
  { timeoutMs = 5_000 }: DatabaseClientOptions = {},
): PrismaClient {
  const adapter = new PrismaPg({
    connectionString: databaseUrl,
    connectionTimeoutMillis: timeoutMs,
    query_timeout: timeoutMs,
    statement_timeout: timeoutMs,
  });
  return new PrismaClient({ adapter });
}
