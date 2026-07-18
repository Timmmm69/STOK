import { z } from "zod";

export const setupInputSchema = z.object({
  storeName: z.string().trim().min(1).max(120),
});

export const idempotencyKeySchema = z.string().trim().min(8).max(128);

export type SetupInput = z.infer<typeof setupInputSchema>;

export type ConfiguredSetup = {
  status: "configured";
  organization: {
    id: string;
    name: string;
    currency: "BYN";
    timezone: "Europe/Minsk";
    locale: "ru";
  };
  store: {
    id: string;
    name: string;
  };
};

export type SetupState =
  | {
      status: "pending";
      defaults: {
        storeName: "Лучок";
        currency: "BYN";
        timezone: "Europe/Minsk";
        locale: "ru";
      };
    }
  | ConfiguredSetup;

export type StoredSetup = ConfiguredSetup & {
  idempotencyKey: string;
  requestFingerprint: string;
};

export class SetupConflictError extends Error {
  constructor() {
    super("Магазин уже настроен с другими данными");
    this.name = "SetupConflictError";
  }
}
