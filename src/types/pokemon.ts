

export type PkmnGeneration = {
    id: number,
    name: string,
    pokeApiIdString: string,
    pokedexUrl: string,
}

export type PkmnGame = {
    name: string,
    pokeApiId: number,
    pokeApiIdString: string,
    generation: number,
    region: string,
    pokedexUrl: string,
} 