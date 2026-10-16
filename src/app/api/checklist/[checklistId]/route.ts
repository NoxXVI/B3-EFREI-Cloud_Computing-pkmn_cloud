import { getChecklistById } from "@/lib/checklist";

type Props = {
  params: Promise<{ checklistId: string }>;
};

export async function GET(_request: Request, { params }: Props) {
  const { checklistId } = await params;

  try {
    const checklist = await getChecklistById(checklistId);

    if (!checklist) {
      return Response.json(
        { error: "Checklist introuvable." },
        { status: 404 },
      );
    }

    return Response.json({ checklist });
  } catch {
    return Response.json(
      { error: "Impossible de charger la checklist." },
      { status: 500 },
    );
  }
}
