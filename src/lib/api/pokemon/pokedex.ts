import type { PokedexMode, Pokedex } from "@/types/pokemon";

export async function getPokedex(
  gameKey: string,
  mode: PokedexMode = "regional",
): Promise<Pokedex> {
  const params = new URLSearchParams({ mode });
  const response = await fetch(
    `/api/pokemon/pokedex/${encodeURIComponent(gameKey)}?${params}`,
  );

  if (!response.ok) {
    const body: { error?: string } | null = await response
      .json()
      .catch(() => null);

    throw new Error(body?.error ?? "Erreur lors du chargement du Pokédex");
  }

  const body: { pokedex: Pokedex } = await response.json();

  return body.pokedex;
}
