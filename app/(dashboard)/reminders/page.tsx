import { serverFetch } from "@/app/lib/server-fetch";
import { StatusStamp } from "@/app/components/StatusStamp";

export default async function RemindersPage() {
  const reminders = await serverFetch("/api/reminders");

  return (
    <div>
      <h1 className="font-display text-2xl text-parchment mb-6">Rappels</h1>

      <div className="border-l border-border-log pl-6">
        {reminders.map((r: any) => (
          <div key={r.id} className="relative pb-6">
            <div className="absolute -left-[29px] top-1.5 w-2.5 h-2.5 rounded-full bg-brass" />
            <div className="flex items-center justify-between bg-surface border border-border-log rounded-md px-4 py-3">
              <div className="min-w-0">
                <p className="font-mono-log text-xs text-muted mb-1">
                  {new Date(r.dueDate).toLocaleDateString("fr-FR")} · {r.type}
                </p>
                <p className="text-parchment truncate">{r.title}</p>
              </div>
              <StatusStamp status={r.status} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}