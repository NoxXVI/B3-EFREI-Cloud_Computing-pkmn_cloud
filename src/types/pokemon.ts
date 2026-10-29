export type PkmnGeneration = {
  id: number;
  name: string;
  pokeApiIdString: string;
  pokedexUrl: string;
  nationalMax: number;
};

export type PkmnGame = {
  name: string;
  pokeApiId: number;
  pokeApiIdString: string;
  generation: number;
  region: string;
  pokedexUrl: string;
};

export type PokedexMode = "regional" | "national";

export type PokedexEntry = {
  number: number;
  id: number;
  name: string;
};

export type Pokedex = {
  slug: string;
  entries: PokedexEntry[];
};

export type PokemonEncounter = {
  version: string;
  zone: string;
  method: string;
  chance: number;
  minLevel: number;
  maxLevel: number;
  conditions: string[];
};

export type EvolutionCondition = {
  trigger: string;
  level?: number;
  item?: string;
  heldItem?: string;
  happiness?: number;
  beauty?: number;
  affection?: number;
  timeOfDay?: string;
  location?: string;
  move?: string;
  moveType?: string;
  gender?: number;
  tradeFor?: string;
  nearSpecialRock?: boolean;
  rain?: boolean;
  upsideDown?: boolean;
};

export type EvolutionStep = {
  depth: number;
  id: number;
  name: string;
  conditions: EvolutionCondition[];
};

export type PokedexText = {
  text: string;
  version: string;
  versionName: string;
  language: "fr" | "en";
};

export type PokemonProfile = {
  id: number;
  name: string;
  types: string[];
  stats: { name: string; value: number }[];
  abilities: { name: string; hidden: boolean }[];
  height: number;
  weight: number;
  artwork: string | null;
  sprite: string | null;
  genus: string | null;
  captureRate: number;
  habitat: string | null;
  growthRate: string | null;
  eggGroups: string[];
  genderRate: number;
  isLegendary: boolean;
  isMythical: boolean;
  isBaby: boolean;
  evolvesFrom: string | null;
  evolution: EvolutionStep[];
};

export type PokemonDetailCache = PokemonProfile & {
  encounters: PokemonEncounter[];
  texts: Record<string, { fr?: string; en?: string }>;
};

export type PokemonDetail = PokemonProfile & {
  encounters: PokemonEncounter[];
  game: string;
  otherGames: { slug: string; name: string }[];
  flavorText: PokedexText | null;
};
