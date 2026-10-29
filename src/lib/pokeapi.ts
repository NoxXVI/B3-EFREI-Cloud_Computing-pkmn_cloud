import "server-only";

import { generations } from "@/data/generations";
import { redis } from "@/lib/cache";
import { getSpeciesNames, type NameMap } from "@/lib/names-fr";
import type {
  PokedexMode,
  PkmnGame,
  Pokedex,
  PokedexEntry,
} from "@/types/pokemon";

const CACHE_DURATION_SECONDS = 7 * 24 * 60 * 60;

const CACHE_SCHEMA_VERSION = 2;

const NATIONAL_POKEDEX_URL = "https://pokeapi.co/api/v2/pokedex/national/";

export async function getPokedex(
  game: PkmnGame,
  mode: PokedexMode = "regional",
): Promise<Pokedex> {
  const dexUrl = mode === "national" ? NATIONAL_POKEDEX_URL : game.pokedexUrl;
  const slug = pokedexSlug(dexUrl);
  const cacheKey = `pokedex:v${CACHE_SCHEMA_VERSION}:${slug}`;

  const cached = await redis.get<Pokedex>(cacheKey);
  const pokedex = cached ?? (await fetchPokedex(cacheKey, dexUrl, slug));

  return mode === "national"
    ? trimToGeneration(pokedex, game.generation)
    : pokedex;
}

async function fetchPokedex(
  cacheKey: string,
  url: string,
  slug: string,
): Promise<Pokedex> {
  const [response, speciesNames] = await Promise.all([
    fetch(url),
    getSpeciesNames(),
  ]);

  if (!response.ok) {
    throw new Error("Erreur lors du chargement du Pokédex");
  }

  const pokedex = normalizePokedex(slug, await response.json(), speciesNames);

  await redis.set(cacheKey, pokedex, { ex: CACHE_DURATION_SECONDS });

  return pokedex;
}

function trimToGeneration(pokedex: Pokedex, generation: number): Pokedex {
  const bound = generations.find((item) => item.id === generation)?.nationalMax;

  if (bound === undefined) {
    throw new Error(`Génération inconnue : ${generation}`);
  }

  return {
    slug: pokedex.slug,
    entries: pokedex.entries.filter((entry) => entry.id <= bound),
  };
}

function pokedexSlug(pokedexUrl: string) {
  return pokedexUrl.replace(/\/+$/, "").split("/").pop() ?? "";
}

type PokedexResponse = {
  pokemon_entries?: {
    entry_number: number;
    pokemon_species: { name: string; url: string };
  }[];
};

function normalizePokedex(
  slug: string,
  raw: PokedexResponse,
  speciesNames: NameMap,
): Pokedex {
  const entries: PokedexEntry[] = [];

  for (const entry of raw.pokemon_entries ?? []) {
    const id = nationalId(entry.pokemon_species.url);

    if (id !== null) {
      entries.push({
        number: entry.entry_number,
        id,
        name: speciesNames.get(id) ?? entry.pokemon_species.name,
      });
    }
  }

  return { slug, entries: entries.sort((a, b) => a.number - b.number) };
}

export function nationalId(url: string): number | null {
  const id = Number(url.replace(/\/+$/, "").split("/").pop());

  return Number.isInteger(id) && id > 0 ? id : null;
}
