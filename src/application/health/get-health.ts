export type DatabaseHealthProbe = () => Promise<void>;

export type HealthLogger = {
  info(payload: Record<string, unknown>): void;
  warn(payload: Record<string, unknown>): void;
};

export type SystemHealth = {
  status: "ok" | "degraded";
  timestamp: string;
  checks: {
    application: { status: "up" };
    database: { status: "up" | "down"; latencyMs: number };
  };
};

type HealthServiceDependencies = {
  databaseProbe: DatabaseHealthProbe;
  logger: HealthLogger;
  timeoutMs: number;
  now?: () => Date;
  monotonicNow?: () => number;
};

export function createHealthService({
  databaseProbe,
  logger,
  timeoutMs,
  now = () => new Date(),
  monotonicNow = () => performance.now(),
}: HealthServiceDependencies): () => Promise<SystemHealth> {
  return async () => {
    const startedAt = monotonicNow();
    let timeout: ReturnType<typeof setTimeout> | undefined;

    try {
      await Promise.race([
        databaseProbe(),
        new Promise<never>((_, reject) => {
          timeout = setTimeout(
            () => reject(new Error("database health check timed out")),
            timeoutMs,
          );
        }),
      ]);

      const latencyMs = Math.max(0, Math.round(monotonicNow() - startedAt));
      logger.info({ event: "health.check.completed", databaseStatus: "up", latencyMs });

      return {
        status: "ok",
        timestamp: now().toISOString(),
        checks: { application: { status: "up" }, database: { status: "up", latencyMs } },
      };
    } catch {
      const latencyMs = Math.max(0, Math.round(monotonicNow() - startedAt));
      logger.warn({ event: "health.database.unavailable", databaseStatus: "down", latencyMs });

      return {
        status: "degraded",
        timestamp: now().toISOString(),
        checks: { application: { status: "up" }, database: { status: "down", latencyMs } },
      };
    } finally {
      if (timeout !== undefined) {
        clearTimeout(timeout);
      }
    }
  };
}
