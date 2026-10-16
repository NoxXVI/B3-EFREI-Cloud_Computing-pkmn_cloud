import { useQuery } from "@tanstack/react-query";
import { getPokemon } from "@/lib/api/pokemon/pokedex";

export function usePokemon(slug: string) {
  return useQuery({
    queryKey: ["pokemon", slug],
    queryFn: () => getPokemon(slug),
    enabled: Boolean(slug),
  });
}