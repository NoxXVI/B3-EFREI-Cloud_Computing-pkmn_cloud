import { Suspense } from "react";
import { redirect } from "next/navigation";

import { ChecklistPokemonTable } from "@/components/checklist-pokemon-table";
import { getChecklistById } from "@/lib/checklist";

/**
 * La lecture de session passe forcément par un `<Suspense>` ici : sous
 * `cacheComponents`, Next prérend toujours la coquille statique de la route
 * (`dynamic = "force-dynamic"` a été retiré pour cette raison). Le `redirect`
 * ci-dessous est donc émis côté client (`NEXT_REDIRECT;replace;/;307`), pas en
 * tant que statut HTTP.
 */
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

  // `null` couvre les deux cas : la checklist n'existe pas, ou elle appartient
  // à quelqu'un d'autre (RLS). Aucun filtre `user_id` n'est nécessaire.
  if (!checklist) {
    redirect("/");
  }

  return <ChecklistPokemonTable checklistId={checklist.id} gameKey={checklist.game_key} />;
}
