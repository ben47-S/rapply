import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { getUserId } from "@/app/lib/auth";

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

  if (body.categoryId) {
    const category = await prisma.category.findFirst({
      where: { id: body.categoryId, userId },
    });
    if (!category) {
      return NextResponse.json({ error: "Catégorie introuvable" }, { status: 400 });
    }
  }

  const updateData: any = { ...body };
  delete updateData.items;
  if (body.dueDate) {
    updateData.sentStages = 0;
    updateData.dueDate = new Date(body.dueDate);
  }
  if (body.recurrenceEndDate) {
    updateData.recurrenceEndDate = new Date(body.recurrenceEndDate);
  }

  const isTransitioningToDone = body.status === "DONE" && existing.status !== "DONE";
  const isReopening = body.status === "PENDING" && existing.status === "DONE";

  if (isTransitioningToDone) {
    updateData.completedAt = new Date();
  } else if (isReopening) {
    updateData.completedAt = null;
  }

  if (body.items && Array.isArray(body.items)) {
    await prisma.reminderItem.deleteMany({ where: { reminderId: id } });
    if (body.items.length > 0) {
      await prisma.reminderItem.createMany({
        data: body.items.map((item: { id?: string; label: string; checked?: boolean }, i: number) => ({
          label: item.label,
          checked: item.checked ?? false,
          order: i,
          reminderId: id,
        })),
      });
    }
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

  const amount = body.estimatedAmount !== undefined ? body.estimatedAmount : existing.estimatedAmount;
  const categoryId = body.categoryId !== undefined ? body.categoryId : existing.categoryId;

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