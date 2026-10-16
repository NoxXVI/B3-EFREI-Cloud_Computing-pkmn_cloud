import { games } from "@/data/games";
import { Checklist } from "@/types/checklist";
import Link from "next/link";

export function ChecklistCard({ checklist }: { checklist: Checklist }) {
  const jeu = games.find((g) => g.pokeApiIdString === checklist.game_key);

  return (
    <Link href={`/checklists/${checklist.id}`} className="no-underline">
      <article className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-6 shadow-md hover:shadow-lg dark:border-gray-700">
        <hgroup>
          <h2 className="text-lg font-semibold">{checklist.name}</h2>
          <p className="text-sm text-gray-500">
            Pokémon {jeu?.name ?? checklist.game_key}
          </p>
        </hgroup>
        <p className="text-sm text-gray-500">
          Dernière mise à jour :{" "}
          {new Date(checklist.updated_at).toLocaleString("fr-FR", {
            dateStyle: "short",
            timeStyle: "short",
          })}
        </p>
      </article>
    </Link>
  );
}
