import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import dayjs from "dayjs";
import { sendPushToMany } from "@/app/lib/push";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const start = dayjs().startOf("day").toDate();
  const end = dayjs().endOf("day").toDate();

  const reminders = await prisma.reminder.findMany({
    where: {
      status: "PENDING",
      notifyTiming: "MORNING",
      dueDate: { gte: start, lte: end },
    },
    include: { user: { include: { pushSubscriptions: true } } },
    orderBy: { dueDate: "asc" },
  });

  type RemItem = { title: string; dueDate: Date };
  const byUser = new Map<string, { subs: typeof reminders[number]["user"]["pushSubscriptions"]; items: RemItem[] }>();
  for (const r of reminders) {
    const entry =
      byUser.get(r.userId) ??
      { subs: r.user.pushSubscriptions, items: [] };
    entry.items.push({ title: r.title, dueDate: r.dueDate });
    entry.subs = r.user.pushSubscriptions;
    byUser.set(r.userId, entry);
  }

  let sent = 0;
  for (const { subs, items } of byUser.values()) {
    if (subs.length === 0) continue;
    const body = items
      .map((r) => `• ${r.title} (${dayjs(r.dueDate).format("HH:mm")})`)
      .join("\n");
    sent += await sendPushToMany(subs, {
      title: "Résumé du jour",
      body,
    });
  }

  return NextResponse.json({ digest: sent });
}
