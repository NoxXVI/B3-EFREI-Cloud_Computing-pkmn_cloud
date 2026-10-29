import "server-only";

import { redis } from "@/lib/cache";

const CSV_BASE_URL =
  "https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv";

const FRENCH_LANGUAGE_ID = "5";

const SPECIES_KEY = "names:species:fr";
const AREAS_KEY = "names:areas:fr";
const LOCATIONS_KEY = "names:locations:fr";

export type NameMap = Map<number, string>;

export type FrenchNames = {
  species: NameMap;
  areas: NameMap;
  locations: NameMap;
};

export async function getFrenchNames(): Promise<FrenchNames> {
  const [species, areas, locations] = await Promise.all([
    getSpeciesNames(),
    getAreaNames(),
    getLocationNames(),
  ]);

  return { species, areas, locations };
}

export function getSpeciesNames(): Promise<NameMap> {
  return load(SPECIES_KEY, "pokemon_species_names.csv");
}

export function getAreaNames(): Promise<NameMap> {
  return load(AREAS_KEY, "location_area_prose.csv");
}

export function getLocationNames(): Promise<NameMap> {
  return load(LOCATIONS_KEY, "location_names.csv");
}

const inMemory = new Map<string, Promise<NameMap>>();

function load(cacheKey: string, file: string): Promise<NameMap> {
  const pending = inMemory.get(cacheKey);

  if (pending) {
    return pending;
  }

  const promise = fetchNames(cacheKey, file);
  inMemory.set(cacheKey, promise);

  return promise;
}

async function fetchNames(cacheKey: string, file: string): Promise<NameMap> {
  const cached = await redis.get<Record<string, string>>(cacheKey);

  if (cached) {
    return toMap(cached);
  }

  const response = await fetch(`${CSV_BASE_URL}/${file}`);

  if (!response.ok) {
    throw new Error(`CSV des noms introuvable : ${file}`);
  }

  const names = parseFrenchColumn(await response.text());

  await redis.set(cacheKey, Object.fromEntries(names));

  return names;
}

function toMap(record: Record<string, string>): NameMap {
  return new Map(
    Object.entries(record).map(([id, name]) => [Number(id), name]),
  );
}

function parseFrenchColumn(csv: string): NameMap {
  const names: NameMap = new Map();

  for (const line of csv.split("\n").slice(1)) {
    const cells = line.split(",");

    if (cells.length < 3 || cells[1] !== FRENCH_LANGUAGE_ID) {
      continue;
    }

    const id = Number(cells[0]);
    const name = cells[2].trim();

    if (Number.isInteger(id) && name) {
      names.set(id, name);
    }
  }

  return names;
}
