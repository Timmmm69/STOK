import { z } from "zod";

const databaseUrlSchema = z
  .string()
  .min(1)
  .refine((value) => value.startsWith("postgresql://") || value.startsWith("postgres://"), {
    message: "DATABASE_URL must be a PostgreSQL connection string",
  });

const timeoutSchema = z.coerce.number().int().min(100).max(10_000).default(1_500);
const logLevelSchema = z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info");

export function getDatabaseUrl(environment: NodeJS.ProcessEnv = process.env): string {
  return databaseUrlSchema.parse(environment.DATABASE_URL);
}

export function getHealthDatabaseTimeoutMs(environment: NodeJS.ProcessEnv = process.env): number {
  return timeoutSchema.parse(environment.HEALTH_DB_TIMEOUT_MS);
}

export function getLogLevel(environment: NodeJS.ProcessEnv = process.env): string {
  return logLevelSchema.parse(environment.LOG_LEVEL);
}
