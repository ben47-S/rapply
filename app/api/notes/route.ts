import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { getUserId } from "@/app/lib/auth";
import { z } from "zod";

const noteSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  reminderId: z.string().optional(),
});

// GET /api/notes
export async function GET(req: NextRequest) {
  const userId = getUserId(req);

  const { searchParams } = new URL(req.url);
  const reminderId = searchParams.get("reminderId");
  const search = searchParams.get("search");

  const notes = await prisma.note.findMany({
    where: {
      userId,
      ...(reminderId ? { reminderId } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { content: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(notes);
}

// POST /api/notes
export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  const body = await req.json();

  const parsed = noteSchema.safeParse(body);
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

  const note = await prisma.note.create({
    data: { ...parsed.data, userId },
  });

  return NextResponse.json(note, { status: 201 });
}