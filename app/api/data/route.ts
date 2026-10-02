import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { getUserId } from "@/app/lib/auth";

// DELETE /api/data
// Vide toutes les données de l'utilisateur sans supprimer le compte (contrairement
// à `pnpm create-user delete`, qui supprime aussi le User). Les enfants
// (ReminderItem, Ingredient/Step/Accessory) partent en cascade via les
// contraintes FK de la base, donc deleteMany sur le parent suffit — pas
// besoin de les cibler eux-mêmes.
// Budget -> Category est la seule paire en Cascade parmi ces modèles (les
// autres categoryId/reminderId/noteId sont en SetNull) : les budgets doivent
// donc être supprimés avant les catégories, sinon ils partiraient en cascade
// avec elles et le compte retourné pour "budgets" serait faussement à 0.
export async function DELETE(req: NextRequest) {
  const userId = getUserId(req);

  const [recipes, scheduleEvents, notes, reminders, transactions, budgets, categories] =
    await prisma.$transaction([
      prisma.recipe.deleteMany({ where: { userId } }),
      prisma.scheduleEvent.deleteMany({ where: { userId } }),
      prisma.note.deleteMany({ where: { userId } }),
      prisma.reminder.deleteMany({ where: { userId } }),
      prisma.transaction.deleteMany({ where: { userId } }),
      prisma.budget.deleteMany({ where: { userId } }),
      prisma.category.deleteMany({ where: { userId } }),
    ]);

  return NextResponse.json({
    ok: true,
    counts: {
      recipes: recipes.count,
      scheduleEvents: scheduleEvents.count,
      notes: notes.count,
      reminders: reminders.count,
      transactions: transactions.count,
      budgets: budgets.count,
      categories: categories.count,
    },
  });
}
