import { getAllowedOwnerEmail } from "../../../infrastructure/config/auth-env";
import { resolveIdentity } from "../application/resolve-identity";
import type { AuthenticatedSession, Identity } from "../domain/identity";
import { getAuth } from "./auth";

export async function getVerifiedIdentity(requestHeaders: Headers): Promise<Identity | null> {
  const session = await getAuth().api.getSession({ headers: requestHeaders });
  return resolveIdentity(session as AuthenticatedSession | null, getAllowedOwnerEmail());
}
