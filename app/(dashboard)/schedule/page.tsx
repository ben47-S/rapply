import { serverFetch } from "@/app/lib/server-fetch";

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
const DAY_LABELS: Record<string, string> = {
  MONDAY: "Lundi",
  TUESDAY: "Mardi",
  WEDNESDAY: "Mercredi",
  THURSDAY: "Jeudi",
  FRIDAY: "Vendredi",
  SATURDAY: "Samedi",
  SUNDAY: "Dimanche",
};

export default async function SchedulePage() {
  const events = await serverFetch("/api/schedule");

  return (
    <div>
      <h1 className="font-display text-2xl text-parchment mb-6">Emploi du temps</h1>

      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
        {DAYS.map((day) => {
          const dayEvents = events.filter((e: any) => e.dayOfWeek === day);
          return (
            <div key={day} className="bg-surface border border-border-log rounded-md p-3 min-h-[160px]">
              <p className="font-display text-sm text-brass mb-3">{DAY_LABELS[day]}</p>
              <div className="flex flex-col gap-2">
                {dayEvents.map((e: any) => (
                  <div key={e.id} className="border-l-2 border-brass pl-2">
                    <p className="font-mono-log text-[11px] text-muted">{e.startTime}</p>
                    <p className="text-sm text-parchment">{e.title}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}