import { getChecklistPokemon } from "@/lib/checklist";

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
