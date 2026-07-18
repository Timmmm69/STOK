import { describe, expect, it, vi } from "vitest";

import { createHealthService } from "./get-health";

const fixedDate = new Date("2026-07-18T12:00:00.000Z");

function createLogger() {
  return { info: vi.fn(), warn: vi.fn() };
}

describe("health service", () => {
  it("reports application and database as available", async () => {
    const logger = createLogger();
    const times = [100, 107];
    let timeIndex = 0;
    const getHealth = createHealthService({
      databaseProbe: vi.fn().mockResolvedValue(undefined),
      logger,
      timeoutMs: 100,
      now: () => fixedDate,
      monotonicNow: () => times[timeIndex++] ?? 107,
    });

    await expect(getHealth()).resolves.toEqual({
      status: "ok",
      timestamp: fixedDate.toISOString(),
      checks: {
        application: { status: "up" },
        database: { status: "up", latencyMs: 7 },
      },
    });
    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({ event: "health.check.completed", databaseStatus: "up" }),
    );
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it("returns a safe degraded result when the database probe fails", async () => {
    const logger = createLogger();
    const getHealth = createHealthService({
      databaseProbe: vi.fn().mockRejectedValue(new Error("secret internal connection detail")),
      logger,
      timeoutMs: 100,
      now: () => fixedDate,
      monotonicNow: () => 100,
    });

    const result = await getHealth();

    expect(result.status).toBe("degraded");
    expect(result.checks.database.status).toBe("down");
    expect(JSON.stringify(result)).not.toContain("secret internal connection detail");
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ event: "health.database.unavailable", databaseStatus: "down" }),
    );
  });
});
