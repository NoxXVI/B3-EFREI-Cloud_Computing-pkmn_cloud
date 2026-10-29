"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const router = useRouter();

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold">Une erreur est survenue</h1>
      <p className="text-muted-foreground">
        L&apos;action n&apos;a pas pu aboutir. Vous pouvez réessayer ou revenir
        à l&apos;accueil.
      </p>
      <div className="flex gap-2">
        <Button onClick={reset}>Réessayer</Button>
        <Button variant="outline" onClick={() => router.push("/")}>
          Retour à l&apos;accueil
        </Button>
      </div>
    </main>
  );
}
