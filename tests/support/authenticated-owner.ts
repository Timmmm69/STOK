import { prismaAdapter } from "better-auth/adapters/prisma";
import { betterAuth } from "better-auth/minimal";
import { testUtils } from "better-auth/plugins";

import { createPrismaClient } from "../../src/infrastructure/database/client";

const testDatabaseUrl =
  process.env.TEST_DATABASE_URL ??
  "postgresql://stok:stok_test@localhost:55433/stok_test?schema=public";

export async function prepareAuthenticatedOwner() {
  const prisma = createPrismaClient(testDatabaseUrl);
  const owner = await prisma.user.findUniqueOrThrow({ where: { email: "owner@example.com" } });

  await prisma.$transaction([
    prisma.organizationSetup.deleteMany({ where: { userId: owner.id } }),
    prisma.organizationMembership.deleteMany({ where: { userId: owner.id } }),
    prisma.store.deleteMany(),
    prisma.organization.deleteMany(),
    prisma.session.deleteMany({ where: { userId: owner.id } }),
  ]);

  const testAuth = betterAuth({
    baseURL: "http://localhost:3100",
    secret: "playwright-only-secret-at-least-32-characters",
    database: prismaAdapter(prisma, { provider: "postgresql" }),
    plugins: [testUtils()],
  });
  const context = await testAuth.$context;
  const login = await context.test.login({ userId: owner.id });

  return {
    cookies: login.cookies,
    disconnect: () => prisma.$disconnect(),
  };
}
