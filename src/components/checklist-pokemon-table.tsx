"use client";

import { RiErrorWarningLine, RiImportLine, RiInboxLine, RiLoader4Line, RiSaveLine } from "@remixicon/react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useChecklistPokemon } from "@/hooks/checklists";
import { usePokemon } from "@/hooks/pokemon";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

// Seul bout utile de la réponse PokeAPI `pokedex/{slug}`.
type Pokedex = {
  pokemon_entries: {
    entry_number: number;
    pokemon_species: { name: string };
  }[];
};

const sprite = (pokemonApiId: number) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonApiId}.png`;

export function ChecklistPokemonTable({ checklistId }: { checklistId: string }) {
  const { data: pokemon, isPending, isError, error } =
    useChecklistPokemon(checklistId);
  const { data: pokedex } = usePokemon("national");

  if (isPending) {
    return (
      <Empty>
        <EmptyHeader>
          <RiLoader4Line className="animate-spin" />
          <EmptyTitle>Chargement</EmptyTitle>
          <EmptyDescription>
            Récupération des Pokémon de la checklist…
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <RiErrorWarningLine />
        <AlertTitle>Impossible de charger les Pokémon</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    );
  }

  if (!pokemon?.length) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <RiInboxLine />
          </EmptyMedia>
          <EmptyTitle>Aucun Pokémon</EmptyTitle>
          <EmptyDescription>
            Cette checklist ne contient encore aucun Pokémon.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  // Dans le Pokédex national, `entry_number` correspond à l'id du Pokémon.
  const noms = new Map<number, string>();
  for (const entree of (pokedex as Pokedex | undefined)?.pokemon_entries ?? []) {
    noms.set(entree.entry_number, entree.pokemon_species.name);
  }

  return (
  <section>
    <div className="flex flex-row gap-2 p-2 border-b">
      <Input
      name="search"
      type="search"
      placeholder="Rechercher un Pokémon"
      />
      <Button variant="outline">
        <span className="hidden sm:inline">
          {5}
        </span>
        Filtres</Button>
      <Button variant="secondary">
        <RiImportLine />
        Import</Button>
      <Button>
        <RiSaveLine />
        Enregistrer</Button>
    </div>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-16">Sprite</TableHead>
          <TableHead>N°</TableHead>
          <TableHead>Nom</TableHead>
          <TableHead>Capturé</TableHead>
          <TableHead>Mis à jour</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {pokemon.map((ligne) => (
          <TableRow key={ligne.pokemon_api_id}>
            <TableCell>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={sprite(ligne.pokemon_api_id)}
                alt=""
                width={40}
                height={40}
                loading="lazy"
              />
            </TableCell>
            <TableCell>{ligne.pokemon_api_id}</TableCell>
            <TableCell className="capitalize">
              {noms.get(ligne.pokemon_api_id) ?? "—"}
            </TableCell>
            <TableCell>{ligne.is_captured ? "Oui" : "Non"}</TableCell>
            <TableCell>
              {new Date(ligne.updated_at).toLocaleDateString("fr-FR")}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </section>
  );
}
