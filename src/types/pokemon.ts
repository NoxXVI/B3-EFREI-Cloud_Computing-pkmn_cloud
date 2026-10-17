

export type PkmnGeneration = {
    id: number,
    name: string,
    pokeApiIdString: string,
    pokedexUrl: string,
    /**
     * Dernier id national de la génération. PokeAPI décrit chaque génération
     * comme une plage nationale contiguë et figée (gen 1 → 151, gen 5 → 649) :
     * la valeur est vérifiée contre `generation/{id}`, inutile d'aller la
     * chercher en ligne.
     */
    nationalMax: number,
}

export type PkmnGame = {
    name: string,
    pokeApiId: number,
    pokeApiIdString: string,
    generation: number,
    region: string,
    pokedexUrl: string,
}

/**
 * Étendue du Pokédex affiché : celui du jeu, ou le national coupé à la
 * génération de sortie du jeu.
 */
export type ModePokedex = "regional" | "national"

/** Une entrée de Pokédex, réduite à ce qui sert à l'affichage. */
export type PokedexEntry = {
    /**
     * Numéro dans le Pokédex interrogé : numéro régional en mode `regional`,
     * numéro national en mode `national`.
     */
    number: number,
    /** Id national : c'est lui qui relie une entrée à `checklist_pokemon`. */
    id: number,
    /** Nom de l'espèce, tel que fourni par PokeAPI (en minuscules). */
    name: string,
}

/** Réponse `pokedex/{slug}` de PokeAPI, allégée avant mise en cache. */
export type Pokedex = {
    slug: string,
    entries: PokedexEntry[],
}
