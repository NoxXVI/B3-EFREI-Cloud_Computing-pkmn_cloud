export function ChecklistCard({name, game}: {name: string, game: string}) {
  return (
    <article className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-6 shadow-md">
      <hgroup>
        <h2 className="text-lg font-semibold">{name}</h2>
        <p className="text-sm text-gray-500">{game}</p>
      </hgroup>
    </article>
  );
}
