import type { AuthenticatedSession, Identity } from "../domain/identity";

export function resolveIdentity(
  session: AuthenticatedSession | null,
  allowedEmail: string,
): Identity | null {
  if (
    !session ||
    !session.user.emailVerified ||
    session.user.email.toLowerCase() !== allowedEmail.toLowerCase()
  ) {
    return null;
  }

  return {
    userId: session.user.id,
    email: session.user.email.toLowerCase(),
    name: session.user.name,
  };
}
