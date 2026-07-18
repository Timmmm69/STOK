import type { DatabaseHealthProbe } from "../../application/health/get-health";
import { getPrismaClient } from "./prisma";

export const databaseHealthProbe: DatabaseHealthProbe = async () => {
  await getPrismaClient().$queryRaw`SELECT 1`;
};
