import { createHealthService } from "../application/health/get-health";
import { getHealthDatabaseTimeoutMs } from "../infrastructure/config/server-env";
import { databaseHealthProbe } from "../infrastructure/database/health-probe";
import { healthLogger } from "../infrastructure/logging/logger";

export async function getSystemHealth() {
  const service = createHealthService({
    databaseProbe: databaseHealthProbe,
    logger: healthLogger,
    timeoutMs: getHealthDatabaseTimeoutMs(),
  });

  return service();
}
