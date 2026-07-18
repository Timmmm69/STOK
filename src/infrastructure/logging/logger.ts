import pino from "pino";

import type { HealthLogger } from "../../application/health/get-health";
import { getLogLevel } from "../config/server-env";

const logger = pino({
  level: getLogLevel(),
  base: undefined,
  timestamp: pino.stdTimeFunctions.isoTime,
});

export const healthLogger: HealthLogger = {
  info(payload) {
    logger.info(payload);
  },
  warn(payload) {
    logger.warn(payload);
  },
};
