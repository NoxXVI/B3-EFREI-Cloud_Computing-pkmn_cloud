import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createChecklist,
  getChecklistById,
  getChecklists,
} from "@/lib/api/checklist";
import {
  getChecklistPokemon,
  saveChecklistPokemon,
  type ChecklistPokemonUpdate,
} from "@/lib/api/checklist/pokemon";

export function useChecklists() {
  return useQuery({
    queryKey: ["checklists"],
    queryFn: getChecklists,
    staleTime: 30_000,
  });
}

export function useCreateChecklist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createChecklist,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checklists"] });
    },
  });
}

export function useChecklist(checklistId: string) {
  return useQuery({
    queryKey: ["checklist", checklistId],
    queryFn: () => getChecklistById(checklistId),
    enabled: Boolean(checklistId),
    staleTime: 30_000,
  });
}

export function useChecklistPokemon(checklistId: string) {
  return useQuery({
    queryKey: ["checklist-pokemon", checklistId],
    queryFn: () => getChecklistPokemon(checklistId),
    enabled: Boolean(checklistId),
    staleTime: 30_000,
  });
}

export function useSaveChecklistPokemon(checklistId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (rows: ChecklistPokemonUpdate[]) =>
      saveChecklistPokemon(checklistId, rows),
    onSuccess: (pokemon) => {
      queryClient.setQueryData(["checklist-pokemon", checklistId], pokemon);
      queryClient.invalidateQueries({ queryKey: ["checklist", checklistId] });
      queryClient.invalidateQueries({ queryKey: ["checklists"] });
    },
  });
}
