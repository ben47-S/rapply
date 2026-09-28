import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { getUserId } from "@/app/lib/auth";
import { transactionPatchSchema } from "@/app/api/transactions/route";

// GET /api/transactions/:id
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const userId = getUserId(req);

  const transaction = await prisma.transaction.findFirst({
    where: { id: id, userId },
    include: { category: true, reminder: true },
  });

  if (!transaction) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  return NextResponse.json(transaction);
}

// PUT /api/transactions/:id
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const userId = getUserId(req);
  const body = await req.json();

  const existing = await prisma.transaction.findFirst({
    where: { id: id, userId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  const parsed = transactionPatchSchema.safeParse(body);
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

  if (parsed.data.reminderId) {
    const reminder = await prisma.reminder.findFirst({
      where: { id: parsed.data.reminderId, userId },
    });
    if (!reminder) {
      return NextResponse.json({ error: "Rappel lié introuvable" }, { status: 400 });
    }
  }

  const updated = await prisma.transaction.update({
    where: { id: id },
    data: {
      ...parsed.data,
      date: parsed.data.date ? new Date(parsed.data.date) : undefined,
    },
  });

  return NextResponse.json(updated);
}

// DELETE /api/transactions/:id
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const userId = getUserId(req);

  const existing = await prisma.transaction.findFirst({
    where: { id: id, userId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  await prisma.transaction.delete({ where: { id: id } });

  return NextResponse.json({ success: true });
}