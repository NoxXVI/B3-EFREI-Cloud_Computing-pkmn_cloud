"use client";

import { useMemo, useState } from "react";
import {
  RiErrorWarningLine,
  RiFilter3Line,
  RiImportLine,
  RiInboxLine,
  RiLoader4Line,
  RiSaveLine,
} from "@remixicon/react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useChecklistPokemon,
  useSaveChecklistPokemon,
} from "@/hooks/checklists";
import { usePokedex } from "@/hooks/pokemon";
import { spriteUrl } from "@/lib/pokemon-labels";
import type { ChecklistPokemon } from "@/types/checklist";
import type { CaptureFilter, ChatFilterPatch } from "@/types/chat";
import type { PokedexMode, PokedexEntry } from "@/types/pokemon";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ViewPokemonModal } from "./view-pokemon-dialog";
import { ChatAssistant } from "./chat-drawer";

const CAPTURE_FILTERS: { value: CaptureFilter; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "captured", label: "Capturés" },
  { value: "uncaptured", label: "Non capturés" },
  { value: "absent", label: "Absents" },
];

const POKEDEX_MODES: { value: PokedexMode; label: string }[] = [
  { value: "regional", label: "Régional" },
  { value: "national", label: "National" },
];

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("fr");
}

function captureStateOf(
  entry: PokedexEntry,
  pendingChanges: Map<number, boolean>,
  index: Map<number, ChecklistPokemon>,
) {
  return pendingChanges.get(entry.id) ?? index.get(entry.id)?.is_captured;
}

export function ChecklistPokemonTable({
  checklistId,
  gameKey,
}: {
  checklistId: string;
  gameKey: string;
}) {
  const [search, setSearch] = useState("");
  const [captureFilter, setCaptureFilter] = useState<CaptureFilter>("all");
  const [mode, setMode] = useState<PokedexMode>("regional");
  const [pendingChanges, setPendingChanges] = useState<Map<number, boolean>>(
    new Map(),
  );

  const dex = usePokedex(gameKey, mode);
  const rows = useChecklistPokemon(checklistId);
  const saveMutation = useSaveChecklistPokemon(checklistId);

  const index = useMemo(() => {
    const byId = new Map<number, ChecklistPokemon>();

    for (const row of rows.data ?? []) {
      byId.set(row.pokemon_api_id, row);
    }

    return byId;
  }, [rows.data]);

  const visibleEntries = useMemo(() => {
    const filter = normalize(search.trim());

    return (dex.data?.entries ?? [])
      .filter((entry) => {
        const current = captureStateOf(entry, pendingChanges, index);

        if (captureFilter === "captured" && current !== true) {
          return false;
        }

        if (captureFilter === "uncaptured" && current !== false) {
          return false;
        }

        if (captureFilter === "absent" && current !== undefined) {
          return false;
        }

        if (!filter) {
          return true;
        }

        return (
          normalize(entry.name).includes(filter) ||
          String(entry.number) === filter
        );
      })
      .sort((a, b) => a.number - b.number);
  }, [dex.data, index, pendingChanges, captureFilter, search]);

  const activeFacets =
    (captureFilter === "all" ? 0 : 1) + (mode === "regional" ? 0 : 1);

  const toggle = (entry: PokedexEntry, checked: boolean) => {
    setPendingChanges((previous) => {
      const next = new Map(previous);
      const stored = index.get(entry.id)?.is_captured;

      if (checked === stored || (!checked && stored === undefined)) {
        next.delete(entry.id);
      } else {
        next.set(entry.id, checked);
      }

      return next;
    });
  };

  const save = () => {
    saveMutation.mutate(
      [...pendingChanges].map(([pokemonApiId, isCaptured]) => ({
        pokemonApiId,
        isCaptured,
      })),
      { onSuccess: () => setPendingChanges(new Map()) },
    );
  };

  const applyFilterPatch = (patch: ChatFilterPatch) => {
    if (patch.search !== undefined) {
      setSearch(patch.search);
    }

    if (patch.capture !== undefined) {
      setCaptureFilter(patch.capture);
    }

    if (patch.mode !== undefined) {
      setMode(patch.mode);
    }
  };

  const error = dex.error ?? rows.error;
  const loading = !dex.data || !rows.data;

  return (
    <section>
      <div className="flex flex-row gap-2 border-b p-2">
        <Input
          name="search"
          type="search"
          aria-label="Rechercher un Pokémon"
          placeholder="Rechercher un Pokémon"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <Popover>
          <PopoverTrigger render={<Button variant="outline" />}>
            <RiFilter3Line />
            Filtres
            {activeFacets > 0 && (
              <Badge variant="secondary">{activeFacets}</Badge>
            )}
          </PopoverTrigger>
          <PopoverContent>
            <fieldset className="flex flex-col gap-2">
              <legend className="text-muted-foreground text-xs font-medium">
                État
              </legend>
              <div className="flex flex-wrap gap-1">
                {CAPTURE_FILTERS.map((option) => (
                  <Button
                    key={option.value}
                    size="sm"
                    variant={
                      captureFilter === option.value ? "secondary" : "outline"
                    }
                    aria-pressed={captureFilter === option.value}
                    onClick={() => setCaptureFilter(option.value)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </fieldset>
            <fieldset className="flex flex-col gap-2">
              <legend className="text-muted-foreground text-xs font-medium">
                Pokédex
              </legend>
              <div className="flex flex-wrap gap-1">
                {POKEDEX_MODES.map((option) => (
                  <Button
                    key={option.value}
                    size="sm"
                    variant={mode === option.value ? "secondary" : "outline"}
                    aria-pressed={mode === option.value}
                    onClick={() => setMode(option.value)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
              <p className="text-muted-foreground text-xs">
                Le national couvre les générations précédentes, jusqu&apos;à
                celle de ce jeu.
              </p>
            </fieldset>
          </PopoverContent>
        </Popover>
        <Button variant="secondary">
          <RiImportLine />
          Import
        </Button>
        <Button
          onClick={save}
          disabled={pendingChanges.size === 0 || saveMutation.isPending}
        >
          {saveMutation.isPending ? (
            <RiLoader4Line className="animate-spin" />
          ) : (
            <RiSaveLine />
          )}
          Enregistrer
          {pendingChanges.size > 0 ? ` (${pendingChanges.size})` : ""}
        </Button>
      </div>

      {saveMutation.isError && (
        <Alert variant="destructive" className="m-2">
          <RiErrorWarningLine />
          <AlertTitle>Enregistrement impossible</AlertTitle>
          <AlertDescription>
            {saveMutation.error.message} Vos modifications sont conservées :
            réessayez avec le bouton Enregistrer.
          </AlertDescription>
        </Alert>
      )}

      {error ? (
        <Alert variant="destructive" className="m-2">
          <RiErrorWarningLine />
          <AlertTitle>Impossible de charger les Pokémon</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      ) : loading ? (
        <Empty>
          <EmptyHeader>
            <RiLoader4Line className="animate-spin" />
            <EmptyTitle>Chargement</EmptyTitle>
            <EmptyDescription>
              Récupération des Pokémon de la checklist…
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : dex.data.entries.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <RiInboxLine />
            </EmptyMedia>
            <EmptyTitle>Aucun Pokémon</EmptyTitle>
            <EmptyDescription>
              Ce Pokédex ne contient aucune entrée.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : visibleEntries.length === 0 ? (
        <p className="text-muted-foreground p-6 text-center text-sm">
          Aucun Pokémon ne correspond à ces filtres.
        </p>
      ) : (
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
            {visibleEntries.map((entry) => {
              const row = index.get(entry.id);
              const current = captureStateOf(entry, pendingChanges, index);

              return (
                <TableRow key={entry.id}>
                  <TableCell>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={spriteUrl(entry.id)}
                      alt=""
                      width={40}
                      height={40}
                      loading="lazy"
                    />
                  </TableCell>
                  <TableCell>{entry.number}</TableCell>
                  <TableCell>
                    <ViewPokemonModal
                      render={
                        <Button
                          variant="link"
                          className="h-auto justify-start px-0"
                        >
                          {entry.name}
                        </Button>
                      }
                      pokemonApiId={entry.id}
                      gameKey={gameKey}
                      capture={current}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={current ?? false}
                        disabled={saveMutation.isPending}
                        aria-label={`Capturé : ${entry.name}`}
                        onCheckedChange={(checked) => toggle(entry, checked)}
                      />
                      <span className="text-muted-foreground text-xs">
                        {current === undefined
                          ? "hors checklist"
                          : current
                            ? "capturé"
                            : "non capturé"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {row
                      ? new Date(row.updated_at).toLocaleDateString("fr-FR")
                      : ""}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      <ChatAssistant
        filters={{ search, capture: captureFilter, mode }}
        onFiltersChange={applyFilterPatch}
      />
    </section>
  );
}
