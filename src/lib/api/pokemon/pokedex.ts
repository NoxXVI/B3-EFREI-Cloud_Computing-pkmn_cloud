import type { ModePokedex, Pokedex } from "@/types/pokemon";

export async function getPokedex(
  gameKey: string,
  mode: ModePokedex = "regional",
): Promise<Pokedex> {
  const parametres = new URLSearchParams({ mode });
  const response = await fetch(
    `/api/pokemon/pokedex/${encodeURIComponent(gameKey)}?${parametres}`,
  );

  if (!response.ok) {
    // La route distingue « jeu inconnu » (404), « mode inconnu » (400) et une
    // panne PokeAPI (502) : on remonte son message plutôt qu'un texte générique.
    const corps: { error?: string } | null = await response
      .json()
      .catch(() => null);

    throw new Error(corps?.error ?? "Erreur lors du chargement du Pokédex");
  }

  const body: { pokedex: Pokedex } = await response.json();

  return body.pokedex;
}
