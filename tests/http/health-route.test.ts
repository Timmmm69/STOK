import { describe, expect, it } from "vitest";

import type { SystemHealth } from "../../src/application/health/get-health";
import { healthResponse } from "../../src/app/api/health/route";

const timestamp = "2026-07-18T12:00:00.000Z";

function health(status: "ok" | "degraded"): SystemHealth {
  return {
    status,
    timestamp,
    checks: {
      application: { status: "up" },
      database: { status: status === "ok" ? "up" : "down", latencyMs: 3 },
    },
  };
}

describe("health route", () => {
  it("returns 200 and structured JSON when the database is available", async () => {
    const response = await healthResponse(async () => health("ok"));

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual(health("ok"));
  });

  it("returns 503 without internal errors when the database is unavailable", async () => {
    const response = await healthResponse(async () => health("degraded"));
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body).toEqual(health("degraded"));
    expect(JSON.stringify(body)).not.toContain("DATABASE_URL");
  });
});
