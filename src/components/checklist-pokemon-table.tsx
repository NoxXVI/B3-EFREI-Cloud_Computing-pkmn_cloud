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
import type { ChecklistPokemon } from "@/types/checklist";
import type { ModePokedex, PokedexEntry } from "@/types/pokemon";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

const sprite = (pokemonApiId: number) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonApiId}.png`;

type Etat = "tous" | "captures" | "non-captures" | "absents";

const ETATS: { valeur: Etat; libelle: string }[] = [
  { valeur: "tous", libelle: "Tous" },
  { valeur: "captures", libelle: "Capturés" },
  { valeur: "non-captures", libelle: "Non capturés" },
  { valeur: "absents", libelle: "Absents" },
];

/**
 * Le mode change la source de données, pas seulement les numéros : le régional
 * est le Pokédex du jeu, le national part du Pokédex national coupé à la
 * génération du jeu, donc générations précédentes incluses.
 */
const MODES: { valeur: ModePokedex; libelle: string }[] = [
  { valeur: "regional", libelle: "Régional" },
  { valeur: "national", libelle: "National" },
];

/** Insensible à la casse et aux accents : « Électrode » ⇄ « electrode ». */
function normaliser(valeur: string) {
  return valeur
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("fr");
}

/**
 * État d'une entrée : la modification locale prime sur la base.
 * `undefined` = aucune ligne, donc le Pokémon n'est pas dans la checklist.
 */
function etatDe(
  entree: PokedexEntry,
  modifs: Map<number, boolean>,
  index: Map<number, ChecklistPokemon>,
) {
  return modifs.get(entree.id) ?? index.get(entree.id)?.is_captured;
}

/**
 * Le tableau affiche tout le Pokédex du jeu (`game_key`), fusionné avec les
 * lignes de `checklist_pokemon` par id national.
 *
 * Trois états par ligne : pas de ligne du tout (le Pokémon n'est pas dans la
 * checklist), `is_captured = false`, `is_captured = true`. La case à cocher
 * écrit `is_captured` ; cocher une entrée absente crée la ligne, et décocher
 * une entrée absente revient simplement à l'état absent plutôt que de créer une
 * ligne « non capturé » que l'utilisateur n'a pas demandée.
 *
 * L'en-tête reste affiché pendant les chargements et les erreurs : c'est ce qui
 * permet de revenir en régional si le national ne se charge pas.
 */
export function ChecklistPokemonTable({
  checklistId,
  gameKey,
}: {
  checklistId: string;
  gameKey: string;
}) {
  const [recherche, setRecherche] = useState("");
  const [etat, setEtat] = useState<Etat>("tous");
  const [mode, setMode] = useState<ModePokedex>("regional");
  // Modifications en attente d'enregistrement, par id national.
  const [modifs, setModifs] = useState<Map<number, boolean>>(new Map());

  const dex = usePokedex(gameKey, mode);
  const lignes = useChecklistPokemon(checklistId);
  const enregistrement = useSaveChecklistPokemon(checklistId);

  const index = useMemo(() => {
    const parId = new Map<number, ChecklistPokemon>();

    for (const ligne of lignes.data ?? []) {
      parId.set(ligne.pokemon_api_id, ligne);
    }

    return parId;
  }, [lignes.data]);

  const affichees = useMemo(() => {
    const filtre = normaliser(recherche.trim());

    return (dex.data?.entries ?? [])
      .filter((entree) => {
        const actuel = etatDe(entree, modifs, index);

        if (etat === "captures" && actuel !== true) {
          return false;
        }

        if (etat === "non-captures" && actuel !== false) {
          return false;
        }

        if (etat === "absents" && actuel !== undefined) {
          return false;
        }

        if (!filtre) {
          return true;
        }

        // Recherche sur le nom, ou sur le numéro affiché — celui-là même que la
        // colonne N° montre à l'utilisateur.
        return (
          normaliser(entree.name).includes(filtre) ||
          String(entree.number) === filtre
        );
      })
      .sort((a, b) => a.number - b.number);
  }, [dex.data, index, modifs, etat, recherche]);

  const facettesActives =
    (etat === "tous" ? 0 : 1) + (mode === "regional" ? 0 : 1);

  const basculer = (entree: PokedexEntry, coche: boolean) => {
    setModifs((precedent) => {
      const suivant = new Map(precedent);
      const enBase = index.get(entree.id)?.is_captured;

      if (coche === enBase || (!coche && enBase === undefined)) {
        suivant.delete(entree.id);
      } else {
        suivant.set(entree.id, coche);
      }

      return suivant;
    });
  };

  const enregistrer = () => {
    enregistrement.mutate(
      [...modifs].map(([pokemonApiId, isCaptured]) => ({
        pokemonApiId,
        isCaptured,
      })),
      { onSuccess: () => setModifs(new Map()) },
    );
  };

  // L'erreur passe avant le test sur `data` : en cas d'échec, `data` est
  // indéfini et le tableau resterait bloqué sur « Chargement ».
  const erreur = dex.error ?? lignes.error;
  const chargement = !dex.data || !lignes.data;

  return (
    <section>
      <div className="flex flex-row gap-2 border-b p-2">
        <Input
          name="search"
          type="search"
          placeholder="Rechercher un Pokémon"
          value={recherche}
          onChange={(evenement) => setRecherche(evenement.target.value)}
        />
        <Popover>
          <PopoverTrigger render={<Button variant="outline" />}>
            <RiFilter3Line />
            Filtres
            {facettesActives > 0 && (
              <Badge variant="secondary">{facettesActives}</Badge>
            )}
          </PopoverTrigger>
          <PopoverContent>
            <fieldset className="flex flex-col gap-2">
              <legend className="text-muted-foreground text-xs font-medium">
                État
              </legend>
              <div className="flex flex-wrap gap-1">
                {ETATS.map((choix) => (
                  <Button
                    key={choix.valeur}
                    size="sm"
                    variant={etat === choix.valeur ? "secondary" : "outline"}
                    aria-pressed={etat === choix.valeur}
                    onClick={() => setEtat(choix.valeur)}
                  >
                    {choix.libelle}
                  </Button>
                ))}
              </div>
            </fieldset>
            <fieldset className="flex flex-col gap-2">
              <legend className="text-muted-foreground text-xs font-medium">
                Pokédex
              </legend>
              <div className="flex flex-wrap gap-1">
                {MODES.map((choix) => (
                  <Button
                    key={choix.valeur}
                    size="sm"
                    variant={mode === choix.valeur ? "secondary" : "outline"}
                    aria-pressed={mode === choix.valeur}
                    onClick={() => setMode(choix.valeur)}
                  >
                    {choix.libelle}
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
          onClick={enregistrer}
          disabled={modifs.size === 0 || enregistrement.isPending}
        >
          {enregistrement.isPending ? (
            <RiLoader4Line className="animate-spin" />
          ) : (
            <RiSaveLine />
          )}
          Enregistrer{modifs.size > 0 ? ` (${modifs.size})` : ""}
        </Button>
      </div>

      {enregistrement.isError && (
        <Alert variant="destructive" className="m-2">
          <RiErrorWarningLine />
          <AlertTitle>Enregistrement impossible</AlertTitle>
          <AlertDescription>
            {enregistrement.error.message} Vos modifications sont conservées :
            réessayez avec le bouton Enregistrer.
          </AlertDescription>
        </Alert>
      )}

      {erreur ? (
        <Alert variant="destructive" className="m-2">
          <RiErrorWarningLine />
          <AlertTitle>Impossible de charger les Pokémon</AlertTitle>
          <AlertDescription>{erreur.message}</AlertDescription>
        </Alert>
      ) : chargement ? (
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
      ) : affichees.length === 0 ? (
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
            {affichees.map((entree) => {
              const ligne = index.get(entree.id);
              const actuel = etatDe(entree, modifs, index);

              return (
                <TableRow key={entree.id}>
                  <TableCell>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={sprite(entree.id)}
                      alt=""
                      width={40}
                      height={40}
                      loading="lazy"
                    />
                  </TableCell>
                  <TableCell>{entree.number}</TableCell>
                  <TableCell className="capitalize">{entree.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={actuel ?? false}
                        disabled={enregistrement.isPending}
                        aria-label={`Capturé : ${entree.name}`}
                        onCheckedChange={(coche) => basculer(entree, coche)}
                      />
                      <span className="text-muted-foreground text-xs">
                        {actuel === undefined
                          ? "hors checklist"
                          : actuel
                            ? "capturé"
                            : "non capturé"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {ligne
                      ? new Date(ligne.updated_at).toLocaleDateString("fr-FR")
                      : ""}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </section>
  );
}
