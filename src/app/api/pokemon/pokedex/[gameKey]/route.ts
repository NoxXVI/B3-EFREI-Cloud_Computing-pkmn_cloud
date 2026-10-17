import { games } from "@/data/games";
import { getPokedex } from "@/lib/pokeapi";

type Props = {
  params: Promise<{ gameKey: string }>;
};

export async function GET(request: Request, { params }: Props) {
  const { gameKey } = await params;
  const mode = new URL(request.url).searchParams.get("mode") ?? "regional";

  if (mode !== "regional" && mode !== "national") {
    return Response.json({ error: "Mode de Pokédex inconnu." }, { status: 400 });
  }

  // Le paramètre est la clé d'un jeu de `games.ts` (`red`, `yellow`…), pas un
  // slug PokeAPI libre : la route n'est donc pas un proxy ouvert vers
  // pokeapi.co, et la clé de cache reste bornée aux Pokédex connus.
  const game = games.find((jeu) => jeu.pokeApiIdString === gameKey);

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
