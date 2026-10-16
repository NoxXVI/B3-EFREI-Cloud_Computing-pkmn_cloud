"use client";

import Link from "next/link";
import { useParams, useSelectedLayoutSegments } from "next/navigation";

import { useChecklist } from "@/hooks/checklists";

const LIBELLES: Record<string, string> = {
  checklists: "Checklists",
  admin: "Administration",
  auth: "Connexion",
  signup: "Inscription",
};

const idCourt = (id: string) => `${id.slice(0, 8)}…`;

function NomChecklist({ checklistId }: { checklistId: string }) {
  const { data, isPending } = useChecklist(checklistId);

  if (isPending || !data) {
    return <>{idCourt(checklistId)}</>;
  }

  return <>{data.name}</>;
}

/**
 * Fil d'Ariane de l'entête.
 *
 * Le root layout ne reçoit pas les params de ses routes filles, donc le fil est
 * reconstruit ici, côté client, depuis les segments actifs
 * (`useSelectedLayoutSegments`, le hook que Next documente pour les
 * breadcrumbs). Le nom de la checklist est résolu par `useChecklist` puisque
 * l'url ne porte qu'un uuid.
 */
export function Breadcrumb() {
  const params = useParams();
  const checklistId =
    typeof params.checklistId === "string" ? params.checklistId : undefined;
  const segments = useSelectedLayoutSegments().filter(
    (segment) => !segment.startsWith("(") && !segment.startsWith("["),
  );

  if (segments.length === 0) {
    return (
      <nav aria-label="Fil d'Ariane">
        <ol className="flex items-center gap-1.5">
          <li>
            <span aria-current="page" className="font-medium">
              Checklists
            </span>
          </li>
        </ol>
      </nav>
    );
  }

  return (
    <nav aria-label="Fil d'Ariane">
      <ol className="flex items-center gap-1.5">
        {segments.map((segment, index) => {
          const href = `/${segments.slice(0, index + 1).join("/")}`;
          const dernier = index === segments.length - 1;
          const contenu =
            segment === checklistId ? (
              <NomChecklist checklistId={segment} />
            ) : (
              (LIBELLES[segment] ?? segment)
            );

          return (
            <li key={href} className="flex items-center gap-1.5">
              {index > 0 && (
                <span aria-hidden className="text-muted-foreground">
                  /
                </span>
              )}
              {dernier ? (
                <span aria-current="page" className="font-medium">
                  {contenu}
                </span>
              ) : (
                <Link
                  href={href}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {contenu}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
