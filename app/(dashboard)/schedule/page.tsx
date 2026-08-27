import { serverFetch } from "@/app/lib/server-fetch";
import dayjs from "@/app/lib/dayjs";
import { ScheduleView } from "@/app/components/ScheduleView";
import { parseWeek, clampDays, rangeDates } from "@/app/lib/week";

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string; days?: string }>;
}) {
  const sp = await searchParams;
  const monday = parseWeek(sp.week);
  const days = clampDays(sp.days ? Number(sp.days) : undefined);
  const weekISO = monday.format("YYYY-MM-DD");

  const events = await serverFetch(`/api/schedule?weekStart=${weekISO}&days=${days}`);

  const dates = rangeDates(monday, days).map((d) => d.format("YYYY-MM-DD"));
  const rangeEnd = dayjs(dates[dates.length - 1]);

  return (
    <ScheduleView
      dates={dates}
      events={events}
      days={days}
      week={weekISO}
      rangeStartLabel={monday.format("D MMM")}
      rangeEndLabel={rangeEnd.format("D MMM YYYY")}
    />
  );
}
