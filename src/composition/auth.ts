import type { Identity } from "../modules/identity/domain/identity";
import { getAuth } from "../modules/identity/infrastructure/auth";
import { getVerifiedIdentity } from "../modules/identity/infrastructure/session";

export function handleAuthRequest(request: Request): Promise<Response> {
  return getAuth().handler(request);
}

export function getRequestIdentity(requestHeaders: Headers): Promise<Identity | null> {
  return getVerifiedIdentity(requestHeaders);
}
