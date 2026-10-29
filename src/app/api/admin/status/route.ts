import { CONTROLS } from "@/lib/controls";
import { executeControlCheck, type Status } from "@/lib/app-status";

export async function GET() {
  const services = await Promise.all(CONTROLS.map(executeControlCheck));

  let globalStatus: Status = "operational";
  if (services.some((s) => s.status === "degraded")) globalStatus = "degraded";
  if (services.some((s) => s.status === "down")) globalStatus = "down";

  return Response.json({
    checkedAt: new Date().toISOString(),
    globalStatus,
    services,
  });
}
