import { CONTROLES } from "@/lib/controles";
import { executeControlCheck, type Status } from "@/lib/app-status";


export async function GET() {
  const services = await Promise.all(CONTROLES.map(executeControlCheck));

  let globalStatus: Status = "operationnel";
  if (services.some((s) => s.status === "degrade")) globalStatus = "degrade";
  if (services.some((s) => s.status === "en_panne")) globalStatus = "en_panne";

  return Response.json({
    checkedAt: new Date().toISOString(),
    globalStatus,
    services,
  });
}