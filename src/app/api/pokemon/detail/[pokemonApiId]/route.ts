import { games } from "@/data/games";
import { getPokemonDetail } from "@/lib/pokemon-detail";

type Props = {
  params: Promise<{ pokemonApiId: string }>;
};

export async function GET(request: Request, { params }: Props) {
  const { pokemonApiId } = await params;
  const id = Number(pokemonApiId);

  if (!Number.isInteger(id) || id <= 0) {
    return Response.json(
      { error: "Identifiant de Pokémon invalide." },
      { status: 400 },
    );
  }

  const gameKey = new URL(request.url).searchParams.get("game");
  const game = games.find((game) => game.pokeApiIdString === gameKey);

  if (!game) {
    return Response.json({ error: "Jeu inconnu." }, { status: 400 });
  }

  try {
    const pokemon = await getPokemonDetail(id, game);

    if (!pokemon) {
      return Response.json({ error: "Pokémon inconnu." }, { status: 404 });
    }

    return Response.json({ pokemon });
  } catch {
    return Response.json(
      { error: "Impossible de charger ce Pokémon." },
      { status: 502 },
    );
  }
}
