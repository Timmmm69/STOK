import type { PrismaClient } from "../../../generated/prisma/client";
import type { StoredSetup } from "../domain/setup";
import type { SetupRepository } from "../application/setup-service";

function asStoredSetup(setup: {
  idempotencyKey: string;
  requestFingerprint: string;
  organization: {
    id: string;
    name: string;
    defaultCurrency: string;
    defaultTimezone: string;
    locale: string;
  };
  store: { id: string; name: string };
}): StoredSetup {
  if (
    setup.organization.defaultCurrency !== "BYN" ||
    setup.organization.defaultTimezone !== "Europe/Minsk" ||
    setup.organization.locale !== "ru"
  ) {
    throw new Error("Unsupported organization configuration");
  }

  return {
    status: "configured",
    idempotencyKey: setup.idempotencyKey,
    requestFingerprint: setup.requestFingerprint,
    organization: {
      id: setup.organization.id,
      name: setup.organization.name,
      currency: "BYN",
      timezone: "Europe/Minsk",
      locale: "ru",
    },
    store: {
      id: setup.store.id,
      name: setup.store.name,
    },
  };
}

export function createPrismaSetupRepository(prisma: PrismaClient): SetupRepository {
  return {
    async findByUserId(userId) {
      const setup = await prisma.organizationSetup.findUnique({
        where: { userId },
        include: { organization: true, store: true },
      });
      return setup ? asStoredSetup(setup) : null;
    },

    async create(params) {
      const result = await prisma.$transaction(async (transaction) => {
        const organization = await transaction.organization.create({
          data: {
            name: params.storeName,
            memberships: {
              create: { userId: params.userId },
            },
            stores: {
              create: { name: params.storeName },
            },
          },
          include: { stores: true },
        });
        const store = organization.stores[0];
        if (!store) {
          throw new Error("Organization setup did not create a store");
        }

        return transaction.organizationSetup.create({
          data: {
            userId: params.userId,
            organizationId: organization.id,
            storeId: store.id,
            idempotencyKey: params.idempotencyKey,
            requestFingerprint: params.requestFingerprint,
          },
          include: { organization: true, store: true },
        });
      });

      return asStoredSetup(result);
    },
  };
}
