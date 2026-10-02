import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { getUserId } from "@/app/lib/auth";
import { z } from "zod";

// Miroir du shape produit par /api/export (lignes Prisma brutes, pas les
// shapes de formulaire des routes POST) : les Decimal y arrivent en string,
// les dates en ISO string. On les revalide ici sans leur faire porter les
// règles de formulaire (ex. estimatedAmount > 0) pour pouvoir réimporter
// fidèlement une sauvegarde même si elle contient des valeurs à 0 ou nulles.
const decimalLike = z.union([z.string(), z.number()]).nullable().optional();

const importSchema = z.object({
  version: z.number().optional(),
  categories: z
    .array(
      z.object({
        id: z.string(),
        name: z.string().min(1),
        type: z.enum(["INCOME", "EXPENSE"]),
        color: z.string().nullable().optional(),
        icon: z.string().nullable().optional(),
      })
    )
    .default([]),
  reminders: z
    .array(
      z.object({
        id: z.string(),
        title: z.string().min(1),
        description: z.string().nullable().optional(),
        type: z.enum(["SUBSCRIPTION", "PURCHASE", "TASK", "ONLINE_PROGRAM", "OTHER"]),
        dueDate: z.string(),
        completedAt: z.string().nullable().optional(),
        status: z.enum(["PENDING", "DONE"]).default("PENDING"),
        estimatedAmount: decimalLike,
        categoryId: z.string().nullable().optional(),
        isRecurring: z.boolean().default(false),
        frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY", "CUSTOM"]).nullable().optional(),
        customIntervalDays: z.number().int().nullable().optional(),
        recurrenceEndDate: z.string().nullable().optional(),
        notifyTiming: z.enum(["REALTIME", "MORNING"]).default("REALTIME"),
        items: z
          .array(
            z.object({
              label: z.string().min(1),
              checked: z.boolean().default(false),
              order: z.number().int().default(0),
            })
          )
          .default([]),
      })
    )
    .default([]),
  notes: z
    .array(
      z.object({
        id: z.string(),
        title: z.string().min(1),
        content: z.string(),
        reminderId: z.string().nullable().optional(),
      })
    )
    .default([]),
  transactions: z
    .array(
      z.object({
        id: z.string(),
        type: z.enum(["INCOME", "EXPENSE"]),
        amount: decimalLike,
        currency: z.string().default("XOF"),
        date: z.string(),
        note: z.string().nullable().optional(),
        categoryId: z.string().nullable().optional(),
        reminderId: z.string().nullable().optional(),
      })
    )
    .default([]),
  budgets: z
    .array(
      z.object({
        id: z.string(),
        amount: decimalLike,
        type: z.enum(["MONTHLY", "CUSTOM"]).default("CUSTOM"),
        periodStart: z.string(),
        periodEnd: z.string(),
        alertLevel: z.number().int().nullable().optional(),
        alertSentAt: z.string().nullable().optional(),
        categoryId: z.string().nullable().optional(),
      })
    )
    .default([]),
  scheduleEvents: z
    .array(
      z.object({
        id: z.string(),
        title: z.string().min(1),
        description: z.string().nullable().optional(),
        dayOfWeek: z
          .enum(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"])
          .nullable()
          .optional(),
        specificDate: z.string().nullable().optional(),
        startTime: z.string(),
        endTime: z.string().nullable().optional(),
        color: z.string().nullable().optional(),
        isActive: z.boolean().default(true),
      })
    )
    .default([]),
  recipes: z
    .array(
      z.object({
        id: z.string(),
        title: z.string().min(1),
        description: z.string().nullable().optional(),
        servings: z.number().int().nullable().optional(),
        prepTime: z.number().int().nullable().optional(),
        cookTime: z.number().int().nullable().optional(),
        difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).nullable().optional(),
        estimatedCost: decimalLike,
        photoUrl: z.string().nullable().optional(),
        noteId: z.string().nullable().optional(),
        ingredients: z
          .array(
            z.object({
              name: z.string().min(1),
              quantity: z.number().nullable().optional(),
              unit: z.string().nullable().optional(),
            })
          )
          .default([]),
        steps: z
          .array(
            z.object({
              order: z.number().int(),
              instruction: z.string().min(1),
              duration: z.number().int().nullable().optional(),
            })
          )
          .default([]),
        accessories: z.array(z.object({ name: z.string().min(1) })).default([]),
      })
    )
    .default([]),
});

// POST /api/import
// Réimporte une sauvegarde produite par /api/export sous le compte connecté.
// Additif (ne supprime ni ne remplace rien) : chaque ligne est recréée avec
// un nouvel id propre à cet utilisateur, les références croisées (catégorie,
// rappel, note) sont remappées des anciens ids vers les nouveaux. Les
// catégories sont dédupliquées par (nom, type) pour ne pas en recréer une
// identique à chaque import.
export async function POST(req: NextRequest) {
  const userId = getUserId(req);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Fichier JSON invalide" }, { status: 400 });
  }

  const parsed = importSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;

  const counts = await prisma.$transaction(async (tx) => {
    const categoryIdMap = new Map<string, string>();
    const reminderIdMap = new Map<string, string>();
    const noteIdMap = new Map<string, string>();

    for (const c of data.categories) {
      const existing = await tx.category.findUnique({
        where: { userId_name_type: { userId, name: c.name, type: c.type } },
      });
      if (existing) {
        categoryIdMap.set(c.id, existing.id);
      } else {
        const created = await tx.category.create({
          data: { name: c.name, type: c.type, color: c.color, icon: c.icon, userId },
        });
        categoryIdMap.set(c.id, created.id);
      }
    }

    for (const r of data.reminders) {
      const created = await tx.reminder.create({
        data: {
          title: r.title,
          description: r.description,
          type: r.type,
          dueDate: new Date(r.dueDate),
          completedAt: r.completedAt ? new Date(r.completedAt) : null,
          status: r.status,
          estimatedAmount: r.estimatedAmount ?? null,
          categoryId: r.categoryId ? categoryIdMap.get(r.categoryId) ?? null : null,
          isRecurring: r.isRecurring,
          frequency: r.frequency,
          customIntervalDays: r.customIntervalDays,
          recurrenceEndDate: r.recurrenceEndDate ? new Date(r.recurrenceEndDate) : null,
          notifyTiming: r.notifyTiming,
          // Toujours reparti de 0 : les paliers déjà envoyés ne concernent
          // que l'ancien compte, le nouveau n'a jamais reçu ces pushs.
          sentStages: 0,
          userId,
          items: r.items.length
            ? { create: r.items.map((i) => ({ label: i.label, checked: i.checked, order: i.order })) }
            : undefined,
        },
      });
      reminderIdMap.set(r.id, created.id);
    }

    for (const n of data.notes) {
      const created = await tx.note.create({
        data: {
          title: n.title,
          content: n.content,
          reminderId: n.reminderId ? reminderIdMap.get(n.reminderId) ?? null : null,
          userId,
        },
      });
      noteIdMap.set(n.id, created.id);
    }

    if (data.transactions.length) {
      await tx.transaction.createMany({
        data: data.transactions.map((t) => ({
          type: t.type,
          amount: t.amount ?? 0,
          currency: t.currency,
          date: new Date(t.date),
          note: t.note,
          categoryId: t.categoryId ? categoryIdMap.get(t.categoryId) ?? null : null,
          reminderId: t.reminderId ? reminderIdMap.get(t.reminderId) ?? null : null,
          userId,
        })),
      });
    }

    if (data.budgets.length) {
      await tx.budget.createMany({
        data: data.budgets.map((b) => ({
          amount: b.amount ?? 0,
          type: b.type,
          periodStart: new Date(b.periodStart),
          periodEnd: new Date(b.periodEnd),
          // Idem sentStages : une alerte déjà envoyée sur l'ancien compte
          // ne doit pas empêcher le nouveau de recevoir la sienne.
          alertLevel: null,
          alertSentAt: null,
          categoryId: b.categoryId ? categoryIdMap.get(b.categoryId) ?? null : null,
          userId,
        })),
      });
    }

    if (data.scheduleEvents.length) {
      await tx.scheduleEvent.createMany({
        data: data.scheduleEvents.map((e) => ({
          title: e.title,
          description: e.description,
          dayOfWeek: e.dayOfWeek,
          specificDate: e.specificDate ? new Date(e.specificDate) : null,
          startTime: e.startTime,
          endTime: e.endTime,
          color: e.color,
          isActive: e.isActive,
          userId,
        })),
      });
    }

    for (const r of data.recipes) {
      await tx.recipe.create({
        data: {
          title: r.title,
          description: r.description,
          servings: r.servings,
          prepTime: r.prepTime,
          cookTime: r.cookTime,
          difficulty: r.difficulty,
          estimatedCost: r.estimatedCost ?? null,
          photoUrl: r.photoUrl,
          noteId: r.noteId ? noteIdMap.get(r.noteId) ?? null : null,
          userId,
          ingredients: r.ingredients.length ? { create: r.ingredients } : undefined,
          steps: r.steps.length ? { create: r.steps } : undefined,
          accessories: r.accessories.length ? { create: r.accessories } : undefined,
        },
      });
    }

    return {
      categories: data.categories.length,
      reminders: data.reminders.length,
      notes: data.notes.length,
      transactions: data.transactions.length,
      budgets: data.budgets.length,
      scheduleEvents: data.scheduleEvents.length,
      recipes: data.recipes.length,
    };
  }, { timeout: 30000 });

  return NextResponse.json({ ok: true, counts });
}
