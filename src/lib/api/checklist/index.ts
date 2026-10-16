import type { Checklist } from "@/types/checklist";

export type NouvelleChecklist = {
  name: string;
  gameKey: string;
};

export async function getChecklists(): Promise<Checklist[]> {
  const response = await fetch("/api/checklist");

  if (!response.ok) {
    throw new Error("Erreur lors du chargement des checklists");
  }

  const body: { checklists: Checklist[] } = await response.json();

  return body.checklists;
}

export async function createChecklist(
  entree: NouvelleChecklist,
): Promise<Checklist> {
  const response = await fetch("/api/checklist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entree),
  });

  if (!response.ok) {
    throw new Error("Erreur lors de la création de la checklist");
  }

  const body: { checklist: Checklist } = await response.json();

  return body.checklist;
}
