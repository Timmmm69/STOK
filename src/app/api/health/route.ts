import type { SystemHealth } from "../../../application/health/get-health";
import { getSystemHealth } from "../../../composition/health";

type GetHealth = () => Promise<SystemHealth>;

export async function healthResponse(getHealth: GetHealth = getSystemHealth): Promise<Response> {
  const health = await getHealth();

  return Response.json(health, {
    status: health.status === "ok" ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function GET(): Promise<Response> {
  return healthResponse();
}
