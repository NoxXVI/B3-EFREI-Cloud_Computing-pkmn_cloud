import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createChecklist,
  getChecklistById,
  getChecklists,
} from "@/lib/api/checklist";
import { getChecklistPokemon } from "@/lib/api/checklist/pokemon";

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
