import { getPrismaClient } from "../infrastructure/database/prisma";
import type { Identity } from "../modules/identity/domain/identity";
import { getVerifiedIdentity } from "../modules/identity/infrastructure/session";
import { createSetupService } from "../modules/organizations/application/setup-service";
import type { ConfiguredSetup, SetupState } from "../modules/organizations/domain/setup";
import { createPrismaSetupRepository } from "../modules/organizations/infrastructure/prisma-setup-repository";

function setupService() {
  return createSetupService(createPrismaSetupRepository(getPrismaClient()));
}

export async function getSetupForRequest(
  requestHeaders: Headers,
): Promise<{ identity: Identity; setup: SetupState } | null> {
  const identity = await getVerifiedIdentity(requestHeaders);
  if (!identity) {
    return null;
  }

  return { identity, setup: await setupService().get(identity.userId) };
}

export async function initializeSetupForRequest(
  requestHeaders: Headers,
  input: unknown,
  idempotencyKey: string,
): Promise<ConfiguredSetup | null> {
  const identity = await getVerifiedIdentity(requestHeaders);
  if (!identity) {
    return null;
  }

  return setupService().initialize(identity.userId, input, idempotencyKey);
}
