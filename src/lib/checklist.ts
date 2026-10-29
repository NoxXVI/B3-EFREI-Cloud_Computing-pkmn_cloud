import "server-only";

import { redis } from "@/lib/cache";
import { createClientServer } from "@/lib/supabase/server";
import type { Checklist, ChecklistPokemon } from "@/types/checklist";

const COLUMNS = "id, name, game_key, revision, created_at, updated_at";
const POKEMON_COLUMNS = "checklist_id, pokemon_api_id, is_captured, updated_at";
const CACHE_DURATION_SECONDS = 60;

const checklistsCacheKey = (userId: string) => `checklists:${userId}`;
const checklistCacheKey = (userId: string, checklistId: string) =>
  `checklist:${userId}:${checklistId}`;
const checklistPokemonCacheKey = (userId: string, checklistId: string) =>
  `checklist-pokemon:${userId}:${checklistId}`;

export async function getChecklists(): Promise<Checklist[]> {
  const supabase = await createClientServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const cacheKey = checklistsCacheKey(user.id);
  const cached = await redis.get<Checklist[]>(cacheKey);

  if (cached) {
    return cached;
  }

  const { data, error } = await supabase
    .from("checklists")
    .select(COLUMNS)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const checklists = data ?? [];
  await redis.set(cacheKey, checklists, { ex: CACHE_DURATION_SECONDS });

  return checklists;
}

export async function createChecklist(input: {
  name: string;
  gameKey: string;
}): Promise<Checklist | null> {
  const supabase = await createClientServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("checklists")
    .insert({ name: input.name, game_key: input.gameKey })
    .select(COLUMNS)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  await redis.del(checklistsCacheKey(user.id));

  return data;
}

export async function getChecklistById(
  checklistId: string,
): Promise<Checklist | null> {
  const supabase = await createClientServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const cacheKey = checklistCacheKey(user.id, checklistId);
  const cached = await redis.get<Checklist>(cacheKey);

  if (cached) {
    return cached;
  }

  const { data } = await supabase
    .from("checklists")
    .select(COLUMNS)
    .eq("id", checklistId)
    .maybeSingle();

  if (data) {
    await redis.set(cacheKey, data, { ex: CACHE_DURATION_SECONDS });
  }

  return data;
}

export async function getChecklistPokemon(
  checklistId: string,
): Promise<ChecklistPokemon[]> {
  const supabase = await createClientServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const cacheKey = checklistPokemonCacheKey(user.id, checklistId);
  const cached = await redis.get<ChecklistPokemon[]>(cacheKey);

  if (cached) {
    return cached;
  }

  const { data, error } = await supabase
    .from("checklist_pokemon")
    .select(POKEMON_COLUMNS)
    .eq("checklist_id", checklistId)
    .order("pokemon_api_id", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const pokemon = data ?? [];
  await redis.set(cacheKey, pokemon, { ex: CACHE_DURATION_SECONDS });

  return pokemon;
}

export async function saveChecklistPokemon(
  checklistId: string,
  rows: { pokemonApiId: number; isCaptured: boolean }[],
): Promise<ChecklistPokemon[] | null> {
  const supabase = await createClientServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const now = new Date().toISOString();

  const { error } = await supabase.from("checklist_pokemon").upsert(
    rows.map((row) => ({
      checklist_id: checklistId,
      pokemon_api_id: row.pokemonApiId,
      is_captured: row.isCaptured,
      updated_at: now,
    })),
    { onConflict: "checklist_id,pokemon_api_id" },
  );

  if (error) {
    throw new Error(error.message);
  }

  await supabase
    .from("checklists")
    .update({ updated_at: now })
    .eq("id", checklistId);

  await redis.del(checklistPokemonCacheKey(user.id, checklistId));
  await redis.del(checklistCacheKey(user.id, checklistId));
  await redis.del(checklistsCacheKey(user.id));

  return getChecklistPokemon(checklistId);
}
