import type { PkmnGeneration } from "../types/pokemon";

export const generations: PkmnGeneration[] = [
  {
    id: 1,
    name: "Première génération",
    pokeApiIdString: "generation-i",
    pokedexUrl: "https://pokeapi.co/api/v2/pokedex/kanto/",
    nationalMax: 151,
  },
  {
    id: 2,
    name: "Deuxième génération",
    pokeApiIdString: "generation-ii",
    pokedexUrl: "https://pokeapi.co/api/v2/pokedex/updated-johto/",
    nationalMax: 251,
  },
  {
    id: 3,
    name: "Troisième génération",
    pokeApiIdString: "generation-iii",
    pokedexUrl: "https://pokeapi.co/api/v2/pokedex/hoenn/",
    nationalMax: 386,
  },
  {
    id: 4,
    name: "Quatrième génération",
    pokeApiIdString: "generation-iv",
    pokedexUrl: "https://pokeapi.co/api/v2/pokedex/extended-sinnoh/",
    nationalMax: 493,
  },
  {
    id: 5,
    name: "Cinquième génération",
    pokeApiIdString: "generation-v",
    pokedexUrl: "https://pokeapi.co/api/v2/pokedex/updated-unova/",
    nationalMax: 649,
  },
  {
    id: 6,
    name: "Sixième génération",
    pokeApiIdString: "generation-vi",
    pokedexUrl: "https://pokeapi.co/api/v2/pokedex/kalos-central/",
    nationalMax: 721,
  },
  {
    id: 7,
    name: "Septième génération",
    pokeApiIdString: "generation-vii",
    pokedexUrl: "https://pokeapi.co/api/v2/pokedex/alola/",
    nationalMax: 809,
  },
  {
    id: 8,
    name: "Huitième génération",
    pokeApiIdString: "generation-viii",
    pokedexUrl: "https://pokeapi.co/api/v2/pokedex/galar/",
    nationalMax: 905,
  },
  {
    id: 9,
    name: "Neuvième génération",
    pokeApiIdString: "generation-ix",
    pokedexUrl: "https://pokeapi.co/api/v2/pokedex/paldea/",
    nationalMax: 1025,
  },
];
