import { useQuery } from "@tanstack/react-query";

import { getPokedex } from "@/lib/api/pokemon/pokedex";
import { getPokemonDetail } from "@/lib/api/pokemon/detail";
import type { PokedexMode } from "@/types/pokemon";

export function usePokedex(gameKey: string, mode: PokedexMode = "regional") {
  return useQuery({
    queryKey: ["pokedex", gameKey, mode],
    queryFn: () => getPokedex(gameKey, mode),
    enabled: Boolean(gameKey),
    staleTime: Infinity,
  });
}

export function usePokemonDetail(
  pokemonApiId: number,
  gameKey: string,
  isOpen: boolean,
) {
  return useQuery({
    queryKey: ["pokemon", pokemonApiId, gameKey],
    queryFn: () => getPokemonDetail(pokemonApiId, gameKey),
    enabled: isOpen && Boolean(gameKey),
    staleTime: Infinity,
  });
}
