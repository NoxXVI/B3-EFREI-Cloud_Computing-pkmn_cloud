import type { Checklist } from "@/types/checklist";

export type NewChecklist = {
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

export async function createChecklist(input: NewChecklist): Promise<Checklist> {
  const response = await fetch("/api/checklist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error("Erreur lors de la création de la checklist");
  }

  const body: { checklist: Checklist } = await response.json();

  return body.checklist;
}

export async function getChecklistById(
  checklistId: string,
): Promise<Checklist | null> {
  const response = await fetch(
    `/api/checklist/${encodeURIComponent(checklistId)}`,
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Erreur lors du chargement de la checklist");
  }

  const body: { checklist: Checklist } = await response.json();

  return body.checklist;
}
