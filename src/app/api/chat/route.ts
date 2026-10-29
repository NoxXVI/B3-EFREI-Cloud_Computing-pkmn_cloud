import { after } from "next/server";
import * as z from "zod";

import { runChatAgent } from "@/lib/ia";
import { flushLangfuse, isLangfuseEnabled } from "@/lib/langfuse";
import { createClientServer } from "@/lib/supabase/server";

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
  if (!process.env.AI_API_KEY) {
    return Response.json(
      { error: "L'assistant n'est pas configuré : AI_API_KEY est manquante." },
      { status: 503 },
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

  const sessionId =
    request.headers.get("x-chat-session")?.slice(0, 128) || "pkmn-cloud";

  let userId: string | undefined;

  if (isLangfuseEnabled()) {
    try {
      const supabase = await createClientServer();
      const { data } = await supabase.auth.getUser();
      userId = data.user?.id;
    } catch (error) {
      console.error(
        "Impossible de récupérer l'utilisateur pour Langfuse :",
        error instanceof Error ? error.message : error,
      );
    }
  }

  after(flushLangfuse);

  try {
    const { reply, filters } = await runChatAgent(
      parsed.data.messages,
      parsed.data.filters,
      { sessionId, userId },
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
