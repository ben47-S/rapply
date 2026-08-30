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
    include: { notes: true, category: true },
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

  const updated = await prisma.reminder.update({
    where: { id: id },
    data: updateData,
    include: {
      category: true,
    },
  });

  // Création automatique de la transaction si montant estimé et transition vers DONE
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