"use client";

import { useState } from "react";
import Link from "next/link";
import dayjs from "@/app/lib/dayjs";

type Alert = {
  b: { id: string; name: string | null; amount: number; categoryId: string | null };
  spent: number;
  amount: number;
  pct: number;
};

export function DashboardBudgets({ alerts, currency }: { alerts: Alert[]; currency: string }) {
  const [open, setOpen] = useState(false);

  if (alerts.length === 0) {
    return (
      <section className="mb-10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-lg text-parchment">Budgets en alerte</h2>
          <Link href="/budgets" className="text-xs text-brass hover:underline">
            Tout voir
          </Link>
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
          onClick={() => setOpen(true)}
          className="font-display text-lg text-parchment hover:text-brass transition-colors text-left"
        >
          Budgets en alerte
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xs text-brass">{alerts.length}</span>
          <Link href="/budgets" className="text-xs text-brass hover:underline">
            Tout voir
          </Link>
        </div>
      </div>

      <div className="space-y-3">
        {alerts.map(({ b, spent, amount, pct }) => {
          const cat = b.categoryId ? null : null;
          return (
            <div
              key={b.id}
              className="block bg-surface border border-border-log rounded-md px-4 py-3 hover:border-brass transition-colors"
              onClick={() => setOpen(true)}
            >
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm text-parchment truncate">
                  {cat ? cat : "Global"}
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
            </div>
          );
        })}
      </div>

      {open && (
        <div
          className="pwa-sheet-overlay fixed inset-0 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4 z-50"
          onClick={() => setOpen(false)}
        >
          <div
            className="pwa-sheet w-full sm:max-w-md max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-lg bg-surface border-0 sm:border border-border-log p-4 text-parchment"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg text-parchment">Budgets en alerte</h2>
              <button
                onClick={() => setOpen(false)}
                aria-label="Fermer"
                className="text-muted hover:text-parchment text-sm"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3">
              {alerts.map(({ b, spent, amount, pct }) => (
                <Link
                  key={b.id}
                  href="/budgets"
                  className="block bg-ink rounded-md px-4 py-3 border border-border-log hover:border-brass"
                  onClick={() => setOpen(false)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm text-parchment truncate">
                      {b.name ?? "Global"}
                    </p>
                    <p className={`font-mono-log text-sm ${pct >= 100 ? "text-rust" : "text-muted"}`}>
                      {spent.toLocaleString("fr-FR")} / {amount.toLocaleString("fr-FR")} {currency}
                    </p>
                  </div>
                  <div className="h-2 rounded-full bg-surface-raised overflow-hidden">
                    <div
                      className={`h-full ${barColor(pct)}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
