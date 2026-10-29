import { connection } from "next/server";

/**
 * Route de santé publique, surveillée par UptimeRobot.
 * Elle ne touche à aucune donnée et n'expose aucun secret.
 */
export async function GET() {
  await connection();

  return Response.json(
    {
      status: "ok",
      checkedAt: new Date().toISOString(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
