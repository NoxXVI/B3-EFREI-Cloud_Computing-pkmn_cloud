"use client";

import Link from "next/link";
import { useParams, useSelectedLayoutSegments } from "next/navigation";

import { useChecklist } from "@/hooks/checklists";

const LABELS: Record<string, string> = {
  checklists: "Checklists",
  admin: "Administration",
  auth: "Connexion",
  signup: "Inscription",
};

const shortId = (id: string) => `${id.slice(0, 8)}…`;

function ChecklistName({ checklistId }: { checklistId: string }) {
  const { data, isPending } = useChecklist(checklistId);

  if (isPending || !data) {
    return <>{shortId(checklistId)}</>;
  }

  return <>{data.name}</>;
}

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
          const isLast = index === segments.length - 1;
          const content =
            segment === checklistId ? (
              <ChecklistName checklistId={segment} />
            ) : (
              (LABELS[segment] ?? segment)
            );

          return (
            <li key={href} className="flex items-center gap-1.5">
              {index > 0 && (
                <span aria-hidden className="text-muted-foreground">
                  /
                </span>
              )}
              {isLast ? (
                <span aria-current="page" className="font-medium">
                  {content}
                </span>
              ) : (
                <Link
                  href={href}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {content}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
