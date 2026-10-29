import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold">Page introuvable</h1>
      <p className="text-muted-foreground">
        Cette page n&apos;existe pas ou la checklist demandée a été supprimée.
      </p>
      <Button render={<Link href="/" />}>Retour à l&apos;accueil</Button>
    </main>
  );
}
