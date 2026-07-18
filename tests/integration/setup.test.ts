import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { PrismaClient } from "../../src/generated/prisma/client";
import { createSetupService } from "../../src/modules/organizations/application/setup-service";
import { SetupConflictError } from "../../src/modules/organizations";
import { createPrismaSetupRepository } from "../../src/modules/organizations/infrastructure/prisma-setup-repository";
import { getAllowedOwnerEmail } from "../../src/infrastructure/config/auth-env";
import { createPrismaClient } from "../../src/infrastructure/database/client";
import { getDatabaseUrl } from "../../src/infrastructure/config/server-env";

let prisma: PrismaClient;

beforeAll(() => {
  prisma = createPrismaClient(getDatabaseUrl());
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("organization and store setup", () => {
  it("creates one scoped organization and safely handles repeats", async () => {
    const owner = await prisma.user.findUniqueOrThrow({
      where: { email: getAllowedOwnerEmail() },
    });
    const service = createSetupService(createPrismaSetupRepository(prisma));

    const first = await service.initialize(
      owner.id,
      { storeName: "Лучок" },
      "integration-request-0001",
    );
    const repeated = await service.initialize(
      owner.id,
      { storeName: "Лучок" },
      "integration-request-0001",
    );

    expect(repeated).toEqual(first);
    expect(await prisma.organization.count()).toBe(1);
    expect(await prisma.store.count()).toBe(1);
    expect(await prisma.organizationMembership.count()).toBe(1);

    await expect(
      service.initialize(owner.id, { storeName: "Другой магазин" }, "integration-request-0002"),
    ).rejects.toBeInstanceOf(SetupConflictError);
    expect(await prisma.organization.count()).toBe(1);
  });

  it("keeps the model ready for another store without showing that workflow yet", async () => {
    const organization = await prisma.organization.findFirstOrThrow();

    await prisma.store.create({
      data: { organizationId: organization.id, name: "Будущий второй магазин" },
    });

    expect(await prisma.store.count({ where: { organizationId: organization.id } })).toBe(2);
  });
});
