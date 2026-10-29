import type { ChecklistPokemon } from "@/types/checklist";

export type ChecklistPokemonUpdate = {
  pokemonApiId: number;
  isCaptured: boolean;
};

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

export async function saveChecklistPokemon(
  checklistId: string,
  rows: ChecklistPokemonUpdate[],
): Promise<ChecklistPokemon[]> {
  const response = await fetch(
    `/api/checklist/${encodeURIComponent(checklistId)}/pokemon`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows }),
    },
  );

  if (!response.ok) {
    const body: { error?: string } | null = await response
      .json()
      .catch(() => null);

    throw new Error(
      body?.error ?? "Erreur lors de l'enregistrement des Pokémon",
    );
  }

  const body: { pokemon: ChecklistPokemon[] } = await response.json();

  return body.pokemon;
}
