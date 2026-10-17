import { useQuery } from "@tanstack/react-query";

import { getPokedex } from "@/lib/api/pokemon/pokedex";
import type { ModePokedex } from "@/types/pokemon";

/**
 * Pokédex d'un jeu, par sa clé (`red`, `yellow`…) et par mode.
 *
 * Un Pokédex est immuable côté PokeAPI et déjà caché longtemps par Upstash côté
 * serveur : inutile de le rafraîchir pendant la session. Le mode fait partie de
 * la clé, donc passer en national charge une seconde requête — une seule fois,
 * et seulement si l'utilisateur demande ce mode.
 */
export function usePokedex(gameKey: string, mode: ModePokedex = "regional") {
  return useQuery({
    queryKey: ["pokedex", gameKey, mode],
    queryFn: () => getPokedex(gameKey, mode),
    enabled: Boolean(gameKey),
    staleTime: Infinity,
  });
}
