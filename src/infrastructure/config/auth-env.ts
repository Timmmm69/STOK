import { z } from "zod";

const allowedOwnerEmailSchema = z.email().transform((email) => email.toLowerCase());

const authEnvironmentSchema = z.object({
  BETTER_AUTH_URL: z.url(),
  BETTER_AUTH_SECRET: z.string().min(32),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  AUTH_ALLOWED_EMAIL: allowedOwnerEmailSchema,
});

export type AuthEnvironment = z.infer<typeof authEnvironmentSchema>;

export function getAuthEnvironment(environment: NodeJS.ProcessEnv = process.env): AuthEnvironment {
  return authEnvironmentSchema.parse(environment);
}

export function getAllowedOwnerEmail(environment: NodeJS.ProcessEnv = process.env): string {
  return allowedOwnerEmailSchema.parse(environment.AUTH_ALLOWED_EMAIL);
}
