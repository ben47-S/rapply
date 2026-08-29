import { serverFetch } from "@/app/lib/server-fetch";
import Link from "next/link";
import { SettingsIcon } from "@/app/components/IconButton";

const TICKETS = [
  { key: "upcoming", label: "à venir (7j)" },
  { key: "overdue", label: "en retard" },
  { key: "doneThisMonth", label: "faits ce mois" },
  { key: "totalActive", label: "actifs" },
] as const;

export default async function DashboardPage() {
  const stats = await serverFetch("/api/stats");

  return (
    <div>
      <Link
        href="/parametres"
        aria-label="Paramètres"
        className="fixed top-3 right-3 z-50 text-muted hover:text-parchment md:hidden"
      >
        <SettingsIcon className="w-5 h-5" />
      </Link>

      <h1 className="font-display text-2xl text-parchment mb-6">Tableau de bord</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {TICKETS.map((t) => (
          <div
            key={t.key}
            className="relative bg-surface border border-border-log rounded-md px-4 py-5 overflow-hidden"
          >
            <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-ink border border-border-log" />
            <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-ink border border-border-log" />
            <p className="text-[11px] uppercase tracking-widest text-muted mb-1">{t.label}</p>
            <p className="font-mono-log text-3xl text-parchment">{stats[t.key]}</p>
          </div>
        ))}
      </div>

      <p className="text-sm text-muted">
        Consulte l'onglet <span className="text-brass">Rappels</span> pour voir le détail de chaque entrée.
      </p>
    </div>
  );
}