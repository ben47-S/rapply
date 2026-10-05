import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { getUserId } from "@/app/lib/auth";
import { z } from "zod";

// Ids générés côté client (hors ligne) : le serveur les accepte pour que rejouer
// une création après une coupure réseau ne crée pas de doublon.
const clientId = z.string().regex(/^[A-Za-z0-9_-]{8,64}$/);

const reminderShape = {
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  type: z.enum(["SUBSCRIPTION", "PURCHASE", "TASK", "ONLINE_PROGRAM", "OTHER"]),
  startDate: z.string().datetime().optional().nullable(),
  dueDate: z.string().datetime(),
  estimatedAmount: z.number().positive().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  isRecurring: z.boolean().default(false),
  frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY", "CUSTOM"]).optional().nullable(),
  customIntervalDays: z.number().int().positive().optional().nullable(),
  recurrenceEndDate: z.string().datetime().optional().nullable(),
  notifyTiming: z.enum(["REALTIME", "MORNING"]).optional(),
  items: z.array(z.object({ id: clientId.optional(), label: z.string().min(1) })).optional(),
};

// Le refine reste hors de reminderShape : .partial() (utilisé par
// reminderPatchSchema juste en dessous) jette une exception sur un schéma
// portant un .refine() — même piège documenté pour scheduleEventShape.
const reminderSchema = z.object({ ...reminderShape, id: clientId.optional() }).refine(
  (data) => !data.startDate || new Date(data.startDate) <= new Date(data.dueDate),
  { message: "La date de début doit être avant ou égale à la date d'échéance", path: ["startDate"] }
);

export const reminderPatchSchema = z
  .object({
    ...reminderShape,
    isRecurring: z.boolean().optional(),
    items: z
      .array(
        z.object({
          id: z.string().optional(),
          label: z.string().min(1),
          checked: z.boolean().optional(),
        })
      )
      .optional(),
    status: z.enum(["PENDING", "DONE"]).optional(),
  })
  .partial();

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

  if (parsed.data.id) {
    const existing = await prisma.reminder.findUnique({
      where: { id: parsed.data.id },
      include: { category: true, items: { orderBy: { order: "asc" } } },
    });
    if (existing) {
      if (existing.userId !== userId) {
        return NextResponse.json({ error: "Identifiant déjà utilisé" }, { status: 409 });
      }
      return NextResponse.json(existing);
    }
  }

  const { items: parsedItems, ...rest } = parsed.data;

  const reminder = await prisma.reminder.create({
    data: {
      ...rest,
      startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : undefined,
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

  if (parsedItems && parsedItems.length > 0) {
    await prisma.reminderItem.createMany({
      data: parsedItems.map((item, i) => ({
        id: item.id,
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