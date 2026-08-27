import dayjs, { Dayjs } from "@/app/lib/dayjs";

export const DAYS = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
] as const;

export const MAX_DAYS = 7;

export function parseWeek(week?: string): Dayjs {
  if (week && dayjs(week, "YYYY-MM-DD", true).isValid()) {
    return dayjs(week, "YYYY-MM-DD", true);
  }
  return dayjs().isoWeekday(1).startOf("day");
}

export function clampDays(days?: number): number {
  const n = Number(days);
  if (!Number.isFinite(n)) return MAX_DAYS;
  return Math.min(Math.max(Math.round(n), 1), MAX_DAYS);
}

export function rangeDates(monday: Dayjs, days: number): Dayjs[] {
  return Array.from({ length: days }, (_, i) => monday.add(i, "day"));
}

function hoursOf(value?: string): number {
  if (!value) return 0;
  const [h, m] = value.split(":").map(Number);
  return (Number.isFinite(h) ? h : 0) + (Number.isFinite(m) ? m : 0) / 60;
}

export type Segment = {
  kind: "event" | "free";
  start: number;
  end: number;
  event?: any;
};

export function dayEventsFor(date: Dayjs, events: any[]): any[] {
  const wd = date.isoWeekday(); // 1 (lun) .. 7 (dim)
  const dayName = DAYS[wd - 1];
  const ds = date.format("YYYY-MM-DD");

  return events.filter((e) => {
    if (e.dayOfWeek) return e.dayOfWeek === dayName;
    if (e.specificDate) {
      return dayjs(e.specificDate).format("YYYY-MM-DD") === ds;
    }
    return false;
  });
}

export function buildSegments(events: any[]): Segment[] {
  if (events.length === 0) {
    return [{ kind: "free", start: 0, end: 24 }];
  }

  const items = events
    .map((e) => {
      const s = hoursOf(e.startTime);
      let en = e.endTime ? hoursOf(e.endTime) : s + 1;
      if (!(en > s)) en = s + 1;
      return { s, e: en, event: e };
    })
    .sort((a, b) => a.s - b.s);

  const segs: Segment[] = [];
  let cursor = 0;

  for (const it of items) {
    if (it.s > cursor) {
      segs.push({ kind: "free", start: cursor, end: it.s });
    }
    segs.push({ kind: "event", start: it.s, end: it.e, event: it.event });
    cursor = Math.max(cursor, it.e);
  }

  if (cursor < 24) {
    segs.push({ kind: "free", start: cursor, end: 24 });
  }

  return segs;
}
