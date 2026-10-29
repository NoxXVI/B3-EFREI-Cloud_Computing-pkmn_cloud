import type { PokemonDetail } from "@/types/pokemon";

export async function getPokemonDetail(
  pokemonApiId: number,
  gameKey: string,
): Promise<PokemonDetail> {
  const params = new URLSearchParams({ game: gameKey });
  const response = await fetch(`/api/pokemon/detail/${pokemonApiId}?${params}`);

  if (!response.ok) {
    const body: { error?: string } | null = await response
      .json()
      .catch(() => null);

    throw new Error(body?.error ?? "Erreur lors du chargement du Pokémon");
  }

  const body: { pokemon: PokemonDetail } = await response.json();

  return body.pokemon;
}
