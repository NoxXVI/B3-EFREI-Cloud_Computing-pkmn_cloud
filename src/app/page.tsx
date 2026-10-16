"use client";

import { usePokemon } from "@/hooks/pokemon";
import { useChecklists } from "@/hooks/checklists";
import { Card, CardContent } from "@/components/ui/card";
import {
  RiErrorWarningLine,
  RiFileList3Line,
  RiLoader4Line,
} from "@remixicon/react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ChecklistCard } from "@/components/checklist-card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import { CreateChecklistModal } from "@/components/createChecklistModal";

export default function Home() {
  const {
    data: pokemons,
    isPending: isPokemonPending,
    isError: isPokemonError,
    error: pokemonError,
  } = usePokemon("national");
  const { data: checklists, isPending, isError, error } = useChecklists();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center bg-white px-6 py-16 dark:bg-black">
      {isPending && (
        <Empty>
          <EmptyHeader>
            <RiLoader4Line className="animate-spin" />
            <EmptyTitle>Chargment</EmptyTitle>
            <EmptyDescription>
              2 secondes, ça ne devrait pas être long...
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
      {isError && (
        <Alert variant="destructive">
          <RiErrorWarningLine />
          <AlertTitle>
            Nous n&apos;avons pas pu charger vos checklist
          </AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}
      {checklists?.length === 0 && (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <RiFileList3Line />
            </EmptyMedia>
            <EmptyTitle>Aucune Checklist</EmptyTitle>
            <EmptyDescription>
              Vous n&apos;avez aucune checklist pour le moment. Créez-en une
              pour commencer à suivre vos Pokémon.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent className="flex-row justify-center gap-2">

            <CreateChecklistModal render={
              <Button>Créer une Checklist</Button>
            }/>
          </EmptyContent>
        </Empty>
      )}
      <section>
        <div className="grid grid-cols-4 gap-4">
          {checklists?.map((checklist) => (
            <ChecklistCard
              key={checklist.id}
              name={checklist.name}
              game={checklist.game_key}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
