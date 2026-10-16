import "server-only";

import { redis } from "@/lib/cache";
import { createClientServer } from "@/lib/supabase/server";
import type { Checklist, ChecklistPokemon } from "@/types/checklist";

const COLONNES = "id, name, game_key, revision, created_at, updated_at";
const COLONNES_POKEMON = "checklist_id, pokemon_api_id, is_captured, updated_at";
const DUREE_CACHE_SECONDES = 60;

const cleCache = (userId: string) => `checklists:${userId}`;
const cleCacheChecklist = (userId: string, checklistId: string) =>
  `checklist:${userId}:${checklistId}`;
const cleCachePokemon = (userId: string, checklistId: string) =>
  `checklist-pokemon:${userId}:${checklistId}`;

/**
 * Checklists de l'utilisateur connecté, avec cache Upstash.
 *
 * Aucun filtre `user_id` en SQL : la session porte l'utilisateur et RLS
 * restreint déjà les lignes. `user.id` ne sert que de clé de cache.
 */
export async function getChecklists(): Promise<Checklist[]> {
  const supabase = await createClientServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const cle = cleCache(user.id);
  const enCache = await redis.get<Checklist[]>(cle);

  if (enCache) {
    return enCache;
  }

  const { data, error } = await supabase
    .from("checklists")
    .select(COLONNES)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const checklists = data ?? [];
  await redis.set(cle, checklists, { ex: DUREE_CACHE_SECONDES });

  return checklists;
}

/**
 * Crée une checklist pour l'utilisateur connecté.
 *
 * `user_id` n'est pas fourni : la colonne a un défaut `auth.uid()` en base.
 * Renvoie `null` si personne n'est connecté.
 */
export async function createChecklist(entree: {
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
    .insert({ name: entree.name, game_key: entree.gameKey })
    .select(COLONNES)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  await redis.del(cleCache(user.id));

  return data;
}

/**
 * Une checklist de l'utilisateur connecté, par son `id`, avec cache Upstash.
 *
 * Là encore aucun filtre `user_id` : RLS ne renvoie la ligne que si elle
 * appartient à l'utilisateur. Renvoie `null` sinon (ou si non connecté).
 *
 * La clé est scopée par utilisateur pour la même raison que dans
 * `getChecklistPokemon` : un id deviné ne doit pas ressortir du cache la ligne
 * de quelqu'un d'autre. Rien n'est mis en cache quand la ligne n'existe pas.
 */
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

  const cle = cleCacheChecklist(user.id, checklistId);
  const enCache = await redis.get<Checklist>(cle);

  if (enCache) {
    return enCache;
  }

  const { data } = await supabase
    .from("checklists")
    .select(COLONNES)
    .eq("id", checklistId)
    .maybeSingle();

  if (data) {
    await redis.set(cle, data, { ex: DUREE_CACHE_SECONDES });
  }

  return data;
}

/**
 * Pokémon d'une checklist de l'utilisateur connecté, avec cache Upstash.
 *
 * La clé de cache est scopée par utilisateur : elle ne peut pas ressortir les
 * lignes de quelqu'un d'autre si son id de checklist est deviné. Comme
 * ailleurs, aucun filtre `user_id` en SQL : RLS s'en charge.
 */
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

  const cle = cleCachePokemon(user.id, checklistId);
  const enCache = await redis.get<ChecklistPokemon[]>(cle);

  if (enCache) {
    return enCache;
  }

  const { data, error } = await supabase
    .from("checklist_pokemon")
    .select(COLONNES_POKEMON)
    .eq("checklist_id", checklistId)
    .order("pokemon_api_id", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const pokemon = data ?? [];
  await redis.set(cle, pokemon, { ex: DUREE_CACHE_SECONDES });

  return pokemon;
}
