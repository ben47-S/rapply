"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import dayjs from "@/app/lib/dayjs";
import { ScheduleToolbar } from "@/app/components/ScheduleToolbar";
import {
  dayEventsFor,
  buildSegments,
} from "@/app/lib/week";

const DOW_ENUM = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
] as const;

const DAY_LABELS: Record<number, string> = {
  1: "Lundi",
  2: "Mardi",
  3: "Mercredi",
  4: "Jeudi",
  5: "Vendredi",
  6: "Samedi",
  7: "Dimanche",
};

const COLORS = ["#C89B3C", "#4C8577", "#B24B3E", "#3B82F6", "#8B5CF6"];

const toLine = (h: number) => Math.round(h * 2) + 1;

const toMin = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

function hasOverlap(
  cand: {
    mode: "recurrent" | "ponctuel";
    dayOfWeek?: string;
    specificDate?: string;
    startTime: string;
    endTime?: string;
  },
  existing: any[],
  excludeId?: string
): boolean {
  const cStart = toMin(cand.startTime);
  const cEnd = cand.endTime ? toMin(cand.endTime) : cStart + 60;
  const cIsRec = cand.mode === "recurrent";
  const cDow = cand.dayOfWeek;
  const cDate = cand.specificDate;

  for (const e of existing) {
    if (excludeId && e.id === excludeId) continue;
    const eStart = toMin(e.startTime);
    const eEnd = e.endTime ? toMin(e.endTime) : eStart + 60;

    let sameDay = false;
    if (cIsRec && e.dayOfWeek) {
      sameDay = e.dayOfWeek === cDow;
    } else if (cIsRec && e.specificDate) {
      sameDay =
        dayjs(e.specificDate).isoWeekday() === DOW_ENUM.indexOf(cDow as any) + 1;
    } else if (!cIsRec && e.specificDate) {
      sameDay = dayjs(e.specificDate).format("YYYY-MM-DD") === cDate;
    } else if (!cIsRec && e.dayOfWeek) {
      sameDay =
        DOW_ENUM.indexOf(e.dayOfWeek as any) + 1 === dayjs(cDate).isoWeekday();
    }
    if (!sameDay) continue;
    if (cStart < eEnd && eStart < cEnd) return true;
  }
  return false;
}

function readableText(hex?: string): string {
  if (!hex) return "var(--color-parchment)";
  let c = hex.replace("#", "");
  if (c.length === 3) c = c.split("").map((ch) => ch + ch).join("");
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? "#12161F" : "#ffffff";
}

function Spinner({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
      aria-hidden
    />
  );
}

export function ScheduleView({
  dates,
  events,
  days,
  week,
  rangeStartLabel,
  rangeEndLabel,
}: {
  dates: string[];
  events: any[];
  days: number;
  week: string;
  rangeStartLabel: string;
  rangeEndLabel: string;
}) {
  const router = useRouter();
  const [modal, setModal] = useState<{ open: boolean; editing: any | null }>({
    open: false,
    editing: null,
  });

  const openNew = (dateIso?: string) => {
    const d = dateIso ? dayjs(dateIso) : null;
    setModal({
      open: true,
      editing: {
        __new: true,
        title: "",
        description: "",
        mode: d ? "ponctuel" : "recurrent",
        dayOfWeek: d ? DOW_ENUM[d.isoWeekday() - 1] : "MONDAY",
        specificDate: "",
        startTime: "",
        endTime: "",
        color: "",
      },
    });
  };

  const openEdit = (event: any) => {
    setModal({
      open: true,
      editing: {
        ...event,
        __new: false,
        mode: event.specificDate ? "ponctuel" : "recurrent",
        specificDate: event.specificDate
          ? dayjs(event.specificDate).format("YYYY-MM-DD")
          : "",
        color: event.color ?? "",
      },
    });
  };

  const close = () => setModal({ open: false, editing: null });

  return (
    <div>
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <div className="flex items-center gap-5">
          <h1 className="font-display text-2xl text-parchment">Planning</h1>
          <button
            onClick={() => openNew()}
            aria-label="Ajouter un événement"
            className="flex h-6 w-6 items-center justify-center text-sm leading-none pb-px rounded-full border border-border-log text-parchment hover:bg-surface-raised"
          >
            +
          </button>
        </div>
        <ScheduleToolbar week={week} days={days} />
      </div>

      <p className="text-sm text-muted mb-4">
        Du {rangeStartLabel} au {rangeEndLabel}
      </p>

      <div className="overflow-x-auto">
        <div>
          <div className="flex gap-2 mb-2">
            <div className="shrink-0 w-9" />
            <div
              className="grid gap-2 flex-1"
              style={{ gridTemplateColumns: `repeat(${days}, minmax(150px, 1fr))` }}
            >
              {dates.map((d) => {
                const dt = dayjs(d);
                const isToday = dt.isSame(dayjs(), "day");
  return (
                  <button
                    key={d}
                    onClick={() => openNew(d)}
                    className={`text-center py-2 rounded cursor-pointer transition-colors ${
                      isToday
                        ? "bg-surface-raised text-parchment"
                        : "text-muted hover:bg-surface-raised"
                    }`}
                  >
                    <p className="text-[11px] uppercase tracking-wide">
                      {DAY_LABELS[dt.isoWeekday()]}
                    </p>
                    <p className="font-mono-log text-sm">{dt.format("D MMM")}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-2">
            <div
              className="shrink-0 w-9 grid gap-1"
              style={{ gridTemplateRows: "repeat(48, minmax(22px, 1fr))" }}
            >
              {Array.from({ length: 24 }).map((_, h) => (
                <div
                  key={h}
                  style={{ gridRow: `${h * 2 + 1} / ${h * 2 + 3}` }}
                  className="flex items-start justify-end pr-1 text-[10px] text-muted"
                >
                  {String(h).padStart(2, "0")}:00
                </div>
              ))}
            </div>

            <div
              className="grid gap-2 flex-1"
              style={{ gridTemplateColumns: `repeat(${days}, minmax(150px, 1fr))` }}
            >
              {dates.map((d) => (
                <DayColumn
                  key={d}
                  events={dayEventsFor(dayjs(d), events)}
                  onEventClick={openEdit}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {modal.open && (
        <EventModal
          event={modal.editing}
          events={events}
          onClose={close}
          onSaved={() => {
            close();
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function DayColumn({
  events,
  onEventClick,
}: {
  events: any[];
  onEventClick: (e: any) => void;
}) {
  const segs = buildSegments(events);

  return (
    <div
      className="grid gap-1 min-w-0 overflow-hidden"
      style={{ gridTemplateRows: "repeat(48, minmax(22px, 1fr))" }}
    >
      {segs.map((s, i) =>
        s.kind === "free" ? (
          <div
            key={i}
            style={{ gridRow: `${toLine(s.start)} / ${toLine(s.end)}` }}
            className="rounded bg-surface-raised border border-border-log px-2 py-1 text-[10px] text-muted flex items-start"
          >
            temps libre
          </div>
        ) : (
          <button
            key={i}
            onClick={() => onEventClick(s.event)}
            style={{
              gridRow: `${toLine(s.start)} / ${toLine(s.end)}`,
              backgroundColor: s.event.color ?? "var(--color-surface-raised)",
              color: readableText(s.event.color),
            }}
            className="rounded px-2 py-1 overflow-hidden text-left cursor-pointer hover:opacity-90 min-w-0 w-full flex flex-col relative"
          >
            <span
              className="absolute top-1 right-1 text-[11px] leading-none opacity-70"
              title={s.event.dayOfWeek ? "Récurrent (chaque semaine)" : "Ponctuel (date précise)"}
              aria-label={s.event.dayOfWeek ? "Récurrent" : "Ponctuel"}
            >
              {s.event.dayOfWeek ? "⟳" : "◆"}
            </span>
            <div className="my-auto w-full flex flex-col pr-3">
              <p className="text-[10px] font-mono-log opacity-80 shrink-0 whitespace-nowrap">
                {s.event.startTime}
                {s.event.endTime ? `–${s.event.endTime}` : ""}
              </p>
              <p className="text-sm leading-tight line-clamp-2 shrink-0">{s.event.title}</p>
              {s.event.description && (
                <p className="text-[10px] leading-tight line-clamp-4 opacity-70 min-h-0 flex-1">
                  {s.event.description}
                </p>
              )}
            </div>
          </button>
        )
      )}
    </div>
  );
}

function EventModal({
  event,
  events,
  onClose,
  onSaved,
}: {
  event: any;
  events: any[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(event.title ?? "");
  const [description, setDescription] = useState(event.description ?? "");
  const [mode, setMode] = useState<"recurrent" | "ponctuel">(
    event.mode ?? "recurrent"
  );
  const [dayOfWeek, setDayOfWeek] = useState(event.dayOfWeek ?? "MONDAY");
  const [specificDate, setSpecificDate] = useState(event.specificDate ?? "");
  const [startTime, setStartTime] = useState(event.startTime ?? "");
  const [endTime, setEndTime] = useState(event.endTime ?? "");
  const [color, setColor] = useState(event.color ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const alive = useRef(true);
  useEffect(() => () => { alive.current = false; }, []);

  const submit = async () => {
    setError("");
    if (!title.trim()) return setError("Le titre est requis.");
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(startTime))
      return setError("Heure de début invalide (HH:mm).");
    if (!color) return setError("Choisissez une couleur.");
    if (mode === "ponctuel" && !specificDate)
      return setError("Choisissez une date.");

    const overlap = hasOverlap(
      { mode, dayOfWeek, specificDate, startTime, endTime },
      events,
      event.__new ? undefined : event.id
    );
    if (overlap) {
      return setError("Ce créneau chevauche un événement existant.");
    }

    const payload: any = {
      title: title.trim(),
      description: description || undefined,
      startTime,
      endTime: endTime || undefined,
      color,
    };
    if (mode === "recurrent") {
      payload.dayOfWeek = dayOfWeek;
    } else {
      payload.specificDate = `${specificDate}T${startTime}:00.000Z`;
    }

    setSaving(true);
    try {
      const res = event.__new
        ? await fetch("/api/schedule", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch(`/api/schedule/${event.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return setError(data?.error?.formErrors?.join(", ") || "Erreur lors de l'enregistrement.");
      }
      onSaved();
    } finally {
      if (alive.current) setSaving(false);
    }
  };

  const remove = async () => {
    if (event.__new) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/schedule/${event.id}`, { method: "DELETE" });
      if (res.ok) onSaved();
    } finally {
      if (alive.current) setDeleting(false);
    }
  };

  const canSave =
    title.trim().length > 0 &&
    /^([01]\d|2[0-3]):[0-5]\d$/.test(startTime) &&
    !!color &&
    (mode !== "ponctuel" || !!specificDate);

  const [editing, setEditing] = useState(event.__new === true);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-lg bg-surface border-0 sm:border border-border-log p-4 text-parchment"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-lg">
            {event.__new ? "Nouvel événement" : editing ? "Modifier l'événement" : title}
          </h2>
          <div className="flex items-center gap-2">
            {!event.__new && !editing && (
              <button
                onClick={() => setEditing(true)}
                aria-label="Modifier"
                className="text-muted hover:text-parchment text-sm"
              >
                ✏️
              </button>
            )}
            <button
              onClick={onClose}
              aria-label="Fermer"
              className="text-muted hover:text-parchment text-sm"
            >
              ✕
            </button>
          </div>
        </div>

        {editing ? (
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-muted mb-1">Titre</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded border border-border-log bg-ink px-2 py-1.5 text-sm outline-none focus:border-brass"
            />
          </div>

          <div>
            <label className="block text-xs text-muted mb-1">Description</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded border border-border-log bg-ink px-2 py-1.5 text-sm outline-none focus:border-brass"
            />
          </div>

          <div>
            <label className="block text-xs text-muted mb-1">Type</label>
            <div className="flex gap-2">
              <button
                onClick={() => setMode("recurrent")}
                className={`flex-1 px-2 py-1.5 text-xs rounded border ${
                  mode === "recurrent"
                    ? "border-brass text-parchment bg-ink"
                    : "border-border-log text-muted"
                }`}
              >
                Récurrent (chaque semaine)
              </button>
              <button
                onClick={() => setMode("ponctuel")}
                className={`flex-1 px-2 py-1.5 text-xs rounded border ${
                  mode === "ponctuel"
                    ? "border-brass text-parchment bg-ink"
                    : "border-border-log text-muted"
                }`}
              >
                Ponctuel (date précise)
              </button>
            </div>
          </div>

          {mode === "recurrent" ? (
            <div>
              <label className="block text-xs text-muted mb-1">Jour</label>
              <select
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(e.target.value)}
                className="w-full rounded border border-border-log bg-ink px-2 py-1.5 text-sm outline-none focus:border-brass"
              >
                {DOW_ENUM.map((d) => (
                  <option key={d} value={d}>
                    {DAY_LABELS[DOW_ENUM.indexOf(d) + 1]}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-xs text-muted mb-1">Date</label>
              <input
                type="date"
                value={specificDate}
                onChange={(e) => setSpecificDate(e.target.value)}
                className="w-full rounded border border-border-log bg-ink px-2 py-1.5 text-sm outline-none focus:border-brass"
              />
            </div>
          )}

          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-xs text-muted mb-1">Début</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded border border-border-log bg-ink px-2 py-1.5 text-sm outline-none focus:border-brass"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-muted mb-1">Fin</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full rounded border border-border-log bg-ink px-2 py-1.5 text-sm outline-none focus:border-brass"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-muted mb-1">Couleur</label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  style={{ backgroundColor: c }}
                  className={`h-6 w-6 rounded-full border-2 ${
                    color === c ? "border-parchment" : "border-transparent"
                  }`}
                  aria-label={c}
                />
              ))}
              <button
                onClick={() => setColor("")}
                className={`h-6 w-6 rounded-full border-2 bg-surface-raised ${
                  color === "" ? "border-parchment" : "border-transparent"
                }`}
                aria-label="defaut"
              />
            </div>
          </div>

          {error && <p className="text-xs text-rust">{error}</p>}
        </div>
        ) : (
          <div className="space-y-3">
            <div>
              <p className="text-xs text-muted mb-1">Titre</p>
              <p className="text-sm">{title}</p>
            </div>
            <div>
              <p className="text-xs text-muted mb-1">Description</p>
              <p className="text-sm">{description || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted mb-1">Type</p>
              <p className="text-sm">
                {mode === "recurrent"
                  ? `Récurrent — ${DAY_LABELS[DOW_ENUM.indexOf(dayOfWeek as any) + 1]}`
                  : `Ponctuel — ${
                      specificDate ? dayjs(specificDate).format("D MMMM YYYY") : ""
                    }`}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted mb-1">Horaire</p>
              <p className="text-sm">
                {startTime}
                {endTime ? ` – ${endTime}` : ""}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted mb-1">Couleur</p>
              <div
                className="h-5 w-5 rounded-full border border-border-log"
                style={{ backgroundColor: color || "var(--color-surface-raised)" }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-4">
          {!event.__new && (
            <button
              onClick={remove}
              disabled={deleting}
              className="text-xs text-rust hover:underline disabled:opacity-50 flex items-center gap-1.5"
            >
              {deleting && <Spinner />}
              Supprimer
            </button>
          )}
          <div className="flex gap-2 ml-auto">
            {editing ? (
              <>
                <button
                  onClick={() => (event.__new ? onClose() : setEditing(false))}
                  disabled={saving || deleting}
                  className="px-3 py-1.5 text-xs rounded border border-border-log text-muted hover:text-parchment disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  onClick={submit}
                  disabled={!canSave || saving || deleting}
                  className={`px-3 py-1.5 text-xs rounded font-medium flex items-center gap-1.5 ${
                    canSave && !saving && !deleting
                      ? "bg-brass text-ink hover:opacity-90 cursor-pointer"
                      : "bg-surface-raised text-muted cursor-not-allowed"
                  }`}
                >
                  {saving && <Spinner />}
                  Enregistrer
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={onClose}
                  className="px-3 py-1.5 text-xs rounded border border-border-log text-muted hover:text-parchment"
                >
                  Fermer
                </button>
                <button
                  onClick={() => setEditing(true)}
                  className="px-3 py-1.5 text-xs rounded bg-brass text-ink font-medium hover:opacity-90"
                >
                  Modifier
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
