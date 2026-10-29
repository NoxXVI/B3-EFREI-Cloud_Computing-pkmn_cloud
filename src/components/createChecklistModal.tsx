"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { games } from "@/data/games";
import { useCreateChecklist } from "@/hooks/checklists";

type Game = (typeof games)[number];

export function CreateChecklistModal({
  render,
}: {
  render: React.ReactElement;
}) {
  const [open, setOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const { mutateAsync, isPending } = useCreateChecklist();

  function reset() {
    setSelectedGame(null);
    setName("");
    setError("");
  }

  function handleOpenChange(isOpen: boolean) {
    setOpen(isOpen);

    if (!isOpen) {
      reset();
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedGame || name.trim() === "") {
      setError("Choisissez un jeu et donnez un nom à la checklist.");
      return;
    }

    setError("");

    try {
      await mutateAsync({
        name: name.trim(),
        gameKey: selectedGame.pokeApiIdString,
      });
      setOpen(false);
    } catch {
      setError("Impossible de créer la checklist. Réessayez.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={render} />
      <DialogContent className="sm:max-w-sm">
        <form onSubmit={handleSubmit} className="grid gap-6">
          <DialogHeader>
            <DialogTitle>Créer une Checklist</DialogTitle>
            <DialogDescription>
              Créer une nouvelle checklist pour suivre l&apos;avancement de vos
              Pokédex.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="game">Jeu</FieldLabel>
              <Combobox
                items={games}
                onValueChange={(value) => {
                  const game = games.find(
                    (game) => game.pokeApiIdString === value,
                  );
                  setSelectedGame(game ?? null);
                }}
              >
                <ComboboxInput id="game" placeholder="Sélectionnez un jeu…" />
                <ComboboxContent>
                  <ComboboxEmpty>Aucun jeu trouvé</ComboboxEmpty>
                  <ComboboxList>
                    {(item) => (
                      <ComboboxItem
                        key={item.pokeApiIdString}
                        value={item.pokeApiIdString}
                      >
                        Pokémon {item.name}
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </Field>

            <Field>
              <FieldLabel htmlFor="name">Nom</FieldLabel>
              <Input
                id="name"
                name="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Nom de la checklist"
              />
            </Field>

            {error && <FieldError>{error}</FieldError>}
          </FieldGroup>

          <DialogFooter>
            <DialogClose
              render={
                <Button type="button" variant="outline">
                  Annulez
                </Button>
              }
            />
            <Button type="submit" disabled={isPending}>
              {isPending ? "Création…" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
