import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { getUserId } from "@/app/lib/auth";

// GET /api/budgets/:id
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = getUserId(req);

  const budget = await prisma.budget.findFirst({
    where: { id: params.id, userId },
    include: { category: true },
  });

  if (!budget) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  return NextResponse.json(budget);
}

// PUT /api/budgets/:id
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = getUserId(req);
  const body = await req.json();

  const existing = await prisma.budget.findFirst({
    where: { id: params.id, userId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  const updated = await prisma.budget.update({
    where: { id: params.id },
    data: body,
  });

  return NextResponse.json(updated);
}

// DELETE /api/budgets/:id
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = getUserId(req);

  const existing = await prisma.budget.findFirst({
    where: { id: params.id, userId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  await prisma.budget.delete({ where: { id: params.id } });

  return NextResponse.json({ success: true });
}