import "server-only";

import { redis } from "@/lib/cache";
import { createClientServer } from "@/lib/supabase/server";
import type { Checklist } from "@/types/checklist";

const COLONNES = "id, name, game_key, revision, created_at, updated_at";
const DUREE_CACHE_SECONDES = 60;

const cleCache = (userId: string) => `checklists:${userId}`;

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
