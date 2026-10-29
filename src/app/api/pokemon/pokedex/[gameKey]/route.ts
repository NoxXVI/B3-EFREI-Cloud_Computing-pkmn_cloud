import { games } from "@/data/games";
import { getPokedex } from "@/lib/pokeapi";

type Props = {
  params: Promise<{ gameKey: string }>;
};

export async function GET(request: Request, { params }: Props) {
  const { gameKey } = await params;
  const mode = new URL(request.url).searchParams.get("mode") ?? "regional";

  if (mode !== "regional" && mode !== "national") {
    return Response.json(
      { error: "Mode de Pokédex inconnu." },
      { status: 400 },
    );
  }

  const game = games.find((game) => game.pokeApiIdString === gameKey);

  if (!game) {
    return Response.json({ error: "Jeu inconnu." }, { status: 404 });
  }

  try {
    const pokedex = await getPokedex(game, mode);

    return Response.json({ pokedex });
  } catch {
    return Response.json(
      { error: "Impossible de charger le Pokédex." },
      { status: 502 },
    );
  }
}
