import { after } from "next/server";
import * as z from "zod";

import { CHAT_QUOTA_PER_HOUR, chatLimiter } from "@/lib/cache";
import { runChatAgent } from "@/lib/ia";
import { flushLangfuse } from "@/lib/langfuse";
import { createClientServer } from "@/lib/supabase/server";

export const maxDuration = 60;

const requestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1).max(4000),
      }),
    )
    .min(1)
    .max(24),
  filters: z.object({
    search: z.string().max(100),
    capture: z.enum(["all", "captured", "uncaptured", "absent"]),
    mode: z.enum(["regional", "national"]),
  }),
});

export async function POST(request: Request) {
  let user;

  try {
    const supabase = await createClientServer();
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch (error) {
    console.error(
      "Impossible de vérifier la session pour l'assistant :",
      error instanceof Error ? error.message : error,
    );

    return Response.json(
      { error: "Impossible de vérifier votre session. Reconnectez-vous." },
      { status: 500 },
    );
  }

  if (!user) {
    return Response.json(
      { error: "Connectez-vous pour utiliser l'assistant." },
      { status: 401 },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Corps de requête invalide." },
      { status: 400 },
    );
  }

  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: "Requête invalide." }, { status: 400 });
  }

  try {
    const { success, reset } = await chatLimiter.limit(user.id);

    if (!success) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((reset - Date.now()) / 1000),
      );
      const minutes = Math.ceil(retryAfterSeconds / 60);

      return Response.json(
        {
          error: `Quota atteint : ${CHAT_QUOTA_PER_HOUR} messages par heure. Réessayez dans ${minutes} min.`,
        },
        {
          status: 429,
          headers: { "Retry-After": String(retryAfterSeconds) },
        },
      );
    }
  } catch (error) {
    // Le chat reste utilisable si le quota est momentanément indisponible.
    console.error(
      "Vérification du quota impossible :",
      error instanceof Error ? error.message : error,
    );
  }

  if (!process.env.AI_API_KEY) {
    console.error("AI_API_KEY est absente : assistant désactivé.");

    return Response.json(
      { error: "L'assistant est indisponible pour le moment." },
      { status: 503 },
    );
  }

  const sessionId =
    request.headers.get("x-chat-session")?.slice(0, 128) || "pkmn-cloud";

  after(flushLangfuse);

  try {
    const { reply, filters } = await runChatAgent(
      parsed.data.messages,
      parsed.data.filters,
      { sessionId, userId: user.id },
    );

    return Response.json({ reply, filters });
  } catch (error) {
    console.error(
      "Erreur de l'assistant LangChain :",
      error instanceof Error ? error.message : error,
    );

    return Response.json(
      { error: "L'assistant est indisponible pour le moment." },
      { status: 502 },
    );
  }
}
