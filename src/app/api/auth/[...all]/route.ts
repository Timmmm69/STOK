import { handleAuthRequest } from "../../../../composition/auth";

export const dynamic = "force-dynamic";

export function GET(request: Request): Promise<Response> {
  return handleAuthRequest(request);
}

export function POST(request: Request): Promise<Response> {
  return handleAuthRequest(request);
}
