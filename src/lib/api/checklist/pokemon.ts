import type { ChecklistPokemon } from "@/types/checklist";

export async function getChecklistPokemon(
  checklistId: string,
): Promise<ChecklistPokemon[]> {
  const response = await fetch(
    `/api/checklist/${encodeURIComponent(checklistId)}/pokemon`,
  );

  if (!response.ok) {
    throw new Error("Erreur lors du chargement des Pokémon");
  }

  const body: { pokemon: ChecklistPokemon[] } = await response.json();

  return body.pokemon;
}
