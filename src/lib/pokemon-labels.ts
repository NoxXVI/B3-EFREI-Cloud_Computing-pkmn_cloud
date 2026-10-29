import type { EvolutionCondition, PokemonDetail } from "@/types/pokemon";

export type LabelTable = Record<string, string>;

export function spriteUrl(pokemonApiId: number) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonApiId}.png`;
}

export function prettySlug(slug: string) {
  const words = slug.replace(/-/g, " ");

  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function label(table: LabelTable, slug: string) {
  return table[slug] ?? prettySlug(slug);
}

export const TYPE_LABELS: LabelTable = {
  normal: "Normal",
  fire: "Feu",
  water: "Eau",
  electric: "Électrik",
  grass: "Plante",
  ice: "Glace",
  fighting: "Combat",
  poison: "Poison",
  ground: "Sol",
  flying: "Vol",
  psychic: "Psy",
  bug: "Insecte",
  rock: "Roche",
  ghost: "Spectre",
  dragon: "Dragon",
  dark: "Ténèbres",
  steel: "Acier",
  fairy: "Fée",
};

export const TYPE_COLORS: Record<string, string> = {
  normal: "bg-stone-400 text-white",
  fire: "bg-orange-500 text-white",
  water: "bg-blue-500 text-white",
  electric: "bg-amber-400 text-black",
  grass: "bg-green-600 text-white",
  ice: "bg-cyan-300 text-black",
  fighting: "bg-red-700 text-white",
  poison: "bg-purple-600 text-white",
  ground: "bg-yellow-700 text-white",
  flying: "bg-indigo-300 text-black",
  psychic: "bg-pink-500 text-white",
  bug: "bg-lime-600 text-black",
  rock: "bg-yellow-800 text-white",
  ghost: "bg-violet-700 text-white",
  dragon: "bg-indigo-700 text-white",
  dark: "bg-neutral-800 text-white",
  steel: "bg-slate-500 text-white",
  fairy: "bg-pink-300 text-black",
};

export function typeLabel(slug: string) {
  return label(TYPE_LABELS, slug);
}

export function typeColor(slug: string) {
  return TYPE_COLORS[slug] ?? "bg-muted text-muted-foreground";
}

export const STAT_LABELS: LabelTable = {
  hp: "PV",
  attack: "Attaque",
  defense: "Défense",
  "special-attack": "Attaque Spé.",
  "special-defense": "Défense Spé.",
  speed: "Vitesse",
};

export const HABITAT_LABELS: LabelTable = {
  cave: "Grottes",
  forest: "Forêts",
  grassland: "Prairies",
  mountain: "Montagnes",
  rare: "Rare",
  "rough-terrain": "Terrains accidentés",
  sea: "Mer",
  urban: "Villes",
  "waters-edge": "Bords de l'eau",
};

export const EGG_GROUP_LABELS: LabelTable = {
  monster: "Monstrueux",
  water1: "Aquatique 1",
  water2: "Aquatique 2",
  water3: "Aquatique 3",
  bug: "Insecte",
  flying: "Aérien",
  ground: "Terrestre",
  fairy: "Féerique",
  plant: "Végétal",
  humanshape: "Humanoïde",
  mineral: "Minéral",
  indeterminate: "Amorphe",
  ditto: "Métamorph",
  dragon: "Draconique",
  "no-eggs": "Non reproductible",
};

export const GROWTH_LABELS: LabelTable = {
  slow: "Lente",
  medium: "Moyenne",
  fast: "Rapide",
  "medium-slow": "Moyennement lente",
  "slow-then-very-fast": "Lente puis très rapide",
  "fast-then-very-slow": "Rapide puis très lente",
};

export const METHOD_LABELS: LabelTable = {
  walk: "Hautes herbes",
  surf: "Surf",
  "old-rod": "Vieille Canne",
  "good-rod": "Super Canne",
  "super-rod": "Méga Canne",
  "rock-smash": "Éclate-Roc",
  headbutt: "Coup d'Boule",
  fishing: "Pêche",
  gift: "Cadeau",
  "gift-egg": "Œuf offert",
  static: "Statique",
  "only-one": "Unique",
  trade: "Échange",
  honey: "Miel",
  "dark-grass": "Herbes sombres",
  "sos-encounter": "Appel à l'aide",
  interact: "Interaction",
  "devon-scope": "Scope Devon",
  "pokemon-ranger": "Pokémon Ranger",
};

export const CONDITION_LABELS: LabelTable = {
  "time-day": "Jour",
  "time-night": "Nuit",
  "time-morning": "Matin",
  "time-dusk": "Crépuscule",
  "time-day?": "Jour",
  "season-spring": "Printemps",
  "season-summer": "Été",
  "season-autumn": "Automne",
  "season-winter": "Hiver",
  "swarm-yes": "Essaim",
  "radar-on": "Radar allumé",
  "slot2-ruby": "GBA : Rubis",
  "slot2-sapphire": "GBA : Saphir",
  "slot2-emerald": "GBA : Émeraude",
  "slot2-firered": "GBA : Rouge Feu",
  "slot2-leafgreen": "GBA : Vert Feuille",
};

export const TRIGGER_LABELS: LabelTable = {
  "level-up": "Montée de niveau",
  "use-item": "Objet utilisé",
  trade: "Échange",
  shed: "Mue",
  spin: "Rotation",
  "tower-of-darkness": "Tour des Ténèbres",
  "tower-of-waters": "Tour des Eaux",
  "three-critical-hits": "Trois coups critiques",
  "take-damage": "Dégâts subis",
  "agile-style": "Style Agile",
  "strong-style": "Style Puissant",
  other: "Condition spéciale",
};

export const TIME_OF_DAY_LABELS: LabelTable = {
  day: "Jour",
  night: "Nuit",
  dusk: "Crépuscule",
};

export const ITEM_LABELS: LabelTable = {
  "fire-stone": "Pierre Feu",
  "water-stone": "Pierre Eau",
  "thunder-stone": "Pierre Foudre",
  "leaf-stone": "Pierre Plante",
  "moon-stone": "Pierre Lune",
  "sun-stone": "Pierre Soleil",
  "shiny-stone": "Pierre Éclat",
  "dusk-stone": "Pierre Nuit",
  "dawn-stone": "Pierre Aube",
  "ice-stone": "Pierre Glace",
  "oval-stone": "Pierre Ovale",
  "king-s-rock": "Roche Royale",
  "metal-coat": "Peau Métal",
  "dragon-scale": "Écaille Draco",
  upgrade: "Améliorator",
  "dubious-disc": "CD Douteux",
  protector: "Protecteur",
  electirizer: "Électriseur",
  magmarizer: "Magmariseur",
  "reaper-cloth": "Tissu Fauche",
  "razor-claw": "Griffe Rasoir",
  "razor-fang": "Croc Rasoir",
  "deep-sea-tooth": "Dent Océan",
  "deep-sea-scale": "Écaille Océan",
  "prism-scale": "Bel'Écaille",
  sachet: "Sachet Senteur",
  "whipped-dream": "Chantilly",
  "sweet-apple": "Pomme Sucrée",
  "tart-apple": "Pomme Acidulée",
  "cracked-pot": "Théière Fêlée",
  "chipped-pot": "Théière Ébréchée",
};

export function methodLabel(slug: string) {
  return label(METHOD_LABELS, slug);
}

export function conditionLabel(slug: string) {
  return label(CONDITION_LABELS, slug);
}

export function itemLabel(slug: string) {
  return label(ITEM_LABELS, slug);
}

export function genderLabel(genderRate: number) {
  if (genderRate === -1) {
    return "Asexué";
  }

  const females = (genderRate / 8) * 100;

  return `${formatFrenchDecimal(females)} % femelle / ${formatFrenchDecimal(100 - females)} % mâle`;
}

function formatFrenchDecimal(value: number) {
  return String(value).replace(".", ",");
}

export function formatHeight(decimetres: number) {
  return `${(decimetres / 10).toFixed(1).replace(".", ",")} m`;
}

export function formatWeight(hectogrammes: number) {
  return `${(hectogrammes / 10).toFixed(1).replace(".", ",")} kg`;
}

export function describeCondition(condition: EvolutionCondition): string[] {
  const parts: string[] = [];

  if (condition.trigger === "use-item" && condition.item) {
    parts.push(itemLabel(condition.item));
  } else if (
    condition.trigger === "level-up" &&
    condition.level !== undefined
  ) {
    parts.push(`Niveau ${condition.level}`);
  } else {
    parts.push(label(TRIGGER_LABELS, condition.trigger));
  }

  if (condition.heldItem) {
    parts.push(`${itemLabel(condition.heldItem)} tenu`);
  }

  if (condition.tradeFor) {
    parts.push(`échangé contre ${condition.tradeFor}`);
  }

  if (condition.happiness !== undefined) {
    parts.push(`Bonheur ${condition.happiness}`);
  }

  if (condition.beauty !== undefined) {
    parts.push(`Beauté ${condition.beauty}`);
  }

  if (condition.affection !== undefined) {
    parts.push(`Affection ${condition.affection}`);
  }

  if (condition.move) {
    parts.push(`Capacité ${condition.move}`);
  }

  if (condition.moveType) {
    parts.push(`Capacité de type ${typeLabel(condition.moveType)}`);
  }

  if (condition.timeOfDay) {
    parts.push(label(TIME_OF_DAY_LABELS, condition.timeOfDay));
  }

  if (condition.location) {
    parts.push(`lieu : ${condition.location}`);
  }

  if (condition.gender !== undefined) {
    parts.push(condition.gender === 1 ? "Femelle" : "Mâle");
  }

  if (condition.nearSpecialRock) {
    parts.push("près d'une roche spéciale");
  }

  if (condition.rain) {
    parts.push("sous la pluie");
  }

  if (condition.upsideDown) {
    parts.push("console retournée");
  }

  return parts;
}

const WILD_METHODS = new Set([
  "walk",
  "surf",
  "old-rod",
  "good-rod",
  "super-rod",
  "rock-smash",
  "headbutt",
  "honey",
  "dark-grass",
  "sos-encounter",
  "fishing",
]);

export function obtainSentence(pokemon: PokemonDetail): string {
  if (pokemon.encounters.length > 0) {
    const details = pokemon.encounters;
    const wild = details.filter((detail) => WILD_METHODS.has(detail.method));
    const withChance = wild.length > 0 ? wild : details;
    const zones = new Set(details.map((detail) => detail.zone)).size;
    const methods = [...new Set(details.map((detail) => detail.method))].map(
      methodLabel,
    );
    const minLevel = Math.min(...details.map((detail) => detail.minLevel));
    const maxLevel = Math.max(...details.map((detail) => detail.maxLevel));
    const chance = Math.max(...withChance.map((detail) => detail.chance));
    const levels =
      minLevel === maxLevel
        ? `niveau ${minLevel}`
        : `niveaux ${minLevel}-${maxLevel}`;
    const entry = wild.length > 0 ? "Sauvage" : "Obtenu";

    return `${entry} dans ${pokemon.game} : ${zones} zone${zones > 1 ? "s" : ""}, ${methods.join(" ou ")}, ${levels}, meilleure chance ${chance} %.`;
  }

  const note = pokemon.isMythical
    ? " Pokémon mythique : dans ces jeux, il s'obtient par distribution événementielle."
    : "";

  if (pokemon.otherGames.length > 0) {
    const gameNames = pokemon.otherGames.map((game) => game.name).join(", ");

    return `Aucune rencontre sauvage dans ${pokemon.game} : dans cette génération, il n'apparaît que dans ${gameNames}.${note}`;
  }

  const evolution = pokemon.evolvesFrom
    ? ` Son évolution de base est ${pokemon.evolvesFrom}.`
    : "";

  return `Aucune rencontre sauvage dans cette génération.${evolution}${note}`;
}
