"use client";

import { useEffect, useState } from "react";
import dayjs from "@/app/lib/dayjs";

type Alert = {
  b: {
    id: string;
    amount: number;
    categoryId: string | null;
    periodStart: string;
    periodEnd: string;
    category?: { name: string } | null;
  };
  spent: number;
  amount: number;
  pct: number;
};

export function DashboardBudgets({ alerts, currency }: { alerts: Alert[]; currency: string }) {
  const [open, setOpen] = useState<Alert | "all" | null>(null);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(null);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  if (alerts.length === 0) {
    return (
      <section className="mb-10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-lg text-parchment">Budgets en alerte</h2>
        </div>
        <p className="text-sm text-muted">Aucun budget en alerte (≥ 80 %).</p>
      </section>
    );
  }

  const barColor = (pct: number) => {
    if (pct >= 100) return "bg-rust";
    if (pct >= 95) return "bg-amber";
    if (pct >= 80) return "bg-brass";
    return "bg-teal-log";
  };

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setOpen("all")}
          className="font-display text-lg text-parchment hover:text-brass transition-colors text-left"
        >
          Budgets en alerte
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xs text-brass">{alerts.length}</span>
        </div>
      </div>

      <div className="space-y-3">
        {alerts.map((alert) => {
          const { b, spent, amount, pct } = alert;
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => setOpen(alert)}
              className="block w-full text-left bg-surface border border-border-log rounded-md px-4 py-3 hover:border-brass transition-colors"
            >
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm text-parchment truncate">
                  {b.category?.name ?? "Global"}
                </p>
                <p className={`font-mono-log text-sm ${pct >= 100 ? "text-rust" : "text-muted"}`}>
                  {spent.toLocaleString("fr-FR")} / {amount.toLocaleString("fr-FR")} {currency}
                </p>
              </div>
              <div className="h-2 rounded-full bg-ink overflow-hidden">
                <div
                  className={`h-full ${barColor(pct)}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </button>
          );
        })}
      </div>

      {open && (
        <div
          className="pwa-sheet-overlay fixed inset-0 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4"
          onClick={() => setOpen(null)}
        >
          <div
            className="pwa-sheet w-full sm:max-w-md max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-lg bg-surface border-0 sm:border border-border-log p-4 text-parchment"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="dashboard-budgets-sheet-title"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 id="dashboard-budgets-sheet-title" className="font-display text-lg text-parchment">
                {open === "all"
                  ? "Budgets en alerte"
                  : open.b.category?.name ?? "Budget global"}
              </h2>
              <button
                onClick={() => setOpen(null)}
                aria-label="Fermer"
                className="text-muted hover:text-parchment text-sm"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3">
              {(open === "all" ? alerts : [open]).map(({ b, spent, amount, pct }) => {
                const difference = amount - spent;
                const percentage = amount > 0 ? (spent / amount) * 100 : 0;

                return (
                  <div
                    key={b.id}
                    className="bg-ink rounded-md px-4 py-4 border border-border-log"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <h3 className="text-sm text-parchment font-medium">
                          {b.category?.name ?? "Budget global"}
                        </h3>
                        <p className="mt-1 text-xs text-muted">
                          {dayjs(b.periodStart).format("D MMM YYYY")} au {dayjs(b.periodEnd).format("D MMM YYYY")}
                        </p>
                      </div>
                      <span className={`font-mono-log text-xs shrink-0 ${pct >= 100 ? "text-rust" : "text-brass"}`}>
                        {Math.round(percentage)} %
                      </span>
                    </div>

                    <div className="h-2 rounded-full bg-surface-raised overflow-hidden">
                      <div
                        className={`h-full ${barColor(pct)}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    <dl className="grid grid-cols-2 gap-3 mt-4 text-sm">
                      <div>
                        <dt className="text-xs text-muted mb-1">Dépensé</dt>
                        <dd className="font-mono-log text-parchment">
                          {spent.toLocaleString("fr-FR")} {currency}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs text-muted mb-1">Budget prévu</dt>
                        <dd className="font-mono-log text-parchment">
                          {amount.toLocaleString("fr-FR")} {currency}
                        </dd>
                      </div>
                      <div className="col-span-2 border-t border-border-log pt-3">
                        <dt className="text-xs text-muted mb-1">
                          {difference >= 0 ? "Restant" : "Dépassement"}
                        </dt>
                        <dd className={`font-mono-log ${difference >= 0 ? "text-teal-log" : "text-rust"}`}>
                          {Math.abs(difference).toLocaleString("fr-FR")} {currency}
                        </dd>
                      </div>
                    </dl>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
