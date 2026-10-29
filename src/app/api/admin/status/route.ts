import { CONTROLS } from "@/lib/controls";
import { executeControlCheck, type Status } from "@/lib/app-status";
import { createClientServer } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClientServer();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return Response.json(
      { error: "Non authentifié." },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (user.app_metadata?.role !== "admin") {
    return Response.json(
      { error: "Accès réservé aux administrateurs." },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  const services = await Promise.all(CONTROLS.map(executeControlCheck));

  let globalStatus: Status = "operational";
  if (services.some((s) => s.status === "degraded")) globalStatus = "degraded";
  if (services.some((s) => s.status === "down")) globalStatus = "down";

  return Response.json(
    {
      checkedAt: new Date().toISOString(),
      globalStatus,
      services,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
