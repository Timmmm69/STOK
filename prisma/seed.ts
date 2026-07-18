import "dotenv/config";

import { getAllowedOwnerEmail } from "../src/infrastructure/config/auth-env";
import { createPrismaClient } from "../src/infrastructure/database/client";
import { getDatabaseUrl } from "../src/infrastructure/config/server-env";

const prisma = createPrismaClient(getDatabaseUrl());
const ownerEmail = getAllowedOwnerEmail();

try {
  await prisma.$transaction([
    prisma.harnessState.upsert({
      where: { key: "bootstrap" },
      create: { key: "bootstrap", value: "ready" },
      update: { value: "ready" },
    }),
    prisma.user.upsert({
      where: { id: "invited-owner" },
      create: {
        id: "invited-owner",
        name: "Владелец Лучка",
        email: ownerEmail,
        emailVerified: true,
      },
      update: {
        name: "Владелец Лучка",
        email: ownerEmail,
        emailVerified: true,
      },
    }),
  ]);
} finally {
  await prisma.$disconnect();
}
