import { applicationLogger } from "../infrastructure/logging/logger";

export function reportApplicationError(event: string, error: unknown): void {
  applicationLogger.error({
    event,
    errorType: error instanceof Error ? error.name : "UnknownError",
  });
}
