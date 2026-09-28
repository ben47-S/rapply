import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { getUserId } from "@/app/lib/auth";
import { notePatchSchema } from "@/app/api/notes/route";

// GET /api/notes/:id
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const userId = getUserId(req);

  const note = await prisma.note.findFirst({
    where: { id: id, userId },
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
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const userId = getUserId(req);
  const body = await req.json();

  const existing = await prisma.note.findFirst({
    where: { id: id, userId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  const parsed = notePatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (parsed.data.reminderId) {
    const reminder = await prisma.reminder.findFirst({
      where: { id: parsed.data.reminderId, userId },
    });
    if (!reminder) {
      return NextResponse.json({ error: "Rappel lié introuvable" }, { status: 400 });
    }
  }

  const updated = await prisma.note.update({
    where: { id: id },
    data: parsed.data,
  });

  return NextResponse.json(updated);
}

// DELETE /api/notes/:id
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const userId = getUserId(req);

  const existing = await prisma.note.findFirst({
    where: { id: id, userId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  await prisma.note.delete({ where: { id: id } });

  return NextResponse.json({ success: true });
}