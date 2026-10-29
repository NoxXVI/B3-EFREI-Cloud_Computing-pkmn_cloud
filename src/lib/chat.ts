import type { ChatMessage, ChatRole } from "@/types/chat";

/**
 * Questions proposées dans l'état vide du tiroir.
 * Elles correspondent aux filtres que l'agent peut piloter.
 */
export const chatSuggestions = [
  "Montre les Pokémon non capturés",
  "Passe le Pokédex en national",
  "Recherche Pikachu",
  "Affiche tous les Pokémon",
] as const;

/** Crée un message avec un identifiant stable côté client. */
export function createChatMessage(
  role: ChatRole,
  content: string,
): ChatMessage {
  return {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${role}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    role,
    content,
  };
}
