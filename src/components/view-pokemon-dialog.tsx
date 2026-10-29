"use client";

import { useState, type ReactElement } from "react";
import {
  RiErrorWarningLine,
  RiLoader4Line,
  RiMapPinLine,
} from "@remixicon/react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePokemonDetail } from "@/hooks/pokemon";
import {
  typeColor,
  describeCondition,
  formatWeight,
  formatHeight,
  label,
  conditionLabel,
  genderLabel,
  methodLabel,
  typeLabel,
  GROWTH_LABELS,
  EGG_GROUP_LABELS,
  HABITAT_LABELS,
  STAT_LABELS,
  obtainSentence,
  spriteUrl,
} from "@/lib/pokemon-labels";
import type {
  EvolutionStep,
  PokemonDetail,
  PokemonEncounter,
} from "@/types/pokemon";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";

const PANEL_HEIGHT_CLASS = "max-h-[50vh] overflow-y-auto";

function Fact({ term, value }: { term: string; value: string }) {
  return (
    <div className="flex flex-col">
      <dt className="text-muted-foreground text-xs">{term}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function CloseFooter() {
  return (
    <DialogFooter>
      <DialogClose render={<Button type="button" variant="outline" />}>
        Fermer
      </DialogClose>
    </DialogFooter>
  );
}

function CaptureBadge({ capture }: { capture: boolean | undefined }) {
  if (capture === undefined) {
    return <Badge variant="outline">hors checklist</Badge>;
  }

  return (
    <Badge variant={capture ? "secondary" : "outline"}>
      {capture ? "capturé" : "non capturé"}
    </Badge>
  );
}

function EvolutionStepCard({
  step,
  isCurrent,
}: {
  step: EvolutionStep;
  isCurrent: boolean;
}) {
  const conditions = [
    ...new Set(
      step.conditions.map((item) => describeCondition(item).join(" + ")),
    ),
  ];

  return (
    <div
      className={`flex w-44 flex-col items-center gap-1 rounded-lg border p-3 text-center ${
        isCurrent ? "border-primary bg-primary/5" : ""
      }`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={spriteUrl(step.id)}
        alt=""
        width={64}
        height={64}
        loading="lazy"
      />
      <span>{step.name}</span>
      <span className="text-muted-foreground text-xs">N° {step.id}</span>
      {conditions.length > 0 && (
        <ul className="text-muted-foreground mt-1 flex flex-col gap-0.5 text-xs">
          {conditions.map((condition) => (
            <li key={condition}>{condition}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function GeneralTab({ pokemon }: { pokemon: PokemonDetail }) {
  return (
    <TabsContent value="general" className={PANEL_HEIGHT_CLASS}>
      <div className="flex flex-col gap-4 pr-1">
        <p>{obtainSentence(pokemon)}</p>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
          <Fact term="Taux de capture" value={String(pokemon.captureRate)} />
          <Fact
            term="Habitat"
            value={
              pokemon.habitat
                ? label(HABITAT_LABELS, pokemon.habitat)
                : "Inconnu"
            }
          />
          <Fact
            term="Groupes d'œufs"
            value={pokemon.eggGroups
              .map((group) => label(EGG_GROUP_LABELS, group))
              .join(", ")}
          />
          <Fact term="Répartition" value={genderLabel(pokemon.genderRate)} />
          <Fact
            term="Croissance"
            value={
              pokemon.growthRate
                ? label(GROWTH_LABELS, pokemon.growthRate)
                : "Inconnue"
            }
          />
        </dl>
      </div>
    </TabsContent>
  );
}

function LocationTab({ pokemon }: { pokemon: PokemonDetail }) {
  const byZone = new Map<string, PokemonEncounter[]>();

  for (const encounter of pokemon.encounters) {
    const rows = byZone.get(encounter.zone) ?? [];
    rows.push(encounter);
    byZone.set(encounter.zone, rows);
  }

  return (
    <TabsContent value="location" className={PANEL_HEIGHT_CLASS}>
      <div className="flex flex-col gap-3 pr-1">
        {pokemon.encounters.length === 0 ? (
          <div className="flex flex-col gap-2">
            <p>Aucune rencontre sauvage dans {pokemon.game}.</p>
            {pokemon.otherGames.length > 0 && (
              <p className="text-muted-foreground">
                Dans cette génération, il n&apos;apparaît que dans{" "}
                {pokemon.otherGames.map((game) => game.name).join(", ")}.
              </p>
            )}
            <p className="text-muted-foreground text-xs">
              Il peut tout de même s&apos;obtenir par évolution ou par
              distribution d&apos;événement.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {[...byZone].map(([zone, rows]) => (
              <li key={zone} className="rounded-lg border p-3">
                <p className="flex items-center gap-2 font-medium">
                  <RiMapPinLine />
                  {zone}
                </p>
                <ul className="mt-2 flex flex-col gap-1">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Méthode</TableHead>
                        <TableHead>Niveaux</TableHead>
                        <TableHead>Apparitions %</TableHead>
                        <TableHead>Conditions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((row, position) => (
                        <TableRow key={position}>
                          <TableCell className="font-medium">
                            {methodLabel(row.method)}
                          </TableCell>
                          <TableCell>
                            {row.minLevel === row.maxLevel
                              ? `Niveau ${row.minLevel}`
                              : `Niveaux ${row.minLevel}-${row.maxLevel}`}
                          </TableCell>
                          <TableCell>{row.chance} %</TableCell>
                          <TableCell>
                            {row.conditions.map((condition) => (
                              <Badge key={condition} variant="outline">
                                {conditionLabel(condition)}
                              </Badge>
                            ))}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ul>
              </li>
            ))}
          </ul>
        )}

        <p className="text-muted-foreground text-xs">
          Zones, méthodes, niveaux et chances tels que PokéAPI les donne : à la
          zone, pas à la case.
        </p>
      </div>
    </TabsContent>
  );
}

function EvolutionTab({ pokemon }: { pokemon: PokemonDetail }) {
  const byDepth = new Map<number, EvolutionStep[]>();

  for (const step of pokemon.evolution) {
    const steps = byDepth.get(step.depth) ?? [];
    steps.push(step);
    byDepth.set(step.depth, steps);
  }

  return (
    <TabsContent value="evolution" className={PANEL_HEIGHT_CLASS}>
      <div className="flex flex-col gap-4 pr-1">
        {pokemon.evolution.length === 0 ? (
          <p className="text-muted-foreground">
            Cette espèce n&apos;évolue pas.
          </p>
        ) : (
          [...byDepth]
            .sort(([depthA], [depthB]) => depthA - depthB)
            .map(([depth, steps]) => (
              <div key={depth} className="flex flex-col gap-2">
                <p className="text-muted-foreground text-xs font-medium">
                  {depth === 0 ? "Forme de base" : `Étape ${depth + 1}`}
                </p>
                <div className="flex flex-wrap gap-3">
                  {steps.map((step) => (
                    <EvolutionStepCard
                      key={step.id}
                      step={step}
                      isCurrent={step.id === pokemon.id}
                    />
                  ))}
                </div>
              </div>
            ))
        )}

        <p className="text-muted-foreground text-xs">
          Lignes évolutives avec les conditions d&apos;évolution et les
          évolutions spéciales. Les informations sont tirées de PokéAPI et
          peuvent ne pas être exactes : une condition qui a changé selon les
          générations apparaît plusieurs fois.
        </p>
      </div>
    </TabsContent>
  );
}

function Detail({
  pokemon,
  capture,
}: {
  pokemon: PokemonDetail;
  capture: boolean | undefined;
}) {
  return (
    <>
      <DialogHeader>
        <div className="flex items-start gap-4">
          {(pokemon.artwork || pokemon.sprite) && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={pokemon.artwork ?? pokemon.sprite ?? ""}
              alt=""
              width={128}
              height={128}
              className="size-32 shrink-0"
            />
          )}
          <div className="flex min-w-0 flex-col gap-2">
            <DialogTitle className="text-2xl">{pokemon.name}</DialogTitle>
            <DialogDescription>
              N° {pokemon.id}
              {pokemon.genus ? ` · ${pokemon.genus}` : ""} · vue de{" "}
              {pokemon.game}
            </DialogDescription>
            <div className="flex flex-wrap items-center gap-1">
              {pokemon.types.map((type) => (
                <Badge key={type} className={typeColor(type)}>
                  {typeLabel(type)}
                </Badge>
              ))}
              <CaptureBadge capture={capture} />
              {pokemon.isLegendary && (
                <Badge variant="outline">Légendaire</Badge>
              )}
              {pokemon.isMythical && <Badge variant="outline">Mythique</Badge>}
              {pokemon.isBaby && <Badge variant="outline">Bébé</Badge>}
            </div>
          </div>
        </div>
      </DialogHeader>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">Général</TabsTrigger>
          <TabsTrigger value="location">Localisation</TabsTrigger>
          <TabsTrigger value="evolution">Ligne évolutive</TabsTrigger>
        </TabsList>
        <GeneralTab pokemon={pokemon} />
        <LocationTab pokemon={pokemon} />
        <EvolutionTab pokemon={pokemon} />
      </Tabs>

      <CloseFooter />
    </>
  );
}

export function ViewPokemonModal({
  render,
  pokemonApiId,
  gameKey,
  capture,
}: {
  render: ReactElement;
  pokemonApiId: number;
  gameKey: string;
  capture: boolean | undefined;
}) {
  const [open, setOpen] = useState(false);
  const detail = usePokemonDetail(pokemonApiId, gameKey, open);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={render} />
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
        {detail.isError ? (
          <>
            <DialogHeader>
              <DialogTitle>Fiche indisponible</DialogTitle>
              <DialogDescription>
                La fiche n&apos;a pas pu être chargée depuis PokéAPI.
              </DialogDescription>
            </DialogHeader>
            <Alert variant="destructive">
              <RiErrorWarningLine />
              <AlertTitle>Erreur de chargement</AlertTitle>
              <AlertDescription>{detail.error.message}</AlertDescription>
            </Alert>
            <CloseFooter />
          </>
        ) : !detail.data ? (
          <>
            <DialogHeader>
              <DialogTitle>Chargement…</DialogTitle>
              <DialogDescription>
                Récupération de la fiche depuis PokéAPI.
              </DialogDescription>
            </DialogHeader>
            <div className="text-muted-foreground flex items-center justify-center gap-2 p-10">
              <RiLoader4Line className="animate-spin" />
            </div>
            <CloseFooter />
          </>
        ) : (
          <Detail pokemon={detail.data} capture={capture} />
        )}
      </DialogContent>
    </Dialog>
  );
}
