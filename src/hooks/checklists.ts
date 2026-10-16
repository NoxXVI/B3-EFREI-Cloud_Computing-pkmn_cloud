import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createChecklist, getChecklists } from "@/lib/api/checklist";

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
