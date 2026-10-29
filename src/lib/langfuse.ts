import "server-only";

import { CallbackHandler } from "@langfuse/langchain";

export type LangfuseTraceContext = {
  sessionId: string;
  userId?: string;
};

/**
 * Indique si les variables d'environnement nécessaires à Langfuse
 * sont présentes. Permet d'éviter les appels inutiles (ex. lecture de
 * l'utilisateur Supabase) quand l'observabilité est désactivée.
 */
export function isLangfuseEnabled(): boolean {
  return Boolean(
    process.env.LANGFUSE_PUBLIC_KEY &&
    process.env.LANGFUSE_SECRET_KEY &&
    process.env.LANGFUSE_BASE_URL,
  );
}

type LangfuseProcessor = {
  forceFlush(): Promise<void>;
};

type OtelGlobal = typeof globalThis & {
  __pkmnLangfuseSpanProcessor?: LangfuseProcessor;
};

/**
 * Force l'envoi des spans en attente. Utile en environnement serverless où
 * le processus peut être gelé juste après la réponse HTTP.
 */
export async function flushLangfuse(): Promise<void> {
  const processor = (globalThis as OtelGlobal).__pkmnLangfuseSpanProcessor;

  if (!processor) {
    return;
  }

  try {
    await processor.forceFlush();
  } catch (error) {
    console.error(
      "Envoi des traces Langfuse impossible :",
      error instanceof Error ? error.message : error,
    );
  }
}

/**
 * Crée les callbacks Langfuse à attacher à une invocation LangChain.
 * Retourne un tableau vide si Langfuse n'est pas configuré : l'assistant
 * continue de fonctionner sans observabilité.
 *
 * Le handler est créé par requête afin de ne pas mélanger les attributs
 * (session, utilisateur) entre deux appels concurrents.
 */
export function getLangfuseCallbacks({
  sessionId,
  userId,
}: LangfuseTraceContext): CallbackHandler[] {
  if (!isLangfuseEnabled()) {
    return [];
  }

  try {
    return [
      new CallbackHandler({
        sessionId,
        userId,
        tags: ["chat", "pokedex-filters"],
        traceMetadata: {
          feature: "chat-filters",
        },
      }),
    ];
  } catch (error) {
    console.error(
      "Initialisation de Langfuse impossible :",
      error instanceof Error ? error.message : error,
    );

    return [];
  }
}
