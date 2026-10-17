"use client";

import { useChecklists } from "@/hooks/checklists";
import { Card, CardContent } from "@/components/ui/card";
import {
  RiAddLargeLine,
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
  const { data: checklists, isPending, isError, error } = useChecklists();

  return (
    <main className="mx-auto gap-8 flex w-full max-w-3xl flex-1 flex-col bg-white px-6 py-16 dark:bg-black">
      <hgroup>
        <h2 className="text-4xl font-heading font-medium tracking-tight">
          Vos Checklists
        </h2>
        <p className="text-gray-500">
          Retrouvez ici toutes vos checklists pour suivre vos Pokémon.
        </p>
      </hgroup>
      <section>
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
              <CreateChecklistModal
                render={<Button>Créer une Checklist</Button>}
              />
            </EmptyContent>
          </Empty>
        )}
        <div className="grid grid-cols-3 gap-4">
          {checklists?.map((checklist) => (
            <ChecklistCard key={checklist.id} checklist={checklist} />
          ))}
          {!isPending && !isError && !(checklists?.length === 0) && (
            <CreateChecklistModal
              render={
                <div className="flex border-dashed flex-col gap-4 rounded-lg border border-gray-200 justify-center items-center p-6 shadow-md hover:shadow-lg dark:border-gray-700">
                  <RiAddLargeLine className="text-gray-400" />
                  <h3 className="text-gray-500">Ajouter une Checklist</h3>
                </div>
              }
            />
          )}
        </div>
      </section>
    </main>
  );
}
