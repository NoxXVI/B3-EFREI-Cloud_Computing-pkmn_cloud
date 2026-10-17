import "server-only";

import { generations } from "@/data/generations";
import { redis } from "@/lib/cache";
import type {
    ModePokedex,
    PkmnGame,
    Pokedex,
    PokedexEntry,
} from "@/types/pokemon";

// Un Pokédex ne bouge pas côté PokeAPI : on peut cacher longtemps.
const DUREE_CACHE_SECONDES = 7 * 24 * 60 * 60;

/** Le Pokédex national, toutes générations confondues (1025 entrées). */
const URL_POKEDEX_NATIONAL = "https://pokeapi.co/api/v2/pokedex/national/";

/**
 * Pokédex d'un jeu, allégé et mis en cache dans Upstash.
 *
 * En mode `regional` c'est le dex du jeu (151 à 301 entrées selon le titre) ;
 * en mode `national` c'est le Pokédex national coupé à la génération de sortie
 * du jeu, donc générations précédentes incluses : Rubis s'arrête à Deoxys (386),
 * pas aux 1025 espèces sorties depuis.
 *
 * La clé n'est pas scopée par utilisateur : un Pokédex est une donnée publique,
 * identique pour tout le monde. Les jeux qui partagent un dex (Rouge, Bleu,
 * Jaune → kanto) partagent donc la même entrée de cache — et tous les jeux
 * partagent `pokedex:national`, mis en cache entier et coupé à la lecture.
 */
export async function getPokedex(
    game: PkmnGame,
    mode: ModePokedex = "regional",
): Promise<Pokedex> {
    const urlDex =
        mode === "national" ? URL_POKEDEX_NATIONAL : game.pokedexUrl;
    const slug = slugPokedex(urlDex);
    const cle = `pokedex:${slug}`;

    const enCache = await redis.get<Pokedex>(cle);
    const pokedex = enCache ?? (await chargerPokedex(cle, urlDex, slug));

    return mode === "national"
        ? couperAGeneration(pokedex, game.generation)
        : pokedex;
}

/** Appel PokeAPI et mise en cache de la version allégée. */
async function chargerPokedex(
    cle: string,
    url: string,
    slug: string,
): Promise<Pokedex> {
    const reponse = await fetch(url);

    if (!reponse.ok) {
        throw new Error("Erreur lors du chargement du Pokédex");
    }

    const pokedex = normaliserPokedex(slug, await reponse.json());

    await redis.set(cle, pokedex, { ex: DUREE_CACHE_SECONDES });

    return pokedex;
}

/**
 * Coupe le national à la génération de sortie du jeu.
 *
 * Une génération absente de `generations.ts` est une incohérence entre les deux
 * tables de données : mieux vaut une erreur franche qu'un Pokédex
 * silencieusement complet.
 */
function couperAGeneration(pokedex: Pokedex, generation: number): Pokedex {
    const borne = generations.find((item) => item.id === generation)?.nationalMax;

    if (borne === undefined) {
        throw new Error(`Génération inconnue : ${generation}`);
    }

    return {
        slug: pokedex.slug,
        entries: pokedex.entries.filter((entree) => entree.id <= borne),
    };
}

/** Dernier segment de l'URL du Pokédex : `.../pokedex/kanto/` → `kanto`. */
function slugPokedex(pokedexUrl: string) {
    return pokedexUrl.replace(/\/+$/, "").split("/").pop() ?? "";
}

/** Seule partie utile de la réponse `pokedex/{slug}` de PokeAPI. */
type ReponsePokedex = {
    pokemon_entries?: {
        entry_number: number;
        pokemon_species: { name: string; url: string };
    }[];
};

/**
 * La réponse brute embarque les noms dans toutes les langues : plus de 100 Ko
 * pour un seul dex. On ne garde que le numéro du dex interrogé, l'id national et
 * le nom de l'espèce, et c'est cette version allégée qui part dans le cache.
 */
function normaliserPokedex(slug: string, brut: ReponsePokedex): Pokedex {
    const entries: PokedexEntry[] = [];

    for (const entree of brut.pokemon_entries ?? []) {
        const id = idNational(entree.pokemon_species.url);

        if (id !== null) {
            entries.push({
                number: entree.entry_number,
                id,
                name: entree.pokemon_species.name,
            });
        }
    }

    return { slug, entries: entries.sort((a, b) => a.number - b.number) };
}

/** `.../pokemon-species/25/` → 25 */
function idNational(url: string): number | null {
    const id = Number(url.replace(/\/+$/, "").split("/").pop());

    return Number.isInteger(id) && id > 0 ? id : null;
}
