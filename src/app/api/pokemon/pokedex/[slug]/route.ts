type Props = {
  params: Promise<{ slug: string }>;
};

export async function GET(request: Request, { params }: Props) {
  const { slug } = await params;

  return fetch(`https://pokeapi.co/api/v2/pokedex/${encodeURIComponent(slug)}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Erreur lors du chargement du Pokémon");
      }
      return response.json();
    })
    .then((data) => {
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      });
    });
}
