import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import webpush from "web-push";
import dayjs from "dayjs";

webpush.setVapidDetails(
  "mailto:ton@email.com",
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

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

  type Sub = { endpoint: string; p256dh: string; auth: string };
  type RemItem = { title: string; dueDate: Date };
  const byUser = new Map<string, { subs: Sub[]; items: RemItem[] }>();
  for (const r of reminders) {
    const entry =
      byUser.get(r.userId) ??
      { subs: r.user.pushSubscriptions as Sub[], items: [] };
    entry.items.push({ title: r.title, dueDate: r.dueDate });
    entry.subs = r.user.pushSubscriptions as Sub[];
    byUser.set(r.userId, entry);
  }

  let sent = 0;
  for (const { subs, items } of byUser.values()) {
    if (subs.length === 0) continue;
    const body = items
      .map((r) => `• ${r.title} (${dayjs(r.dueDate).format("HH:mm")})`)
      .join("\n");
    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify({ title: "Résumé du jour", body })
        );
        sent++;
      } catch (err) {
        const code =
          err && typeof err === "object" && "statusCode" in err
            ? (err as { statusCode?: number }).statusCode
            : undefined;
        if (code === 404 || code === 410) {
          await prisma.pushSubscription
            .delete({ where: { endpoint: sub.endpoint } })
            .catch(() => {});
        } else {
          console.error("Échec envoi push:", err);
        }
      }
    }
  }

  return NextResponse.json({ digest: sent });
}
