"use client";

import { createAuthClient } from "better-auth/react";

const authClient = createAuthClient();

export async function signInWithGoogle(): Promise<string | null> {
  const result = await authClient.signIn.social({
    provider: "google",
    callbackURL: "/setup",
  });

  return result.error?.message ?? null;
}

export async function signOut(): Promise<void> {
  await authClient.signOut();
}
