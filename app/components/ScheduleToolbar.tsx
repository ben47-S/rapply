"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import dayjs from "@/app/lib/dayjs";

const RANGES = [1, 2, 3, 5, 7];

function Spinner() {
  return (
    <span
      className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent"
      aria-hidden
    />
  );
}

export function ScheduleToolbar({ week, days }: { week: string; days: number }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const base = dayjs(week, "YYYY-MM-DD", true);
  const prev = base.subtract(days, "day");
  const next = base.add(days, "day");
  const today = dayjs().startOf("day");
  const todayAnchor = days === 7 ? today.isoWeekday(1) : today;

  const q = (d: dayjs.Dayjs, n: number) =>
    `/schedule?week=${d.format("YYYY-MM-DD")}&days=${n}`;

  const navigate = (href: string) => {
    startTransition(() => router.push(href));
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex rounded border border-border-log overflow-hidden">
        {RANGES.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => navigate(q(base, r))}
            disabled={isPending}
            className={`px-2.5 py-1 text-xs transition-colors disabled:cursor-wait disabled:opacity-60 ${
              r === days
                ? "bg-surface-raised text-parchment"
                : "text-muted hover:text-parchment"
            }`}
          >
            {r}j
          </button>
        ))}
      </div>

      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => navigate(q(prev, days))}
          disabled={isPending}
          className="px-2.5 py-1 text-xs border border-border-log rounded text-muted hover:text-parchment disabled:cursor-wait disabled:opacity-60"
          aria-label="Précédent"
        >
          {isPending ? <Spinner /> : "‹"}
        </button>
        <button
          type="button"
          onClick={() => navigate(q(todayAnchor, days))}
          disabled={isPending}
          className="px-2.5 py-1 text-xs border border-border-log rounded text-muted hover:text-parchment disabled:cursor-wait disabled:opacity-60"
        >
          {isPending ? <Spinner /> : "Aujourd'hui"}
        </button>
        <button
          type="button"
          onClick={() => navigate(q(next, days))}
          disabled={isPending}
          className="px-2.5 py-1 text-xs border border-border-log rounded text-muted hover:text-parchment disabled:cursor-wait disabled:opacity-60"
          aria-label="Suivant"
        >
          {isPending ? <Spinner /> : "›"}
        </button>
      </div>
    </div>
  );
}
