import type { PokedexMode } from "@/types/pokemon";

export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
};

export type CaptureFilter = "all" | "captured" | "uncaptured" | "absent";

export type ChatFilters = {
  search: string;
  capture: CaptureFilter;
  mode: PokedexMode;
};

export type ChatFilterPatch = Partial<ChatFilters>;

export type ChatRequest = {
  messages: Pick<ChatMessage, "role" | "content">[];
  filters: ChatFilters;
};

export type ChatResponse = {
  reply: string;
  filters: ChatFilterPatch;
};
