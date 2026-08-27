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
  // Protéger cette route avec un secret partagé (cron externe), pas le middleware user
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const now = new Date();
  const in10Min = dayjs().add(10, "minute").toDate();

  const dueReminders = await prisma.reminder.findMany({
    where: { status: "PENDING", dueDate: { gte: now, lte: in10Min } },
    include: { user: { include: { pushSubscriptions: true } } },
  });

  for (const reminder of dueReminders) {
    for (const sub of reminder.user.pushSubscriptions) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify({ title: reminder.title, body: reminder.description ?? "Rappel" })
        );
      } catch (err) {
        console.error("Échec envoi push:", err);
      }
    }
  }

  return NextResponse.json({ sent: dueReminders.length });
}