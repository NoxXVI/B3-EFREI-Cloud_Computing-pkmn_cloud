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

/**
 * Enregistre les lignes modifiées d'une checklist de l'utilisateur connecté.
 *
 * Un seul `upsert` pour toutes les lignes : `onConflict` s'appuie sur la clé
 * primaire composite `(checklist_id, pokemon_api_id)`. Comme partout ailleurs,
 * aucun filtre `user_id` : RLS décide si l'écriture est permise — c'est aussi
 * elle qui doit vérifier que la checklist appartient bien à l'utilisateur,
 * cette table n'ayant pas de colonne `user_id`.
 *
 * `updated_at` est fourni explicitement : la colonne n'a qu'un `DEFAULT now()`,
 * donc sur un `UPDATE` elle resterait figée s'il n'y a pas de trigger.
 *
 * Renvoie `null` si personne n'est connecté.
 */
export async function saveChecklistPokemon(
  checklistId: string,
  lignes: { pokemonApiId: number; isCaptured: boolean }[],
): Promise<ChecklistPokemon[] | null> {
  const supabase = await createClientServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const maintenant = new Date().toISOString();

  const { error } = await supabase.from("checklist_pokemon").upsert(
    lignes.map((ligne) => ({
      checklist_id: checklistId,
      pokemon_api_id: ligne.pokemonApiId,
      is_captured: ligne.isCaptured,
      updated_at: maintenant,
    })),
    { onConflict: "checklist_id,pokemon_api_id" },
  );

  if (error) {
    throw new Error(error.message);
  }

  // La carte de l'accueil affiche `updated_at` et la liste est triée dessus :
  // sans ce bump, les deux mentent après une édition Pokémon. Best effort : si
  // RLS interdit l'UPDATE sur `checklists`, la date ne bouge pas mais l'édition
  // des Pokémon reste enregistrée.
  await supabase
    .from("checklists")
    .update({ updated_at: maintenant })
    .eq("id", checklistId);

  await redis.del(cleCachePokemon(user.id, checklistId));
  await redis.del(cleCacheChecklist(user.id, checklistId));
  await redis.del(cleCache(user.id));

  // Relecture fraîche : la purge ci-dessus force la requête SQL.
  return getChecklistPokemon(checklistId);
}

