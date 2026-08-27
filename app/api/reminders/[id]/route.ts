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
    include: { notes: true },
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

  const updated = await prisma.reminder.update({
    where: { id: id },
    data: body,
  });

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