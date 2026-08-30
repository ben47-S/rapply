"use client";

import { useEffect, useRef, useState } from "react";
import dayjs from "@/app/lib/dayjs";
import { IconButton, PlusIcon } from "@/app/components/IconButton";
import { StatusStamp } from "@/app/components/StatusStamp";
import { TYPE_LABELS, FREQ_LABELS, derivedStatus, nextDue } from "@/app/lib/recurrence";

function Spinner({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
      aria-hidden
    />
  );
}

type R = any;

function dotColor(r: R): string {
  const s = derivedStatus(r);
  if (s === "DONE") return "bg-teal-log";
  if (s === "OVERDUE") return "bg-rust";
  return "bg-brass";
}

export function RemindersView({
  reminders: initial,
  categories = [],
  currency = "XOF",
}: {
  reminders: R[];
  categories?: any[];
  currency?: string;
}) {
  const [reminders, setReminders] = useState<R[]>(initial);
  const [open, setOpen] = useState<{ r?: R; defaultType?: string } | null>(null);
  const [filter, setFilter] = useState<"tous" | "avenir" | "retard" | "faits">(
    "tous"
  );
  const [scope, setScope] = useState<"tasks" | "subscriptions">("tasks");

  const handleSaved = (
    updated: R | null,
    deletedId?: string,
    added?: R
  ) => {
    setOpen(null);
    if (deletedId) {
      setReminders((list) => list.filter((x) => x.id !== deletedId));
      return;
    }
    setReminders((list) => {
      let next = list;
      if (updated) {
        next = next.some((x) => x.id === updated.id)
          ? next.map((x) => (x.id === updated.id ? updated : x))
          : [...next, updated];
      }
      if (added) next = [...next, added];
      return next;
    });
    const item = added ?? updated;
    if (item) setScope(item.type === "SUBSCRIPTION" ? "subscriptions" : "tasks");
  };

  const hasScope = reminders.some((r) =>
    scope === "subscriptions" ? r.type === "SUBSCRIPTION" : r.type !== "SUBSCRIPTION"
  );

  const visible = reminders
    .filter((r) =>
      scope === "subscriptions" ? r.type === "SUBSCRIPTION" : r.type !== "SUBSCRIPTION"
    )
    .filter((r) => {
      const s = derivedStatus(r);
      if (filter === "avenir") return s === "PENDING";
      if (filter === "retard") return s === "OVERDUE";
      if (filter === "faits") return s === "DONE";
      if (filter === "tous") return s !== "DONE";
      return true;
    })
    .sort((a, b) => dayjs(a.dueDate).valueOf() - dayjs(b.dueDate).valueOf());

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl text-parchment">Rappels</h1>
        <IconButton
          ariaLabel="Ajouter un rappel"
          onClick={() =>
            setOpen({
              defaultType: scope === "subscriptions" ? "SUBSCRIPTION" : undefined,
            })
          }
          variant="brass"
          className="h-7 w-7 sm:h-6 sm:w-6"
        >
          <PlusIcon className="w-3.5 h-3.5 sm:w-3.5 sm:h-3.5" />
        </IconButton>
      </div>

      <div className="flex gap-2 mb-6">
        {([
          { key: "tasks", label: "Ponctuels" },
          { key: "subscriptions", label: "Abonnements" },
        ] as const).map((p) => (
          <button
            key={p.key}
            onClick={() => setScope(p.key)}
            className={`px-3 py-1.5 text-xs rounded border ${
              scope === p.key
                ? "border-brass text-parchment bg-ink"
                : "border-border-log text-muted"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="flex gap-2 mb-6">
        {([
          { key: "tous", label: "Tous" },
          { key: "avenir", label: "À venir" },
          { key: "retard", label: "En retard" },
          { key: "faits", label: "Faits" },
        ] as const).map((p) => (
          <button
            key={p.key}
            onClick={() => setFilter(p.key)}
            className={`px-3 py-1.5 text-xs rounded border ${
              filter === p.key
                ? "border-brass text-parchment bg-ink"
                : "border-border-log text-muted"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {!hasScope ? (
        <p className="text-sm text-muted mb-4">
          Aucun {scope === "subscriptions" ? "abonnement" : "rappel"} pour le moment.
        </p>
      ) : visible.length === 0 ? (
        <p className="text-sm text-muted mb-4">Aucun élément pour ce filtre.</p>
      ) : null}

      <div className="border-l border-border-log pl-6">
        {visible.map((r: R) => (
          <button
            key={r.id}
            onClick={() => setOpen({ r })}
            className="relative block w-full text-left pb-6 cursor-pointer group"
          >
            <div
              className={`absolute -left-[29px] top-1.5 w-2.5 h-2.5 rounded-full ${dotColor(r)}`}
            />
            <div className="flex items-center justify-between bg-surface border border-border-log rounded-md px-4 py-3 group-hover:border-brass">
              <div className="min-w-0 flex-1 mr-3">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-mono-log text-xs text-muted">
                    {new Date(r.dueDate).toLocaleDateString("fr-FR")} ·{" "}
                    {TYPE_LABELS[r.type] ?? r.type}
                  </span>
                  {r.category && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-muted">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: r.category.color || "#888" }}
                      />
                      <span className="truncate">{r.category.name}</span>
                    </span>
                  )}
                  {r.estimatedAmount != null && (
                    <span className="font-mono-log text-xs text-brass">
                      ~{Number(r.estimatedAmount).toLocaleString("fr-FR")} {currency}
                    </span>
                  )}
                </div>
                <p className="text-parchment truncate">{r.title}</p>
                {r.description && (
                  <p className="text-sm text-muted truncate">{r.description}</p>
                )}
              </div>
              <StatusStamp status={derivedStatus(r)} />
            </div>
          </button>
        ))}
      </div>

      {open && (
        <ReminderModal
          r={open.r}
          defaultType={open.defaultType}
          categories={categories}
          currency={currency}
          onClose={() => setOpen(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

function ReminderModal({
  r,
  onClose,
  onSaved,
  defaultType,
  categories = [],
  currency = "XOF",
}: {
  r?: R;
  onClose: () => void;
  onSaved: (updated: R | null, deletedId?: string, added?: R) => void;
  defaultType?: string;
  categories?: any[];
  currency?: string;
}) {
  const isNew = !r;
  const isSub = r?.type === "SUBSCRIPTION";
  const atEcheance =
    !!r && isSub && dayjs(r.dueDate).isBefore(dayjs().add(5, "day"));
  const [title, setTitle] = useState(r?.title ?? "");
  const [description, setDescription] = useState(r?.description ?? "");
  const [type, setType] = useState<string>(r?.type ?? defaultType ?? "TASK");
  const dateLabel =
    type === "SUBSCRIPTION" ? "Prochaine échéance" : "Date et heure du rappel";
  const [due, setDue] = useState(
    r ? dayjs(r.dueDate).format("YYYY-MM-DDTHH:mm") : ""
  );
  const [estimatedAmount, setEstimatedAmount] = useState(
    r?.estimatedAmount != null ? String(Number(r.estimatedAmount)) : ""
  );
  const [categoryId, setCategoryId] = useState(r?.categoryId ?? "");
  const [isRecurring, setIsRecurring] = useState<boolean>(r?.isRecurring ?? false);
  const [frequency, setFrequency] = useState<string>(r?.frequency ?? "MONTHLY");
  const [customIntervalDays, setCustomIntervalDays] = useState<string>(
    r?.customIntervalDays != null ? String(r.customIntervalDays) : ""
  );
  const [recurrenceEndDate, setRecurrenceEndDate] = useState<string>(
    r?.recurrenceEndDate ? dayjs(r.recurrenceEndDate).format("YYYY-MM-DD") : ""
  );
  const [notifyTiming, setNotifyTiming] = useState<string>(
    r?.notifyTiming ?? "REALTIME"
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const alive = useRef(true);
  useEffect(() => () => {
    alive.current = false;
  }, []);

  const [editing, setEditing] = useState(isNew === true);

  const toggleStatus = async () => {
    if (!r) return;
    setSaving(true);
    try {
      if (r.status === "DONE") {
        const res = await fetch(`/api/reminders/${r.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "PENDING" }),
        });
        if (res.ok) {
          const updated = await res.json();
          onSaved(updated);
        }
        return;
      }

      const doneRes = await fetch(`/api/reminders/${r.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "DONE" }),
      });
      if (!doneRes.ok) return;
      const doneReminder: R = await doneRes.json();

      if (r.isRecurring) {
        const nd = nextDue(dayjs(), r);
        const end = r.recurrenceEndDate ? dayjs(r.recurrenceEndDate) : null;
        if (!end || nd.isSame(end, "day") || nd.isBefore(end)) {
          const payload: any = {
            title: r.title,
            description: r.description || undefined,
            type: r.type,
            dueDate: nd.toISOString(),
            estimatedAmount: r.estimatedAmount != null ? Number(r.estimatedAmount) : undefined,
            categoryId: r.categoryId || undefined,
            isRecurring: true,
            frequency: r.frequency,
            ...(r.frequency === "CUSTOM" && r.customIntervalDays
              ? { customIntervalDays: Number(r.customIntervalDays) }
              : {}),
            ...(r.recurrenceEndDate
              ? { recurrenceEndDate: r.recurrenceEndDate }
              : {}),
            status: "PENDING",
          };
          const newRes = await fetch("/api/reminders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (newRes.ok) {
            const created: R = await newRes.json();
            onSaved(doneReminder, undefined, created);
            return;
          }
        }
      }
      onSaved(doneReminder);
    } finally {
      if (alive.current) setSaving(false);
    }
  };

  const renew = async () => {
    if (!r) return;
    setSaving(true);
    try {
      const nd = nextDue(dayjs(), r);
      const end = r.recurrenceEndDate ? dayjs(r.recurrenceEndDate) : null;
      if (end && nd.isAfter(end)) {
        const res = await fetch(`/api/reminders/${r.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isRecurring: false, status: "DONE" }),
        });
        if (res.ok) {
          const updated = await res.json();
          onSaved(updated);
        }
        return;
      }
      const res = await fetch(`/api/reminders/${r.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dueDate: nd.toISOString() }),
      });
      if (res.ok) {
        const updated = await res.json();
        onSaved(updated);
      }
    } finally {
      if (alive.current) setSaving(false);
    }
  };

  const revoke = async () => {
    if (!r) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/reminders/${r.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRecurring: false, status: "DONE" }),
      });
      if (res.ok) {
        const updated = await res.json();
        onSaved(updated);
      }
    } finally {
      if (alive.current) setSaving(false);
    }
  };

  const submit = async () => {
    setError("");
    if (!title.trim()) return setError("Le titre est requis.");
    if (!due) return setError("La date est requise.");
    setSaving(true);
    try {
      const amt = estimatedAmount ? parseFloat(String(estimatedAmount).replace(",", ".")) : undefined;
      const payload: any = {
        title: title.trim(),
        description: description || undefined,
        type,
        dueDate: new Date(due).toISOString(),
        estimatedAmount: amt && !isNaN(amt) && amt > 0 ? amt : null,
        categoryId: categoryId || null,
        isRecurring,
        notifyTiming,
        ...(isRecurring
          ? {
              frequency,
              ...(frequency === "CUSTOM" && customIntervalDays
                ? { customIntervalDays: Number(customIntervalDays) }
                : {}),
              ...(recurrenceEndDate
                ? { recurrenceEndDate: `${recurrenceEndDate}T23:59:59.000Z` }
                : {}),
            }
          : { frequency: undefined, customIntervalDays: undefined, recurrenceEndDate: undefined }),
      };
      const res = isNew
        ? await fetch("/api/reminders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch(`/api/reminders/${r!.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return setError(
          data?.error?.formErrors?.join(", ") || "Erreur lors de l'enregistrement."
        );
      }
      const saved: R = await res.json();
      onSaved(saved);
    } finally {
      if (alive.current) setSaving(false);
    }
  };

  const remove = async () => {
    if (!r) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/reminders/${r.id}`, { method: "DELETE" });
      if (res.ok) onSaved(null, r.id);
    } finally {
      if (alive.current) setDeleting(false);
    }
  };

  const canSave = title.trim().length > 0 && !!due;

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
            {isNew ? "Nouveau rappel" : editing ? "Modifier le rappel" : r?.title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="text-muted hover:text-parchment text-sm"
          >
            ✕
          </button>
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
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full rounded border border-border-log bg-ink px-2 py-1.5 text-sm outline-none focus:border-brass"
              />
            </div>

            <div>
              <label className="block text-xs text-muted mb-1">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full rounded border border-border-log bg-ink px-2 py-1.5 text-sm outline-none focus:border-brass"
              >
                {Object.entries(TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-muted mb-1">{dateLabel}</label>
              <input
                type="datetime-local"
                value={due}
                onChange={(e) => setDue(e.target.value)}
                className="w-full rounded border border-border-log bg-ink px-2 py-1.5 text-sm outline-none focus:border-brass"
              />
            </div>

            <div>
              <label className="block text-xs text-muted mb-1">
                Prix estimé ({currency}) (optionnel)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={estimatedAmount}
                onChange={(e) => setEstimatedAmount(e.target.value)}
                placeholder="ex: 5000"
                className="w-full rounded border border-border-log bg-ink px-2 py-1.5 text-sm outline-none focus:border-brass"
              />
            </div>

            <div>
              <label className="block text-xs text-muted mb-1">
                Catégorie (optionnel)
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded border border-border-log bg-ink px-2 py-1.5 text-sm outline-none focus:border-brass"
              >
                <option value="">Aucune</option>
                {categories
                  .filter((c: any) => c.type === "EXPENSE")
                  .map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-muted mb-1">Notification</label>
              <select
                value={notifyTiming}
                onChange={(e) => setNotifyTiming(e.target.value)}
                className="w-full rounded border border-border-log bg-ink px-2 py-1.5 text-sm outline-none focus:border-brass"
              >
                <option value="REALTIME">À l&apos;échéance (temps réel)</option>
                <option value="MORNING">Le matin (résumé 7h)</option>
              </select>
              <p className="text-[11px] text-muted mt-1">
                Tâche ponctuelle ou cycle court → rappels auto à 50 %, 80 % et 100 %
                de l&apos;échéance. Au-delà de 3 mois → 70 %, 90 % et 100 %.
              </p>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="accent-brass"
              />
              Récurrent
            </label>

            {isRecurring && (
              <div className="space-y-3 pl-1 border-l border-border-log">
                <div>
                  <label className="block text-xs text-muted mb-1">Fréquence</label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    className="w-full rounded border border-border-log bg-ink px-2 py-1.5 text-sm outline-none focus:border-brass"
                  >
                    {Object.entries(FREQ_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
                {frequency === "CUSTOM" && (
                  <div>
                    <label className="block text-xs text-muted mb-1">
                      Intervalle (jours)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={customIntervalDays}
                      onChange={(e) => setCustomIntervalDays(e.target.value)}
                      className="w-full rounded border border-border-log bg-ink px-2 py-1.5 text-sm outline-none focus:border-brass"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-xs text-muted mb-1">
                    Fin de récurrence (optionnel)
                  </label>
                  <input
                    type="date"
                    value={recurrenceEndDate}
                    onChange={(e) => setRecurrenceEndDate(e.target.value)}
                    className="w-full rounded border border-border-log bg-ink px-2 py-1.5 text-sm outline-none focus:border-brass"
                  />
                </div>
              </div>
            )}

            {error && <p className="text-xs text-rust">{error}</p>}
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <p className="text-xs text-muted mb-1">Type</p>
              <p className="text-sm">{TYPE_LABELS[r?.type] ?? r?.type}</p>
            </div>
            <div>
              <p className="text-xs text-muted mb-1">{dateLabel}</p>
              <p className="text-sm">
                {dayjs(r?.dueDate).format("D MMMM YYYY à HH:mm")}
              </p>
            </div>
            {r?.estimatedAmount != null && (
              <div>
                <p className="text-xs text-muted mb-1">Prix estimé</p>
                <p className="font-mono-log text-sm text-brass">
                  ~{Number(r.estimatedAmount).toLocaleString("fr-FR")} {currency}
                </p>
              </div>
            )}
            {r?.category && (
              <div>
                <p className="text-xs text-muted mb-1">Catégorie</p>
                <p className="text-sm flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: r.category.color || "#888" }}
                  />
                  <span>{r.category.name}</span>
                </p>
              </div>
            )}
            {r?.completedAt && (
              <div>
                <p className="text-xs text-muted mb-1">Terminé le</p>
                <p className="text-sm text-teal-log font-mono-log">
                  {dayjs(r.completedAt).format("D MMMM YYYY à HH:mm")}
                </p>
              </div>
            )}
            {r?.description && (
              <div>
                <p className="text-xs text-muted mb-1">Description</p>
                <p className="text-sm">{r.description}</p>
              </div>
            )}
            {r?.isRecurring && (
              <div>
                <p className="text-xs text-muted mb-1">Récurrence</p>
                <p className="text-sm">
                  {FREQ_LABELS[r.frequency] ?? r.frequency}
                  {r.frequency === "CUSTOM" && r.customIntervalDays
                    ? ` (${r.customIntervalDays} j)`
                    : ""}
                </p>
              </div>
            )}
            <div>
              <p className="text-xs text-muted mb-1">Statut</p>
              <StatusStamp status={derivedStatus(r!)} />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-3">
            {!isNew && isSub && atEcheance && (
              <button
                onClick={renew}
                disabled={saving}
                className="text-xs text-teal-log hover:underline disabled:opacity-50 flex items-center gap-1.5"
              >
                {saving && <Spinner />}
                Renouveler
              </button>
            )}
            {!isNew && isSub && (
              <button
                onClick={revoke}
                disabled={saving}
                className="text-xs text-rust hover:underline disabled:opacity-50 flex items-center gap-1.5"
              >
                {saving && <Spinner />}
                Révoquer
              </button>
            )}
            {!isNew && (
              <button
                onClick={remove}
                disabled={deleting}
                className="text-xs text-rust hover:underline disabled:opacity-50 flex items-center gap-1.5"
              >
                {deleting && <Spinner />}
                Supprimer
              </button>
            )}
            {!isNew && !isSub && !editing && (
              <button
                onClick={toggleStatus}
                disabled={saving}
                className="text-xs text-teal-log hover:underline disabled:opacity-50 flex items-center gap-1.5"
              >
                {saving && <Spinner />}
                {r?.status === "DONE" ? "Marquer à faire" : "Marquer fait"}
              </button>
            )}
          </div>
          <div className="flex gap-2 ml-auto">
            {editing ? (
              <>
                <button
                  onClick={() => (isNew ? onClose() : setEditing(false))}
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
              <button
                onClick={() => setEditing(true)}
                className="px-3 py-1.5 text-xs rounded bg-brass text-ink font-medium hover:opacity-90"
              >
                Modifier
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
