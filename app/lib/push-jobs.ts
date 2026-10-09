import prisma from "@/app/lib/prisma";
import dayjs from "dayjs";
import { windowStart, stagesFor } from "@/app/lib/recurrence";
import { sendPushToMany } from "@/app/lib/push";

export async function runRealtimePushJob(): Promise<{
  reminders: number;
  budgets: number;
}> {
  const now = dayjs();
  const to = now.add(365, "day").toDate();

  let remindersSent = 0;
  let budgetsSent = 0;

  // ---- Rappels (temps réel) ----
  // Pas de borne basse sur dueDate : un cron toutes les 3 min ne doit pas
  // perdre un rappel en retard de plus d'1 min — sentStages < 7 (3 bits, tous
  // les paliers envoyés) suffit à arrêter de le re-sélectionner une fois fait.
  const reminders = await prisma.reminder.findMany({
    where: {
      status: "PENDING",
      notifyTiming: "REALTIME",
      dueDate: { lte: to },
      sentStages: { lt: 7 },
    },
    include: { user: { include: { pushSubscriptions: true } } },
  });

  for (const r of reminders) {
    const like = {
      type: r.type,
      frequency: r.frequency,
      customIntervalDays: r.customIntervalDays,
      startDate: r.startDate,
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
      // Ne marque les paliers "envoyés" que si au moins un envoi a vraiment
      // réussi — sinon (aucun abonnement, ou échec webpush) on laisse les
      // bits intacts pour retenter au prochain cron, au lieu de brûler le
      // palier pour de bon.
      let sent = 0;
      if (r.user.pushSubscriptions.length > 0) {
        sent = await sendPushToMany(r.user.pushSubscriptions, {
          title: r.title,
          body:
            r.type === "PURCHASE"
              ? "Liste de courses à faire"
              : r.description || "Rappel",
        });
      }
      if (sent > 0) {
        remindersSent++;
        for (const i of passed) bits |= 1 << i;
        await prisma.reminder.update({
          where: { id: r.id },
          data: { sentStages: bits },
        });
      }
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
    await sendPushToMany(subs, {
      title: `Budget ${name}`,
      body: `À ${Math.round(pct)} % (${spent.toLocaleString("fr-FR")} / ${amount.toLocaleString("fr-FR")} ${b.user.currency})`,
    });
    budgetsSent++;
    await prisma.budget.update({
      where: { id: b.id },
      data: { alertLevel: crossed, alertSentAt: now.toDate() },
    });
  }

  return { reminders: remindersSent, budgets: budgetsSent };
}

export async function runDigestJob(): Promise<{ digest: number }> {
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
  const byUser = new Map<
    string,
    { subs: (typeof reminders)[number]["user"]["pushSubscriptions"]; items: RemItem[] }
  >();
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

  return { digest: sent };
}
