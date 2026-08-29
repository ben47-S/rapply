import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import webpush from "web-push";
import dayjs from "dayjs";
import { windowStart, stagesFor } from "@/app/lib/recurrence";

webpush.setVapidDetails(
  "mailto:ton@email.com",
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

type Sub = { endpoint: string; p256dh: string; auth: string };
type PushPayload = { title: string; body: string };

function statusOf(e: unknown): number | undefined {
  if (e && typeof e === "object" && "statusCode" in e) {
    return (e as { statusCode?: number }).statusCode;
  }
  return undefined;
}

async function sendTo(subscriptions: Sub[], payload: PushPayload) {
  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload)
      );
    } catch (err) {
      if (statusOf(err) === 404 || statusOf(err) === 410) {
        await prisma.pushSubscription
          .delete({ where: { endpoint: sub.endpoint } })
          .catch(() => {});
      } else {
        console.error("Échec envoi push:", err);
      }
    }
  }
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const now = dayjs();
  const from = now.subtract(1, "minute").toDate();
  const to = now.add(365, "day").toDate();

  let remindersSent = 0;
  let budgetsSent = 0;

  // ---- Rappels (temps réel) ----
  const reminders = await prisma.reminder.findMany({
    where: {
      status: "PENDING",
      notifyTiming: "REALTIME",
      dueDate: { gte: from, lte: to },
    },
    include: { user: { include: { pushSubscriptions: true } } },
  });

  for (const r of reminders) {
    const like = {
      type: r.type,
      frequency: r.frequency,
      customIntervalDays: r.customIntervalDays,
      dueDate: r.dueDate,
      recurrenceEndDate: r.recurrenceEndDate,
      isRecurring: r.isRecurring,
      createdAt: r.createdAt,
    };
    const start = windowStart(like);
    const durMs = dayjs(r.dueDate).diff(start);
    if (durMs <= 0) continue;
    const stages = stagesFor(durMs);

    let bits = r.sentStages ?? 0;
    let highestUnset = -1;
    const passed: number[] = [];
    for (let i = 0; i < stages.length; i++) {
      const t = start.add((stages[i] / 100) * durMs, "millisecond");
      if (now.isAfter(t) || now.isSame(t)) {
        passed.push(i);
        if (!(bits & (1 << i)) && i > highestUnset) highestUnset = i;
      }
    }
    if (highestUnset >= 0) {
      if (r.user.pushSubscriptions.length > 0) {
        await sendTo(r.user.pushSubscriptions, {
          title: r.title,
          body: r.description || "Rappel",
        });
        remindersSent++;
      }
      for (const i of passed) bits |= 1 << i;
      await prisma.reminder.update({
        where: { id: r.id },
        data: { sentStages: bits },
      });
    }
  }

  // ---- Budgets (seuils 80/95/100 % par période) ----
  const budgets = await prisma.budget.findMany({
    where: { periodStart: { lte: now.toDate() }, periodEnd: { gte: now.toDate() } },
    include: { user: { include: { pushSubscriptions: true } }, category: true },
  });

  for (const b of budgets) {
    const subs = b.user.pushSubscriptions;
    if (subs.length === 0) continue;

    const agg = await prisma.transaction.aggregate({
      where: {
        userId: b.userId,
        date: { gte: b.periodStart, lte: b.periodEnd },
        ...(b.categoryId ? { categoryId: b.categoryId } : { type: "EXPENSE" }),
      },
      _sum: { amount: true },
    });
    const spent = Number(agg._sum.amount ?? 0);
    const amount = Number(b.amount);
    const pct = amount > 0 ? (spent / amount) * 100 : 0;

    const crossed =
      pct >= 100 ? 100 : pct >= 95 ? 95 : pct >= 80 ? 80 : 0;
    if (!crossed) continue;

    const newPeriod = !b.alertSentAt || dayjs(b.alertSentAt).isBefore(b.periodStart);
    const already = newPeriod ? 0 : b.alertLevel ?? 0;
    if (crossed <= already) continue;

    const name = b.category ? b.category.name : "Global";
    await sendTo(subs, {
      title: `Budget ${name}`,
      body: `À ${Math.round(pct)} % (${spent.toLocaleString("fr-FR")} / ${amount.toLocaleString("fr-FR")} ${b.user.currency})`,
    });
    budgetsSent++;
    await prisma.budget.update({
      where: { id: b.id },
      data: { alertLevel: crossed, alertSentAt: now.toDate() },
    });
  }

  return NextResponse.json({ reminders: remindersSent, budgets: budgetsSent });
}
