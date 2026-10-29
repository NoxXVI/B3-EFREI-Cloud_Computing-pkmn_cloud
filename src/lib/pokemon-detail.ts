import "server-only";

import { games } from "@/data/games";
import { redis } from "@/lib/cache";
import { getFrenchNames, type FrenchNames, type NameMap } from "@/lib/names-fr";
import { nationalId } from "@/lib/pokeapi";
import type {
  EvolutionCondition,
  EvolutionStep,
  PkmnGame,
  PokemonDetail,
  PokemonDetailCache,
  PokemonEncounter,
  PokedexText,
} from "@/types/pokemon";

const CACHE_DURATION_SECONDS = 7 * 24 * 60 * 60;
const POKEAPI_BASE_URL = "https://pokeapi.co/api/v2";

const CACHE_SCHEMA_VERSION = 3;

class PokemonNotFoundError extends Error {}

export async function getPokemonDetail(
  pokemonApiId: number,
  game: PkmnGame,
): Promise<PokemonDetail | null> {
  const cacheKey = `pokemon:v${CACHE_SCHEMA_VERSION}:${pokemonApiId}`;
  const cached = await redis.get<PokemonDetailCache>(cacheKey);

  let full = cached;

  if (!full) {
    try {
      full = await fetchDetail(cacheKey, pokemonApiId);
    } catch (error) {
      if (error instanceof PokemonNotFoundError) {
        return null;
      }

      throw error;
    }
  }

  return viewForGame(full, game);
}

async function fetchDetail(
  cacheKey: string,
  id: number,
): Promise<PokemonDetailCache> {
  const [pokemon, species, encounters, names] = await Promise.all([
    fetchJson<PokemonResponse>(`${POKEAPI_BASE_URL}/pokemon/${id}`),
    fetchJson<SpeciesResponse>(`${POKEAPI_BASE_URL}/pokemon-species/${id}`),
    fetchJson<EncounterResponse[]>(
      `${POKEAPI_BASE_URL}/pokemon/${id}/encounters`,
    ),
    getFrenchNames(),
  ]);

  const chain = species.evolution_chain
    ? await fetchJson<ChainResponse>(species.evolution_chain.url)
    : null;

  const detail = normalizeDetail(
    id,
    pokemon,
    species,
    encounters,
    chain,
    names,
  );

  await redis.set(cacheKey, detail, { ex: CACHE_DURATION_SECONDS });

  return detail;
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);

  if (response.status === 404) {
    throw new PokemonNotFoundError(url);
  }

  if (!response.ok) {
    throw new Error(`PokeAPI ${response.status} sur ${url}`);
  }

  return (await response.json()) as T;
}

function viewForGame(full: PokemonDetailCache, game: PkmnGame): PokemonDetail {
  const { encounters, texts, ...profile } = full;
  const version = game.pokeApiIdString;

  const otherGames = games
    .filter((candidate) => candidate.generation === game.generation)
    .filter(
      (candidate) =>
        candidate.pokeApiIdString !== version &&
        encounters.some((r) => r.version === candidate.pokeApiIdString),
    )
    .map((candidate) => ({
      slug: candidate.pokeApiIdString,
      name: candidate.name,
    }));

  return {
    ...profile,
    encounters: encounters.filter((r) => r.version === version),
    game: game.name,
    otherGames,
    flavorText: resolveText(texts, version),
  };
}

function resolveText(
  texts: Record<string, { fr?: string; en?: string }>,
  version: string,
): PokedexText | null {
  const exact = texts[version];

  if (exact?.fr) {
    return makePokedexText(exact.fr, version, "fr");
  }

  if (exact?.en) {
    return makePokedexText(exact.en, version, "en");
  }

  const versions = Object.keys(texts).reverse();

  for (const language of ["fr", "en"] as const) {
    const found = versions.find((item) => texts[item][language]);

    if (found) {
      const text = texts[found][language];

      if (text) {
        return makePokedexText(text, found, language);
      }
    }
  }

  return null;
}

function makePokedexText(
  text: string,
  version: string,
  language: "fr" | "en",
): PokedexText {
  return {
    text,
    version,
    versionName: versionName(version),
    language,
  };
}

function versionName(slug: string) {
  return games.find((game) => game.pokeApiIdString === slug)?.name ?? slug;
}

type PokemonResponse = {
  name: string;
  height: number;
  weight: number;
  types: { slot: number; type: { name: string } }[];
  stats: { base_stat: number; stat: { name: string } }[];
  abilities: { is_hidden: boolean; ability: { name: string } }[];
  sprites: {
    front_default: string | null;
    other?: { "official-artwork"?: { front_default: string | null } };
  };
};

type SpeciesResponse = {
  genera: { genus: string; language: { name: string } }[];
  capture_rate: number;
  habitat: { name: string } | null;
  growth_rate: { name: string } | null;
  egg_groups: { name: string }[];
  gender_rate: number;
  is_legendary: boolean;
  is_mythical: boolean;
  is_baby: boolean;
  evolves_from_species: { name: string; url: string } | null;
  evolution_chain: { url: string } | null;
  flavor_text_entries: {
    flavor_text: string;
    language: { name: string };
    version: { name: string };
  }[];
};

type EncounterResponse = {
  location_area: { name: string; url: string };
  version_details: {
    version: { name: string };
    encounter_details: {
      min_level: number;
      max_level: number;
      chance: number;
      method: { name: string };
      condition_values: { name: string }[];
    }[];
  }[];
};

type ConditionResponse = {
  trigger: { name: string } | null;
  min_level: number | null;
  item: { name: string } | null;
  held_item: { name: string } | null;
  min_happiness: number | null;
  min_beauty: number | null;
  min_affection: number | null;
  time_of_day: string | null;
  location: { name: string; url: string } | null;
  known_move: { name: string } | null;
  known_move_type: { name: string } | null;
  gender: number | null;
  trade_species: { name: string; url: string } | null;
  near_special_rock: boolean;
  needs_overworld_rain: boolean;
  turn_upside_down: boolean;
};

type ChainLink = {
  species: { name: string; url: string };
  evolution_details: ConditionResponse[];
  evolves_to: ChainLink[];
};

type ChainResponse = {
  chain: ChainLink;
};

function normalizeDetail(
  id: number,
  pokemon: PokemonResponse,
  species: SpeciesResponse,
  encounters: EncounterResponse[],
  chain: ChainResponse | null,
  names: FrenchNames,
): PokemonDetailCache {
  return {
    id,
    name: names.species.get(id) ?? pokemon.name,
    types: [...pokemon.types]
      .sort((a, b) => a.slot - b.slot)
      .map((type) => type.type.name),
    stats: pokemon.stats.map((stat) => ({
      name: stat.stat.name,
      value: stat.base_stat,
    })),
    abilities: pokemon.abilities.map((ability) => ({
      name: ability.ability.name,
      hidden: ability.is_hidden,
    })),
    height: pokemon.height,
    weight: pokemon.weight,
    artwork: pokemon.sprites.other?.["official-artwork"]?.front_default ?? null,
    sprite: pokemon.sprites.front_default ?? null,
    genus:
      species.genera.find((entry) => entry.language.name === "fr")?.genus ??
      null,
    captureRate: species.capture_rate,
    habitat: species.habitat?.name ?? null,
    growthRate: species.growth_rate?.name ?? null,
    eggGroups: species.egg_groups.map((group) => group.name),
    genderRate: species.gender_rate,
    isLegendary: species.is_legendary,
    isMythical: species.is_mythical,
    isBaby: species.is_baby,
    evolvesFrom:
      optionalFrenchLabel(names.species, species.evolves_from_species) ?? null,
    evolution: chain ? flattenChain(chain.chain, names) : [],
    encounters: flattenEncounters(encounters, names.areas),
    texts: normalizeTexts(species.flavor_text_entries),
  };
}

function frenchLabel(
  names: NameMap,
  resource: { name: string; url: string },
): string {
  const id = nationalId(resource.url);

  return (id !== null ? names.get(id) : undefined) ?? resource.name;
}

function optionalFrenchLabel(
  names: NameMap,
  resource: { name: string; url: string } | null,
): string | undefined {
  return resource ? frenchLabel(names, resource) : undefined;
}

function flattenEncounters(
  encounters: EncounterResponse[],
  areaNames: NameMap,
): PokemonEncounter[] {
  const rows: PokemonEncounter[] = [];

  for (const zone of encounters) {
    for (const details of zone.version_details) {
      for (const detail of details.encounter_details) {
        rows.push({
          version: details.version.name,
          zone: frenchLabel(areaNames, zone.location_area),
          method: detail.method.name,
          chance: detail.chance,
          minLevel: detail.min_level,
          maxLevel: detail.max_level,
          conditions: detail.condition_values.map(
            (condition) => condition.name,
          ),
        });
      }
    }
  }

  return rows;
}

function normalizeTexts(
  entries: SpeciesResponse["flavor_text_entries"],
): Record<string, { fr?: string; en?: string }> {
  const texts: Record<string, { fr?: string; en?: string }> = {};

  for (const entry of entries) {
    const language = entry.language.name;

    if (language !== "fr" && language !== "en") {
      continue;
    }

    const version = entry.version.name;

    texts[version] ??= {};
    texts[version][language] = cleanText(entry.flavor_text);
  }

  return texts;
}

function cleanText(text: string) {
  return text
    .replace(/[\n\r\f\u00ad]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function flattenChain(root: ChainLink, names: FrenchNames): EvolutionStep[] {
  const steps: EvolutionStep[] = [];

  const walk = (link: ChainLink, depth: number) => {
    const id = nationalId(link.species.url);

    if (id !== null) {
      steps.push({
        depth,
        id,
        name: frenchLabel(names.species, link.species),
        conditions: link.evolution_details.map((condition) =>
          describeCondition(condition, names),
        ),
      });
    }

    for (const next of link.evolves_to) {
      walk(next, depth + 1);
    }
  };

  walk(root, 0);

  return steps;
}

function describeCondition(
  raw: ConditionResponse,
  names: FrenchNames,
): EvolutionCondition {
  return {
    trigger: raw.trigger?.name ?? "other",
    level: raw.min_level ?? undefined,
    item: raw.item?.name ?? undefined,
    heldItem: raw.held_item?.name ?? undefined,
    happiness: raw.min_happiness ?? undefined,
    beauty: raw.min_beauty ?? undefined,
    affection: raw.min_affection ?? undefined,
    timeOfDay: raw.time_of_day ?? undefined,
    location: optionalFrenchLabel(names.locations, raw.location),
    move: raw.known_move?.name ?? undefined,
    moveType: raw.known_move_type?.name ?? undefined,
    gender: raw.gender ?? undefined,
    tradeFor: optionalFrenchLabel(names.species, raw.trade_species),
    nearSpecialRock: raw.near_special_rock || undefined,
    rain: raw.needs_overworld_rain || undefined,
    upsideDown: raw.turn_upside_down || undefined,
  };
}
