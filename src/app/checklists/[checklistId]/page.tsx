import { Suspense } from "react";
import { redirect } from "next/navigation";

import { ChecklistPokemonTable } from "@/components/checklist-pokemon-table";
import { getChecklistById } from "@/lib/checklist";

export default function Page({
  params,
}: {
  params: Promise<{ checklistId: string }>;
}) {
  return (
    <main>
      <Suspense fallback={<p>Chargement de la checklist…</p>}>
        <ChecklistDetail params={params} />
      </Suspense>
    </main>
  );
}

async function ChecklistDetail({
  params,
}: {
  params: Promise<{ checklistId: string }>;
}) {
  const { checklistId } = await params;
  const checklist = await getChecklistById(checklistId);

  if (!checklist) {
    redirect("/");
  }

  return (
    <ChecklistPokemonTable
      checklistId={checklist.id}
      gameKey={checklist.game_key}
    />
  );
}
