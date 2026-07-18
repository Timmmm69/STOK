import { createHash } from "node:crypto";

import {
  idempotencyKeySchema,
  setupInputSchema,
  SetupConflictError,
  type ConfiguredSetup,
  type SetupState,
  type StoredSetup,
} from "../domain/setup";

export type SetupRepository = {
  findByUserId(userId: string): Promise<StoredSetup | null>;
  create(params: {
    userId: string;
    storeName: string;
    idempotencyKey: string;
    requestFingerprint: string;
  }): Promise<StoredSetup>;
};

function fingerprint(storeName: string): string {
  return createHash("sha256").update(JSON.stringify({ storeName })).digest("hex");
}

function configured(setup: StoredSetup): ConfiguredSetup {
  return {
    status: "configured",
    organization: setup.organization,
    store: setup.store,
  };
}

function resolveExisting(existing: StoredSetup, requestFingerprint: string): ConfiguredSetup {
  if (existing.requestFingerprint !== requestFingerprint) {
    throw new SetupConflictError();
  }

  return configured(existing);
}

export function createSetupService(repository: SetupRepository) {
  return {
    async get(userId: string): Promise<SetupState> {
      const existing = await repository.findByUserId(userId);
      if (existing) {
        return configured(existing);
      }

      return {
        status: "pending",
        defaults: {
          storeName: "Лучок",
          currency: "BYN",
          timezone: "Europe/Minsk",
          locale: "ru",
        },
      };
    },

    async initialize(
      userId: string,
      rawInput: unknown,
      rawIdempotencyKey: string,
    ): Promise<ConfiguredSetup> {
      const input = setupInputSchema.parse(rawInput);
      const idempotencyKey = idempotencyKeySchema.parse(rawIdempotencyKey);
      const requestFingerprint = fingerprint(input.storeName);
      const existing = await repository.findByUserId(userId);

      if (existing) {
        return resolveExisting(existing, requestFingerprint);
      }

      try {
        const created = await repository.create({
          userId,
          storeName: input.storeName,
          idempotencyKey,
          requestFingerprint,
        });
        return configured(created);
      } catch (error) {
        const concurrentResult = await repository.findByUserId(userId);
        if (concurrentResult) {
          return resolveExisting(concurrentResult, requestFingerprint);
        }
        throw error;
      }
    },
  };
}
