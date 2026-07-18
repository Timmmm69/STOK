import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { PrismaClient } from "../../src/generated/prisma/client";
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

describe("PostgreSQL integration", () => {
  it("applies the migration and deterministic seed", async () => {
    const marker = await prisma.harnessState.findUnique({ where: { key: "bootstrap" } });
    const invitedOwner = await prisma.user.findUnique({
      where: { email: getAllowedOwnerEmail() },
    });
    const connectivity = await prisma.$queryRaw<Array<{ value: number }>>`SELECT 1 AS value`;

    expect(marker).toMatchObject({ key: "bootstrap", value: "ready" });
    expect(invitedOwner).toMatchObject({ emailVerified: true, name: "Владелец Лучка" });
    expect(connectivity).toEqual([{ value: 1 }]);
  });
});
