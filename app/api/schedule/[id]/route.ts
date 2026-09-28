import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { getUserId } from "@/app/lib/auth";
import { scheduleEventPatchSchema, endAfterStart } from "@/app/api/schedule/route";

// GET /api/schedule/:id
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const userId = getUserId(req);

  const event = await prisma.scheduleEvent.findFirst({
    where: { id: id, userId },
  });

  if (!event) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  return NextResponse.json(event);
}

// PUT /api/schedule/:id
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const userId = getUserId(req);
  const body = await req.json();

  const existing = await prisma.scheduleEvent.findFirst({
    where: { id: id, userId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  const parsed = scheduleEventPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // un PUT partiel ne peut pas re-vérifier la paire qu'il ne reçoit pas : on
  // compare au startTime déjà stocké, sinon une durée inversée resterait
  // stockable via PUT.
  const effectiveStart = parsed.data.startTime ?? existing.startTime;
  const effectiveEnd = parsed.data.endTime !== undefined ? parsed.data.endTime : existing.endTime;
  if (!endAfterStart(effectiveStart, effectiveEnd)) {
    return NextResponse.json(
      { error: "L'heure de fin doit être postérieure à l'heure de début" },
      { status: 400 }
    );
  }

  const updated = await prisma.scheduleEvent.update({
    where: { id: id },
    data: {
      ...parsed.data,
      specificDate: parsed.data.specificDate
        ? new Date(parsed.data.specificDate)
        : undefined,
    },
  });

  return NextResponse.json(updated);
}

// DELETE /api/schedule/:id
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const userId = getUserId(req);

  const existing = await prisma.scheduleEvent.findFirst({
    where: { id: id, userId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  await prisma.scheduleEvent.delete({ where: { id: id } });

  return NextResponse.json({ success: true });
}