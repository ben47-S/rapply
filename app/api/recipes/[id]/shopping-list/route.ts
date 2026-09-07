import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { getUserId } from "@/app/lib/auth";
import dayjs from "@/app/lib/dayjs";

// POST /api/recipes/:id/shopping-list
// Génère un rappel PURCHASE (liste de courses) à partir d'une recette.
// estimatedAmount est pré-rempli avec le coût estimé de la recette,
// ce qui reboucle avec le système de transaction automatique au passage en DONE.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const userId = getUserId(req);

  const recipe = await prisma.recipe.findFirst({
    where: { id: id, userId },
    include: { ingredients: true },
  });
  if (!recipe) {
    return NextResponse.json({ error: "Recette introuvable" }, { status: 404 });
  }

  const description =
    recipe.ingredients.length > 0
      ? recipe.ingredients
          .map((i) => {
            const qty =
              i.quantity != null
                ? Number(i.quantity).toLocaleString("fr-FR")
                : null;
            const unit = i.unit?.trim() || null;
            const parts = [qty, unit, i.name.trim()].filter(Boolean).join(" ");
            return `- ${parts}`;
          })
          .join("\n")
      : null;

  const reminder = await prisma.reminder.create({
    data: {
      title: `Liste de courses : ${recipe.title}`,
      description,
      type: "PURCHASE",
      dueDate: dayjs().endOf("day").toDate(),
      estimatedAmount: recipe.estimatedCost ?? undefined,
      isRecurring: false,
      userId,
    },
  });

  return NextResponse.json(reminder, { status: 201 });
}
