import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { getUserId } from "@/app/lib/auth";

export async function GET(req: NextRequest) {
  const userId = getUserId(req);

  const [user, categories, reminders, notes, transactions, budgets, scheduleEvents, recipes] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          currency: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.category.findMany({
        where: { userId },
        orderBy: { name: "asc" },
      }),
      prisma.reminder.findMany({
        where: { userId },
        orderBy: { dueDate: "asc" },
        include: { items: { orderBy: { order: "asc" } } },
      }),
      prisma.note.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.transaction.findMany({
        where: { userId },
        orderBy: { date: "desc" },
      }),
      prisma.budget.findMany({
        where: { userId },
        orderBy: { periodStart: "desc" },
      }),
      prisma.scheduleEvent.findMany({
        where: { userId },
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
      }),
      prisma.recipe.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        include: {
          ingredients: true,
          steps: { orderBy: { order: "asc" } },
          accessories: true,
        },
      }),
    ]);

  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);

  const exportPayload = {
    version: 1,
    exportedAt: now.toISOString(),
    user,
    categories,
    reminders,
    notes,
    transactions,
    budgets,
    scheduleEvents,
    recipes,
  };

  return new NextResponse(JSON.stringify(exportPayload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="rapply-backup-${dateStr}.json"`,
    },
  });
}
