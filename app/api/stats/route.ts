import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { getUserId } from "@/app/lib/auth";
import dayjs from "dayjs";

export async function GET(req: NextRequest) {
  const userId = getUserId(req);
  const now = new Date();
  const in7Days = dayjs().add(7, "day").toDate();
  const startOfMonth = dayjs().startOf("month").toDate();
  const endOfMonth = dayjs().endOf("month").toDate();

  const [upcoming, overdue, doneThisMonth, totalActive] = await Promise.all([
    prisma.reminder.count({
      where: { userId, status: "PENDING", dueDate: { gte: now, lte: in7Days } },
    }),
    prisma.reminder.count({
      where: { userId, status: "PENDING", dueDate: { lt: now } },
    }),
    prisma.reminder.count({
      where: {
        userId,
        status: "DONE",
        updatedAt: { gte: startOfMonth, lte: endOfMonth },
      },
    }),
    prisma.reminder.count({
      where: { userId, status: "PENDING" },
    }),
  ]);

  return NextResponse.json({ upcoming, overdue, doneThisMonth, totalActive });
}