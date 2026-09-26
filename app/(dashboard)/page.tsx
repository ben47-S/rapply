import { serverFetch } from "@/app/lib/server-fetch";
import { PageLayout } from "@/app/components/PageLayout";
import { DashboardBudgets } from "@/app/components/DashboardBudgets";
import Link from "next/link";
import dayjs from "@/app/lib/dayjs";

const TICKETS = [
  { key: "upcoming", label: "à venir (7j)" },
  { key: "overdue", label: "en retard" },
  { key: "doneThisMonth", label: "faits ce mois" },
  { key: "totalActive", label: "actifs" },
] as const;

const DOW = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

async function safe<T>(p: Promise<T>, fallback: T): Promise<T> {
  try {
    return await p;
  } catch {
    return fallback;
  }
}

function spentFor(b: any, transactions: any[]): number {
  const start = dayjs(b.periodStart).startOf("day");
  const end = dayjs(b.periodEnd).endOf("day");
  return transactions
    .filter((t: any) => {
      const d = dayjs(t.date);
      if (d.isBefore(start) || d.isAfter(end)) return false;
      if (b.categoryId) return t.categoryId === b.categoryId;
      return t.type === "EXPENSE";
    })
    .reduce((s: number, t: any) => s + Number(t.amount), 0);
}

export default async function DashboardPage() {
  const now = dayjs();
  const todayDow = DOW[now.day()];
  const startOfToday = now.startOf("day");
  const endOfToday = now.endOf("day");

  const [user, stats, transactions, budgets, reminders, notes, schedule] =
    await Promise.all([
      safe(serverFetch("/api/user"), { currency: "XOF" }),
      safe(serverFetch("/api/stats"), {
        upcoming: 0,
        overdue: 0,
        doneThisMonth: 0,
        totalActive: 0,
      }),
      safe(serverFetch("/api/transactions"), []),
       safe(serverFetch("/api/budgets"), []),
       safe(serverFetch("/api/reminders"), []),
      safe(serverFetch("/api/notes"), []),
      safe(serverFetch("/api/schedule"), []),
    ]);

  const currency = (user as any).currency ?? "XOF";
  const txs = transactions as any[];
  const bgs = budgets as any[];
  const rms = reminders as any[];
  const nts = notes as any[];

  const monthTx = txs.filter((t) => dayjs(t.date).isSame(now, "month"));
  const income = monthTx
    .filter((t) => t.type === "INCOME")
    .reduce((s: number, t: any) => s + Number(t.amount), 0);
  const expense = monthTx
    .filter((t) => t.type === "EXPENSE")
    .reduce((s: number, t: any) => s + Number(t.amount), 0);
  const solde = income - expense;

  const alerts = bgs
    .map((b) => {
      const spent = spentFor(b, txs);
      const amount = Number(b.amount);
      const pct = amount > 0 ? Math.min(100, (spent / amount) * 100) : 0;
      return { b, spent, amount, pct };
    })
    .filter((x) => x.pct >= 80)
    .sort((a, b) => b.pct - a.pct);

  const todaySchedule = (schedule as any[]).filter((e) => {
    if (e.specificDate) return dayjs(e.specificDate).isSame(now, "day");
    return e.dayOfWeek === todayDow;
  });

  const todayReminders = rms
    .filter(
      (r) =>
        r.status === "PENDING" &&
        dayjs(r.dueDate).isAfter(startOfToday.subtract(1, "millisecond")) &&
        dayjs(r.dueDate).isBefore(endOfToday)
    )
    .sort((a, b) => dayjs(a.dueDate).valueOf() - dayjs(b.dueDate).valueOf());

  const upcoming = rms
    .filter((r) => r.status === "PENDING" && dayjs(r.dueDate).isAfter(endOfToday))
    .sort((a, b) => dayjs(a.dueDate).valueOf() - dayjs(b.dueDate).valueOf())
    .slice(0, 5);

  const recentNotes = nts.slice(0, 3);

  return (
    <PageLayout title="Tableau de bord">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-12 sm:mb-12 md:mb-6 overflow-x-auto">
        {TICKETS.map((t) => (
          <div
            key={t.key}
            className="relative bg-surface border border-border-log rounded-md px-3 py-3 sm:px-4 sm:py-5 overflow-hidden"
          >
            <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-ink border border-border-log" />
            <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-ink border border-border-log" />
            <p className="text-[11px] uppercase tracking-widest text-muted mb-1">{t.label}</p>
            <p className="font-mono-log text-2xl sm:text-3xl text-parchment">
              {(stats as any)[t.key]}
            </p>
          </div>
        ))}
      </div>

      <section className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-lg text-parchment">Finances du mois</h2>
          <Link href="/finances" className="text-xs text-brass hover:underline">
            Tout voir
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-surface border border-border-log rounded-md px-4 py-5">
            <p className="text-[11px] uppercase tracking-widest text-muted mb-1">Entrées</p>
            <p className="font-mono-log text-xl sm:text-2xl text-teal-log truncate">
              +{income.toLocaleString("fr-FR")} {currency}
            </p>
          </div>
          <div className="bg-surface border border-border-log rounded-md px-4 py-5">
            <p className="text-[11px] uppercase tracking-widest text-muted mb-1">Dépenses</p>
            <p className="font-mono-log text-xl sm:text-2xl text-rust truncate">
              -{expense.toLocaleString("fr-FR")} {currency}
            </p>
          </div>
          <div className="bg-surface border border-border-log rounded-md px-4 py-5">
            <p className="text-[11px] uppercase tracking-widest text-muted mb-1">Solde</p>
            <p
              className={`font-mono-log text-xl sm:text-2xl truncate ${
                solde >= 0 ? "text-teal-log" : "text-rust"
              }`}
            >
              {solde >= 0 ? "+" : "-"}
              {Math.abs(solde).toLocaleString("fr-FR")} {currency}
            </p>
          </div>
        </div>
      </section>

      <DashboardBudgets alerts={alerts} currency={currency} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-6 mb-6">
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg text-parchment">Aujourd&apos;hui</h2>
            <Link href="/schedule" className="text-xs text-brass hover:underline">
              Planning
            </Link>
          </div>
          <div className="space-y-2">
            <div>
              <p className="text-[11px] uppercase tracking-widest text-muted mb-2">Planning</p>
              {todaySchedule.length === 0 ? (
                <p className="text-sm text-muted">Rien de prévu aujourd&apos;hui.</p>
              ) : (
                <ul className="space-y-1">
                  {todaySchedule.map((e: any) => (
                    <li
                      key={e.id}
                      className="flex items-center gap-2 text-sm text-parchment"
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: e.color || "#888" }}
                      />
                      <span className="font-mono-log text-xs text-muted w-20 shrink-0">
                        {e.startTime}
                      </span>
                      <span className="truncate">{e.title}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-widest text-muted mb-2">Rappels</p>
              {todayReminders.length === 0 ? (
                <p className="text-sm text-muted">Aucun rappel aujourd&apos;hui.</p>
              ) : (
                <ul className="space-y-1">
                  {todayReminders.map((r: any) => (
                    <li
                      key={r.id}
                      className="flex items-center gap-2 text-sm text-parchment"
                    >
                      <span className="font-mono-log text-xs text-muted w-20 shrink-0">
                        {dayjs(r.dueDate).format("HH:mm")}
                      </span>
                      <span className="truncate">{r.title}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg text-parchment">Prochains rappels</h2>
            <Link href="/reminders" className="text-xs text-brass hover:underline">
              Tout voir
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted">Aucun rappel à venir.</p>
          ) : (
            <ul className="space-y-1">
              {upcoming.map((r: any) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between text-sm text-parchment border-b border-border-log pb-1"
                >
                  <span className="truncate">{r.title}</span>
                  <span className="font-mono-log text-xs text-muted shrink-0 ml-3">
                    {dayjs(r.dueDate).format("D MMM YYYY")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-lg text-parchment">Notes récentes</h2>
          <Link href="/notes" className="text-xs text-brass hover:underline">
            Tout voir
          </Link>
        </div>
        {recentNotes.length === 0 ? (
          <p className="text-sm text-muted">Aucune note pour le moment.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {recentNotes.map((n: any) => (
              <Link
                key={n.id}
                href="/notes"
                className="bg-surface border border-border-log rounded-md p-4 hover:border-brass"
              >
                <p className="text-parchment truncate mb-1">{n.title}</p>
                <p className="text-sm text-muted line-clamp-2">{n.content}</p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </PageLayout>
  );
}
