"use client";

import Link from "next/link";
import dayjs from "@/app/lib/dayjs";

const RANGES = [1, 2, 3, 5, 7];

export function ScheduleToolbar({ week, days }: { week: string; days: number }) {
  const base = dayjs(week, "YYYY-MM-DD", true);
  const prev = base.subtract(days, "day");
  const next = base.add(days, "day");
  const today = dayjs().startOf("day");
  const todayAnchor = days === 7 ? today.isoWeekday(1) : today;

  const q = (d: dayjs.Dayjs, n: number) =>
    `/schedule?week=${d.format("YYYY-MM-DD")}&days=${n}`;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex rounded border border-border-log overflow-hidden">
        {RANGES.map((r) => (
          <Link
            key={r}
            href={q(base, r)}
            className={`px-2.5 py-1 text-xs transition-colors ${
              r === days
                ? "bg-surface-raised text-parchment"
                : "text-muted hover:text-parchment"
            }`}
          >
            {r}j
          </Link>
        ))}
      </div>

      <div className="flex gap-1">
        <Link
          href={q(prev, days)}
          className="px-2.5 py-1 text-xs border border-border-log rounded text-muted hover:text-parchment"
          aria-label="Précédent"
        >
          ‹
        </Link>
        <Link
          href={q(todayAnchor, days)}
          className="px-2.5 py-1 text-xs border border-border-log rounded text-muted hover:text-parchment"
        >
          Aujourd&apos;hui
        </Link>
        <Link
          href={q(next, days)}
          className="px-2.5 py-1 text-xs border border-border-log rounded text-muted hover:text-parchment"
          aria-label="Suivant"
        >
          ›
        </Link>
      </div>
    </div>
  );
}
