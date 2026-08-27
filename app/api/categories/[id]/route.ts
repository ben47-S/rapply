import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { getUserId } from "@/app/lib/auth";

// PUT /api/categories/:id
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const userId = getUserId(req);
  const body = await req.json();

  const existing = await prisma.category.findFirst({
    where: { id: id, userId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  const updated = await prisma.category.update({
    where: { id: id },
    data: body,
  });

  return NextResponse.json(updated);
}

// DELETE /api/categories/:id
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const userId = getUserId(req);

  const existing = await prisma.category.findFirst({
    where: { id: id, userId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  await prisma.category.delete({ where: { id: id } });

  return NextResponse.json({ success: true });
}