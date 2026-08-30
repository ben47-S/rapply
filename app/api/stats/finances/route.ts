import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { getUserId } from "@/app/lib/auth";
import dayjs from "@/app/lib/dayjs";

export async function GET(req: NextRequest) {
  const userId = getUserId(req);

  const startOfMonth = dayjs().startOf("month").toDate();
  const endOfMonth = dayjs().endOf("month").toDate();
  const sixMonthsAgo = dayjs().subtract(5, "month").startOf("month").toDate();

  const [monthIncome, monthExpense, byCategory, monthlyTrend] = await Promise.all([
    prisma.transaction.aggregate({
      where: { userId, type: "INCOME", date: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { userId, type: "EXPENSE", date: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { amount: true },
    }),
    prisma.transaction.groupBy({
      by: ["categoryId", "type"],
      where: { userId, date: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { amount: true },
    }),
    prisma.transaction.findMany({
      where: { userId, date: { gte: sixMonthsAgo } },
      select: { amount: true, type: true, date: true },
    }),
  ]);

  // Résoudre les noms et couleurs des catégories
  const categoryIds = byCategory.map((c) => c.categoryId).filter(Boolean) as string[];
  const categories = await prisma.category.findMany({
    where: { id: { in: categoryIds } },
  });
  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  const byCategoryFormatted = byCategory.map((c) => {
    const cat = c.categoryId ? categoryMap.get(c.categoryId) : null;
    return {
      categoryId: c.categoryId,
      categoryName: cat ? cat.name : "Sans catégorie",
      color: cat?.color ?? null,
      type: c.type,
      total: Number(c._sum.amount ?? 0),
    };
  });

  // Regrouper la tendance par mois
  const trendByMonth = new Map<string, { income: number; expense: number }>();
  for (let i = 5; i >= 0; i--) {
    const key = dayjs().subtract(i, "month").format("YYYY-MM");
    trendByMonth.set(key, { income: 0, expense: 0 });
  }
  for (const t of monthlyTrend) {
    const key = dayjs(t.date).format("YYYY-MM");
    const entry = trendByMonth.get(key);
    if (!entry) continue;
    if (t.type === "INCOME") entry.income += Number(t.amount);
    else entry.expense += Number(t.amount);
  }

  const incomeTotal = Number(monthIncome._sum.amount ?? 0);
  const expenseTotal = Number(monthExpense._sum.amount ?? 0);

  return NextResponse.json({
    monthIncome: incomeTotal,
    monthExpense: expenseTotal,
    balance: incomeTotal - expenseTotal,
    byCategory: byCategoryFormatted,
    trend: Array.from(trendByMonth.entries()).map(([month, v]) => ({ month, ...v })),
  });
}
