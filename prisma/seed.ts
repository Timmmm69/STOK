import "dotenv/config";

import { createPrismaClient } from "../src/infrastructure/database/client";
import { getDatabaseUrl } from "../src/infrastructure/config/server-env";

const prisma = createPrismaClient(getDatabaseUrl());

try {
  await prisma.harnessState.upsert({
    where: { key: "bootstrap" },
    create: { key: "bootstrap", value: "ready" },
    update: { value: "ready" },
  });
} finally {
  await prisma.$disconnect();
}
