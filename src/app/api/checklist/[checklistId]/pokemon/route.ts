import { getChecklistPokemon, saveChecklistPokemon } from "@/lib/checklist";

type Props = {
  params: Promise<{ checklistId: string }>;
};

export async function GET(_request: Request, { params }: Props) {
  const { checklistId } = await params;

  try {
    const pokemon = await getChecklistPokemon(checklistId);

    return Response.json({ pokemon });
  } catch {
    return Response.json(
      { error: "Impossible de charger les Pokémon." },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request, { params }: Props) {
  const { checklistId } = await params;

  let corps: unknown;

  try {
    corps = await request.json();
  } catch {
    return Response.json(
      { error: "Corps de requête invalide." },
      { status: 400 },
    );
  }

  const { rows } = (corps ?? {}) as { rows?: unknown };

  if (!Array.isArray(rows) || rows.length === 0) {
    return Response.json(
      { error: "Aucune ligne à enregistrer." },
      { status: 400 },
    );
  }

  const lignes: { pokemonApiId: number; isCaptured: boolean }[] = [];

  for (const ligne of rows) {
    const { pokemonApiId, isCaptured } = (ligne ?? {}) as {
      pokemonApiId?: unknown;
      isCaptured?: unknown;
    };

    if (
      typeof pokemonApiId !== "number" ||
      !Number.isInteger(pokemonApiId) ||
      pokemonApiId <= 0 ||
      typeof isCaptured !== "boolean"
    ) {
      return Response.json({ error: "Ligne invalide." }, { status: 400 });
    }

    lignes.push({ pokemonApiId, isCaptured });
  }

  try {
    const pokemon = await saveChecklistPokemon(checklistId, lignes);

    if (!pokemon) {
      return Response.json({ error: "Non authentifié." }, { status: 401 });
    }

    return Response.json({ pokemon });
  } catch {
    return Response.json(
      { error: "Impossible d'enregistrer les Pokémon." },
      { status: 500 },
    );
  }
}
