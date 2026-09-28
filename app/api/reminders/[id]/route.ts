import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { getUserId } from "@/app/lib/auth";
import { reminderPatchSchema } from "@/app/api/reminders/route";

// GET /api/reminders/:id
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const userId = getUserId(req);

  const reminder = await prisma.reminder.findFirst({
    where: { id: id, userId },
    include: { notes: true, category: true, items: { orderBy: { order: "asc" } } },
  });

  if (!reminder) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  return NextResponse.json(reminder);
}

// PUT /api/reminders/:id
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const userId = getUserId(req);
  const body = await req.json();

  const existing = await prisma.reminder.findFirst({
    where: { id: id, userId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  const parsed = reminderPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (parsed.data.categoryId) {
    const category = await prisma.category.findFirst({
      where: { id: parsed.data.categoryId, userId },
    });
    if (!category) {
      return NextResponse.json({ error: "Catégorie introuvable" }, { status: 400 });
    }
  }

  const updateData: any = { ...parsed.data };
  delete updateData.items;
  if (parsed.data.dueDate) {
    updateData.sentStages = 0;
    updateData.dueDate = new Date(parsed.data.dueDate);
  }
  if (parsed.data.recurrenceEndDate) {
    updateData.recurrenceEndDate = new Date(parsed.data.recurrenceEndDate);
  }

  const isTransitioningToDone = parsed.data.status === "DONE" && existing.status !== "DONE";
  const isReopening = parsed.data.status === "PENDING" && existing.status === "DONE";

  if (isTransitioningToDone) {
    updateData.completedAt = new Date();
  } else if (isReopening) {
    updateData.completedAt = null;
  }

  if (parsed.data.items && Array.isArray(parsed.data.items)) {
    // Diff plutôt que deleteMany + createMany : les ids des items conservés
    // restent stables, et l'opération est atomique (avant, un createMany en
    // échec après le deleteMany perdait silencieusement tous les items).
    const current = await prisma.reminderItem.findMany({ where: { reminderId: id } });
    const currentIds = new Set(current.map((i) => i.id));
    // un id inconnu de ce rappel retombe sur un create : impossible d'écrire
    // dans un autre rappel malgré un id forgé dans le corps
    const kept = new Set(
      parsed.data.items
        .map((i) => i.id)
        .filter((i): i is string => !!i && currentIds.has(i))
    );

    const remove =
      kept.size > 0
        ? prisma.reminderItem.deleteMany({
            where: { reminderId: id, id: { notIn: [...kept] } },
          })
        : prisma.reminderItem.deleteMany({ where: { reminderId: id } });

    await prisma.$transaction([
      remove,
      ...parsed.data.items.map((item, i) =>
        item.id && currentIds.has(item.id)
          ? prisma.reminderItem.update({
              where: { id: item.id },
              data: {
                label: item.label,
                checked: item.checked ?? false,
                order: i,
              },
            })
          : prisma.reminderItem.create({
              data: {
                label: item.label,
                checked: item.checked ?? false,
                order: i,
                reminderId: id,
              },
            })
      ),
    ]);
  }

  const updated = await prisma.reminder.update({
    where: { id: id },
    data: updateData,
    include: {
      category: true,
      items: { orderBy: { order: "asc" } },
    },
  });

  if (updated.items.length > 0 && updated.items.every((i) => i.checked) && existing.status !== "DONE") {
    const final = await prisma.reminder.update({
      where: { id: id },
      data: { status: "DONE", completedAt: new Date() },
      include: { category: true, items: { orderBy: { order: "asc" } } },
    });

    if (final.estimatedAmount) {
      await prisma.transaction.create({
        data: {
          type: "EXPENSE",
          amount: Number(final.estimatedAmount),
          note: final.title,
          userId,
          reminderId: final.id,
          categoryId: final.categoryId || undefined,
          date: new Date(),
        },
      });
    }

    return NextResponse.json(final);
  }

  const amount =
    parsed.data.estimatedAmount !== undefined
      ? parsed.data.estimatedAmount
      : existing.estimatedAmount;
  const categoryId =
    parsed.data.categoryId !== undefined ? parsed.data.categoryId : existing.categoryId;

  if (isTransitioningToDone && amount) {
    await prisma.transaction.create({
      data: {
        type: "EXPENSE",
        amount: Number(amount),
        note: existing.title,
        userId,
        reminderId: existing.id,
        categoryId: categoryId || undefined,
        date: new Date(),
      },
    });
  }

  return NextResponse.json(updated);
}

// DELETE /api/reminders/:id
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const userId = getUserId(req);

  const existing = await prisma.reminder.findFirst({
    where: { id: id, userId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  await prisma.reminder.delete({ where: { id: id } });

  return NextResponse.json({ success: true });
}