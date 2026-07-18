import { describe, expect, it } from "vitest";

import { SetupConflictError, type StoredSetup } from "../domain/setup";
import { createSetupService, type SetupRepository } from "./setup-service";

function createMemoryRepository(): SetupRepository {
  let stored: StoredSetup | null = null;

  return {
    async findByUserId() {
      return stored;
    },
    async create(params) {
      stored = {
        status: "configured",
        idempotencyKey: params.idempotencyKey,
        requestFingerprint: params.requestFingerprint,
        organization: {
          id: "organization-1",
          name: params.storeName,
          currency: "BYN",
          timezone: "Europe/Minsk",
          locale: "ru",
        },
        store: { id: "store-1", name: params.storeName },
      };
      return stored;
    },
  };
}

describe("setup service", () => {
  it("creates one organization and returns the same result on repeat", async () => {
    const service = createSetupService(createMemoryRepository());

    const first = await service.initialize("owner-1", { storeName: " Лучок " }, "request-0001");
    const repeated = await service.initialize("owner-1", { storeName: "Лучок" }, "request-0001");

    expect(first).toEqual(repeated);
    expect(first.organization).toMatchObject({ name: "Лучок", currency: "BYN" });
  });

  it("rejects conflicting setup data", async () => {
    const service = createSetupService(createMemoryRepository());
    await service.initialize("owner-1", { storeName: "Лучок" }, "request-0001");

    await expect(
      service.initialize("owner-1", { storeName: "Другой магазин" }, "request-0002"),
    ).rejects.toBeInstanceOf(SetupConflictError);
  });
});
