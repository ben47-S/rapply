import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { getUserId } from "@/app/lib/auth";
import { z } from "zod";

const budgetSchema = z.object({
  amount: z.number().positive(),
  type: z.enum(["MONTHLY", "CUSTOM"]).default("CUSTOM"),
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
  categoryId: z.string().optional(),
});

// GET /api/budgets
export async function GET(req: NextRequest) {
  const userId = getUserId(req);

  const budgets = await prisma.budget.findMany({
    where: { userId },
    include: { category: true },
    orderBy: { periodStart: "desc" },
  });

  return NextResponse.json(budgets);
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

  return NextResponse.json(budget, { status: 201 });
}