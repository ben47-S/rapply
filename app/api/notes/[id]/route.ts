import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { getUserId } from "@/app/lib/auth";

// GET /api/notes/:id
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = getUserId(req);

  const note = await prisma.note.findFirst({
    where: { id: params.id, userId },
    include: { reminder: true },
  });

  if (!note) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  return NextResponse.json(note);
}

// PUT /api/notes/:id
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = getUserId(req);
  const body = await req.json();

  const existing = await prisma.note.findFirst({
    where: { id: params.id, userId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  const updated = await prisma.note.update({
    where: { id: params.id },
    data: body,
  });

  return NextResponse.json(updated);
}

// DELETE /api/notes/:id
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = getUserId(req);

  const existing = await prisma.note.findFirst({
    where: { id: params.id, userId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  await prisma.note.delete({ where: { id: params.id } });

  return NextResponse.json({ success: true });
}