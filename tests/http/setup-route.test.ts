import { beforeEach, describe, expect, it, vi } from "vitest";

import { SetupConflictError } from "../../src/modules/organizations";

const getSetupForRequest = vi.fn();
const initializeSetupForRequest = vi.fn();
const reportApplicationError = vi.fn();

vi.mock("@/composition/setup", () => ({
  getSetupForRequest,
  initializeSetupForRequest,
}));

vi.mock("@/composition/logging", () => ({ reportApplicationError }));

const { GET, POST } = await import("../../src/app/api/setup/route");

const configured = {
  status: "configured" as const,
  organization: {
    id: "organization-1",
    name: "Лучок",
    currency: "BYN" as const,
    timezone: "Europe/Minsk" as const,
    locale: "ru" as const,
  },
  store: { id: "store-1", name: "Лучок" },
};

describe("setup route", () => {
  beforeEach(() => {
    getSetupForRequest.mockReset();
    initializeSetupForRequest.mockReset();
    reportApplicationError.mockReset();
  });

  it("rejects an unauthenticated request", async () => {
    getSetupForRequest.mockResolvedValue(null);

    const response = await GET(new Request("http://localhost/api/setup"));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Требуется вход" });
  });

  it("creates the invited owner's store without trusting an organization id", async () => {
    initializeSetupForRequest.mockResolvedValue(configured);
    const request = new Request("http://localhost/api/setup", {
      method: "POST",
      headers: { "content-type": "application/json", "idempotency-key": "request-0001" },
      body: JSON.stringify({ storeName: "Лучок", organizationId: "attacker-choice" }),
    });

    const response = await POST(request);

    expect(response.status).toBe(201);
    expect(initializeSetupForRequest).toHaveBeenCalledWith(
      request.headers,
      { storeName: "Лучок", organizationId: "attacker-choice" },
      "request-0001",
    );
    await expect(response.json()).resolves.toEqual(configured);
  });

  it("returns a stable conflict without exposing internals", async () => {
    initializeSetupForRequest.mockRejectedValue(new SetupConflictError());
    const response = await POST(
      new Request("http://localhost/api/setup", {
        method: "POST",
        headers: { "content-type": "application/json", "idempotency-key": "request-0002" },
        body: JSON.stringify({ storeName: "Другой магазин" }),
      }),
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: "Магазин уже настроен с другими данными",
    });
  });

  it("logs an unknown failure but returns only a safe message", async () => {
    initializeSetupForRequest.mockRejectedValue(new Error("postgresql://secret@database"));
    const response = await POST(
      new Request("http://localhost/api/setup", {
        method: "POST",
        headers: { "content-type": "application/json", "idempotency-key": "request-0003" },
        body: JSON.stringify({ storeName: "Лучок" }),
      }),
    );

    expect(response.status).toBe(500);
    expect(await response.text()).not.toContain("postgresql://");
    expect(reportApplicationError).toHaveBeenCalledOnce();
  });
});
