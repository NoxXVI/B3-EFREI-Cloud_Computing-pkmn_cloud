export async function getPokemon(slug: string) {
  const response = await fetch(
    `/api/pokemon/pokedex/${encodeURIComponent(slug)}`
  );

  if (!response.ok) {
    throw new Error("Erreur lors du chargement du Pokémon");
  }

  return response.json();
}