import { getAuth } from "./auth";

// Better Auth's schema generator expects a named eager instance.
// Runtime code imports getAuth() from auth.ts and remains lazy for safe builds.
export const auth = getAuth();
