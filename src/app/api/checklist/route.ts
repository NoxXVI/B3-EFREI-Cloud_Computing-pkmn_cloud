import { createChecklist, getChecklists } from "@/lib/checklist";

export async function GET() {
  try {
    const checklists = await getChecklists();

    return Response.json({ checklists });
  } catch {
    return Response.json(
      { error: "Impossible de charger les checklists." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  let corps: unknown;

  try {
    corps = await request.json();
  } catch {
    return Response.json(
      { error: "Corps de requête invalide." },
      { status: 400 },
    );
  }

  const { name, gameKey } = (corps ?? {}) as {
    name?: unknown;
    gameKey?: unknown;
  };

  if (
    typeof name !== "string" ||
    name.trim() === "" ||
    typeof gameKey !== "string" ||
    gameKey === ""
  ) {
    return Response.json(
      { error: "Le nom et le jeu sont obligatoires." },
      { status: 400 },
    );
  }

  try {
    const checklist = await createChecklist({ name: name.trim(), gameKey });

    if (!checklist) {
      return Response.json({ error: "Non authentifié." }, { status: 401 });
    }

    return Response.json({ checklist }, { status: 201 });
  } catch {
    return Response.json(
      { error: "Impossible de créer la checklist." },
      { status: 500 },
    );
  }
}
