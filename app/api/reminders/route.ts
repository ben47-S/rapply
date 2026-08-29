import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { getUserId } from "@/app/lib/auth";
import { z } from "zod";

const reminderSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(["SUBSCRIPTION", "PURCHASE", "TASK", "ONLINE_PROGRAM", "OTHER"]),
  dueDate: z.string().datetime(),
  isRecurring: z.boolean().default(false),
  frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY", "CUSTOM"]).optional(),
  customIntervalDays: z.number().int().positive().optional(),
  recurrenceEndDate: z.string().datetime().optional(),
});

// GET /api/reminders
export async function GET(req: NextRequest) {
  const userId = getUserId(req);

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const type = searchParams.get("type");

  const reminders = await prisma.reminder.findMany({
    where: {
      userId,
      ...(status ? { status: status as "PENDING" | "DONE" } : {}),
      ...(type ? { type: type as any } : {}),
    },
    orderBy: { dueDate: "asc" },
  });

  return NextResponse.json(reminders);
}

// POST /api/reminders
export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  const body = await req.json();

  const parsed = reminderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const reminder = await prisma.reminder.create({
    data: {
      ...parsed.data,
      dueDate: new Date(parsed.data.dueDate),
      recurrenceEndDate: parsed.data.recurrenceEndDate
        ? new Date(parsed.data.recurrenceEndDate)
        : undefined,
      userId,
    },
  });

  return NextResponse.json(reminder, { status: 201 });
}