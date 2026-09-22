import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { getUserId } from "@/app/lib/auth";
import { z } from "zod";

const reminderSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  type: z.enum(["SUBSCRIPTION", "PURCHASE", "TASK", "ONLINE_PROGRAM", "OTHER"]),
  dueDate: z.string().datetime(),
  estimatedAmount: z.number().positive().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  isRecurring: z.boolean().default(false),
  frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY", "CUSTOM"]).optional().nullable(),
  customIntervalDays: z.number().int().positive().optional().nullable(),
  recurrenceEndDate: z.string().datetime().optional().nullable(),
  notifyTiming: z.enum(["REALTIME", "MORNING"]).optional(),
  items: z.array(z.object({ label: z.string().min(1) })).optional(),
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
    include: {
      category: true,
      items: { orderBy: { order: "asc" } },
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

  if (parsed.data.categoryId) {
    const category = await prisma.category.findFirst({
      where: { id: parsed.data.categoryId, userId },
    });
    if (!category) {
      return NextResponse.json({ error: "Catégorie introuvable" }, { status: 400 });
    }
  }

  const reminder = await prisma.reminder.create({
    data: {
      ...parsed.data,
      dueDate: new Date(parsed.data.dueDate),
      estimatedAmount: parsed.data.estimatedAmount ?? undefined,
      categoryId: parsed.data.categoryId ?? undefined,
      recurrenceEndDate: parsed.data.recurrenceEndDate
        ? new Date(parsed.data.recurrenceEndDate)
        : undefined,
      userId,
    },
    include: {
      category: true,
      items: { orderBy: { order: "asc" } },
    },
  });

  if (parsed.data.items && parsed.data.items.length > 0) {
    await prisma.reminderItem.createMany({
      data: parsed.data.items.map((item, i) => ({
        label: item.label,
        order: i,
        reminderId: reminder.id,
      })),
    });
    const items = await prisma.reminderItem.findMany({
      where: { reminderId: reminder.id },
      orderBy: { order: "asc" },
    });
    return NextResponse.json({ ...reminder, items }, { status: 201 });
  }

  return NextResponse.json(reminder, { status: 201 });
}