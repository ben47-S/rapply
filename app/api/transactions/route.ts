import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { getUserId } from "@/app/lib/auth";
import { z } from "zod";

const transactionSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]),
  amount: z.number().positive(),
  currency: z.string().default("XOF"),
  date: z.string().datetime().optional(),
  note: z.string().optional(),
  categoryId: z.string().optional(),
  reminderId: z.string().optional(),
});

// GET /api/transactions
export async function GET(req: NextRequest) {
  const userId = getUserId(req);

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");           // ?type=EXPENSE
  const categoryId = searchParams.get("categoryId");
  const from = searchParams.get("from");            // ?from=2026-01-01
  const to = searchParams.get("to");                // ?to=2026-01-31

  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      ...(type ? { type: type as "INCOME" | "EXPENSE" } : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(from || to
        ? {
            date: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {}),
    },
    include: { category: true },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(transactions);
}

// POST /api/transactions
export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  const body = await req.json();

  const parsed = transactionSchema.safeParse(body);
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

  const transaction = await prisma.transaction.create({
    data: {
      ...parsed.data,
      date: parsed.data.date ? new Date(parsed.data.date) : undefined,
      userId,
    },
  });

  return NextResponse.json(transaction, { status: 201 });
}