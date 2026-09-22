import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { getUserId } from "@/app/lib/auth";

// PUT /api/reminders/:id/items/:itemId
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const { id, itemId } = await params;
  const userId = getUserId(req);
  const body = await req.json();

  const reminder = await prisma.reminder.findFirst({
    where: { id, userId },
  });
  if (!reminder) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  if (reminder.status === "DONE") {
    return NextResponse.json({ error: "Verrouillé" }, { status: 400 });
  }

  const item = await prisma.reminderItem.findFirst({
    where: { id: itemId, reminderId: id },
  });
  if (!item) {
    return NextResponse.json({ error: "Item introuvable" }, { status: 404 });
  }

  if (body.checked === false) {
    return NextResponse.json({ error: "Décochage impossible" }, { status: 400 });
  }

  await prisma.reminderItem.update({
    where: { id: itemId },
    data: { checked: true },
  });

  const allItems = await prisma.reminderItem.findMany({
    where: { reminderId: id },
  });

  if (allItems.length > 0 && allItems.every((i) => i.checked)) {
    const updated = await prisma.reminder.update({
      where: { id },
      data: { status: "DONE", completedAt: new Date() },
      include: { category: true, items: { orderBy: { order: "asc" } } },
    });

    if (updated.estimatedAmount) {
      await prisma.transaction.create({
        data: {
          type: "EXPENSE",
          amount: Number(updated.estimatedAmount),
          note: updated.title,
          userId,
          reminderId: updated.id,
          categoryId: updated.categoryId || undefined,
          date: new Date(),
        },
      });
    }

    return NextResponse.json(updated);
  }

  const reminderUpdated = await prisma.reminder.findFirst({
    where: { id },
    include: { category: true, items: { orderBy: { order: "asc" } } },
  });

  return NextResponse.json(reminderUpdated);
}
