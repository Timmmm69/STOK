import { prismaAdapter } from "better-auth/adapters/prisma";
import { betterAuth } from "better-auth/minimal";

import { getAuthEnvironment } from "../../../infrastructure/config/auth-env";
import { getPrismaClient } from "../../../infrastructure/database/prisma";

let authInstance: ReturnType<typeof createAuth> | undefined;

function createAuth() {
  const environment = getAuthEnvironment();

  return betterAuth({
    appName: "STOK",
    baseURL: environment.BETTER_AUTH_URL,
    secret: environment.BETTER_AUTH_SECRET,
    trustedOrigins: [environment.BETTER_AUTH_URL],
    database: prismaAdapter(getPrismaClient(), { provider: "postgresql" }),
    socialProviders: {
      google: {
        clientId: environment.GOOGLE_CLIENT_ID,
        clientSecret: environment.GOOGLE_CLIENT_SECRET,
        disableSignUp: true,
        prompt: "select_account",
      },
    },
    account: {
      accountLinking: {
        enabled: true,
      },
    },
    session: {
      expiresIn: 60 * 60 * 12,
      updateAge: 60 * 60,
    },
  });
}

export function getAuth() {
  authInstance ??= createAuth();
  return authInstance;
}
