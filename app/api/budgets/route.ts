import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { getUserId } from "@/app/lib/auth";
import { z } from "zod";

const budgetShape = {
  amount: z.number().positive(),
  type: z.enum(["MONTHLY", "CUSTOM"]).default("CUSTOM"),
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
  categoryId: z.string().optional(),
};

const budgetSchema = z.object(budgetShape);

export const budgetPatchSchema = z
  .object({ ...budgetShape, type: z.enum(["MONTHLY", "CUSTOM"]).optional() })
  .partial();

type Period = { categoryId: string | null; periodStart: Date; periodEnd: Date };

const DAY_MS = 86400000;

// periodStart/periodEnd sont des jours calendaires stockés à un instant UTC fixe
// (voir la section "Serialization & dates" de AGENTS.md) : on borne donc la plage
// sur les journées UTC elles-mêmes, pas sur l'instant stocké.
function utcDayStart(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function spentQuery(b: Period, userId: string) {
  return prisma.transaction.aggregate({
    where: {
      userId,
      date: {
        gte: utcDayStart(b.periodStart),
        lt: new Date(utcDayStart(b.periodEnd).getTime() + DAY_MS),
      },
      ...(b.categoryId ? { categoryId: b.categoryId } : { type: "EXPENSE" as const }),
    },
    _sum: { amount: true },
  });
}

export async function spentFor(b: Period, userId: string): Promise<number> {
  const agg = await spentQuery(b, userId);
  return Number(agg._sum.amount ?? 0);
}

// GET /api/budgets
export async function GET(req: NextRequest) {
  const userId = getUserId(req);

  const budgets = await prisma.budget.findMany({
    where: { userId },
    include: { category: true },
    orderBy: { periodStart: "desc" },
  });

  const totals = await Promise.all(
    budgets.map((b) => spentQuery(b, userId).then((a) => Number(a._sum.amount ?? 0)))
  );

  return NextResponse.json(budgets.map((b, i) => ({ ...b, spent: totals[i] })));
}

// POST /api/budgets
export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  const body = await req.json();

  const parsed = budgetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const budget = await prisma.budget.create({
    data: {
      ...parsed.data,
      periodStart: new Date(parsed.data.periodStart),
      periodEnd: new Date(parsed.data.periodEnd),
      userId,
    },
  });

  return NextResponse.json({ ...budget, spent: await spentFor(budget, userId) }, { status: 201 });
}