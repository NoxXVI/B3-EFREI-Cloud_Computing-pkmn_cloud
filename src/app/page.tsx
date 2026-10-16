"use client";

import { usePokemon } from "@/hooks/pokemon";

export default function Home() {
  const { data, isPending, isError, error } = usePokemon("national");

  if (isPending) return <p>Chargement...</p>;

  if (isError) return <p>Erreur : {error.message}</p>;

  return (
    <div className="w-full flex flex-col flex-1 items-center justify-center background font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <h1 className="text-2xl font-bold capitalize">{data.name}</h1>
        <p>{data.pokemon_entries?.length ?? 0} Pokémon</p>
      </main>
    </div>
  );
}
