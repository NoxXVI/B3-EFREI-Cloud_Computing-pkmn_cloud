import "server-only";

import { ChatOpenAI } from "@langchain/openai";
import { createAgent, tool } from "langchain";
import * as z from "zod";

import {
  getLangfuseCallbacks,
  type LangfuseTraceContext,
} from "@/lib/langfuse";
import type {
  ChatFilterPatch,
  ChatFilters,
  ChatMessage,
  ChatResponse,
} from "@/types/chat";

const CAPTURE_LABELS: Record<ChatFilters["capture"], string> = {
  all: "tous",
  captured: "capturés",
  uncaptured: "non capturés",
  absent: "absents de la checklist",
};

const filterPatchSchema = z.object({
  search: z
    .string()
    .max(80)
    .optional()
    .describe(
      "Texte recherché dans le nom ou le numéro du Pokédex. Chaîne vide pour effacer la recherche.",
    ),
  capture: z
    .enum(["all", "captured", "uncaptured", "absent"])
    .optional()
    .describe(
      "État de capture : all = tous, captured = capturés, uncaptured = non capturés, absent = absents de la checklist.",
    ),
  mode: z
    .enum(["regional", "national"])
    .optional()
    .describe(
      "Portée du Pokédex : regional = pokédex du jeu, national = toutes les générations jusqu'à ce jeu.",
    ),
});

function describeFilters(filters: ChatFilters): string {
  return [
    `recherche="${filters.search || "(vide)"}"`,
    `état=${CAPTURE_LABELS[filters.capture]}`,
    `pokédex=${filters.mode === "regional" ? "régional" : "national"}`,
  ].join(", ");
}

function contentToText(content: unknown): string {
  if (typeof content === "string") {
    return content.trim();
  }

  if (!Array.isArray(content)) {
    return "";
  }

  return content
    .map((part) => {
      if (typeof part === "string") {
        return part;
      }

      if (
        part &&
        typeof part === "object" &&
        "text" in part &&
        typeof part.text === "string"
      ) {
        return part.text;
      }

      return "";
    })
    .join("")
    .trim();
}

/**
 * Exécute l'agent LangChain chargé de piloter les filtres du tableau.
 * Les changements demandés sont accumulés par l'outil `apply_filters`
 * puis renvoyés au client sous forme de patch.
 */
export async function runChatAgent(
  messages: Pick<ChatMessage, "role" | "content">[],
  filters: ChatFilters,
  trace: LangfuseTraceContext,
): Promise<ChatResponse> {
  const patch: ChatFilterPatch = {};

  const llm = new ChatOpenAI({
    model: process.env.AI_MODEL_NAME ?? "deepseek-v4.1-flash",
    apiKey: process.env.AI_API_KEY,
    configuration: {
      baseURL:
        process.env.AI_PROVIDER_URL ??
        "https://opencode.ai/inference/go/openai/v1",
      defaultHeaders: {
        "User-Agent": "pkmn-cloud/0.1",
        "x-opencode-session": trace.sessionId,
      },
    },
  });

  const applyFilters = tool(
    async (input) => {
      if (input.search !== undefined) {
        patch.search = input.search.trim();
      }

      if (input.capture !== undefined) {
        patch.capture = input.capture;
      }

      if (input.mode !== undefined) {
        patch.mode = input.mode;
      }

      return "Filtres appliqués au tableau.";
    },
    {
      name: "apply_filters",
      description:
        "Applique des filtres au tableau de la checklist. N'appelle cet outil que lorsque l'utilisateur demande explicitement de filtrer, rechercher ou changer la portée du Pokédex.",
      schema: filterPatchSchema,
    },
  );

  const agent = createAgent({
    model: llm,
    tools: [applyFilters],
    systemPrompt: [
      "Tu es l'assistant Pokémon de l'application.",
      "Tu peux uniquement agir sur les filtres du tableau via l'outil apply_filters.",
      `Filtres actuels : ${describeFilters(filters)}.`,
      "Quand l'utilisateur demande de filtrer, rechercher, afficher une catégorie ou changer de Pokédex, appelle apply_filters avec seulement les champs à modifier.",
      "Utilise une chaîne vide pour search afin d'effacer la recherche.",
      "Si la demande est ambiguë, pose une question de précision sans appeler l'outil.",
      "Tu ne connais pas les données Pokémon de l'application : ne les invente pas.",
      "Réponds en français, de façon concise, en deux phrases maximum.",
    ].join("\n"),
  });

  const result = await agent.invoke(
    {
      messages: messages.map(({ role, content }) => ({ role, content })),
    },
    {
      callbacks: getLangfuseCallbacks(trace),
      runName: "chat-agent",
      tags: ["chat"],
    },
  );

  const reply = contentToText(result.messages.at(-1)?.content);

  return {
    reply:
      reply ||
      (Object.keys(patch).length > 0
        ? "C'est fait, j'ai mis à jour les filtres du tableau."
        : "Je n'ai pas de réponse à vous donner pour le moment."),
    filters: patch,
  };
}
