"use client";

import { useEffect, useRef, useState } from "react";
import dayjs from "@/app/lib/dayjs";
import { IconButton, PlusIcon, BackButton } from "@/app/components/IconButton";

function Spinner({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
      aria-hidden
    />
  );
}

type B = any;
type T = any;
type C = any;

function spentFor(b: B, transactions: T[]): number {
  const start = dayjs(b.periodStart).startOf("day");
  const end = dayjs(b.periodEnd).endOf("day");
  return transactions
    .filter((t: T) => {
      const d = dayjs(t.date);
      if (d.isBefore(start) || d.isAfter(end)) return false;
      if (b.categoryId) {
        return t.categoryId === b.categoryId;
      }
      return t.type === "EXPENSE";
    })
    .reduce((s: number, t: T) => s + Number(t.amount), 0);
}

function periodLabel(b: B): string {
  if (b.type === "MONTHLY") return dayjs(b.periodStart).format("MMMM YYYY");
  return `${dayjs(b.periodStart).format("D MMM YYYY")} – ${dayjs(b.periodEnd).format("D MMM YYYY")}`;
}

export function BudgetsView({
  budgets: initial,
  transactions,
  categories,
  defaultCurrency,
}: {
  budgets: B[];
  transactions: T[];
  categories: C[];
  defaultCurrency: string;
}) {
  const [budgets, setBudgets] = useState<B[]>(initial);
  const [open, setOpen] = useState<{ b?: B } | null>(null);

  const handleSaved = (updated: B | null, deletedId?: string) => {
    setOpen(null);
    if (deletedId) {
      setBudgets((list) => list.filter((x) => x.id !== deletedId));
      return;
    }
    if (updated) {
      setBudgets((list) =>
        list.some((x) => x.id === updated.id)
          ? list.map((x) => (x.id === updated.id ? updated : x))
          : [...list, updated]
      );
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <BackButton />
        <h1 className="font-display text-2xl text-parchment">Budgets</h1>
        <IconButton
          ariaLabel="Ajouter un budget"
          onClick={() => setOpen({})}
          variant="brass"
          className="ml-auto h-7 w-7 sm:h-6 sm:w-6"
        >
          <PlusIcon className="w-3.5 h-3.5 sm:w-3.5 sm:h-3.5" />
        </IconButton>
      </div>

      {budgets.length === 0 && (
        <p className="text-sm text-muted mb-4">Aucun budget pour le moment.</p>
      )}

      <div className="space-y-3">
        {budgets.map((b: B) => {
          const spent = spentFor(b, transactions);
          const amount = Number(b.amount);
          const pct = amount > 0 ? Math.min(100, (spent / amount) * 100) : 0;
          const over = spent > amount;
          const remaining = amount - spent;
          const barColor =
            pct >= 100
              ? "bg-rust"
              : pct >= 95
                ? "bg-amber"
                : pct >= 80
                  ? "bg-brass"
                  : "bg-teal-log";
          const captionColor =
            pct >= 100
              ? "text-rust"
              : pct >= 95
                ? "text-amber"
                : pct >= 80
                  ? "text-brass"
                  : "text-muted";
          const cat = b.categoryId
            ? categories.find((c: C) => c.id === b.categoryId)
            : null;
          return (
            <button
              key={b.id}
              onClick={() => setOpen({ b })}
              className="block w-full text-left bg-surface border border-border-log rounded-md px-4 py-3 hover:border-brass"
            >
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm text-parchment truncate">
                  {cat ? cat.name : "Global"}
                  <span className="text-muted text-xs ml-2">{periodLabel(b)}</span>
                </p>
                <p className={`font-mono-log text-sm ${captionColor}`}>
                  {spent.toLocaleString("fr-FR")} / {amount.toLocaleString("fr-FR")} {defaultCurrency}
                </p>
              </div>
                <div className="h-2 rounded-full bg-ink overflow-hidden">
                  <div
                    className={`h-full ${barColor}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className={`text-[11px] mt-1 ${captionColor}`}>
                {over
                  ? `Dépassement de ${(spent - amount).toLocaleString("fr-FR")} ${defaultCurrency}`
                  : `${(remaining > 0 ? remaining : 0).toLocaleString("fr-FR")} ${defaultCurrency} restants`}
              </p>
            </button>
          );
        })}
      </div>

      {open && (
        <BudgetModal
          b={open.b}
          categories={categories}
          defaultCurrency={defaultCurrency}
          onClose={() => setOpen(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

function BudgetModal({
  b,
  categories,
  defaultCurrency,
  onClose,
  onSaved,
}: {
  b?: B;
  categories: C[];
  defaultCurrency: string;
  onClose: () => void;
  onSaved: (updated: B | null, deletedId?: string) => void;
}) {
  const isNew = !b;
  const [type, setType] = useState<"MONTHLY" | "CUSTOM">(b?.type ?? "MONTHLY");
  const [amount, setAmount] = useState(b ? String(Number(b.amount)) : "");
  const [start, setStart] = useState(
    b
      ? dayjs(b.periodStart).format("YYYY-MM-DD")
      : dayjs().startOf("month").format("YYYY-MM-DD")
  );
  const [end, setEnd] = useState(
    b
      ? dayjs(b.periodEnd).format("YYYY-MM-DD")
      : dayjs().endOf("month").format("YYYY-MM-DD")
  );
  const [categoryId, setCategoryId] = useState(b?.categoryId ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const alive = useRef(true);
  useEffect(() => () => {
    alive.current = false;
  }, []);

  const submit = async () => {
    setError("");
    const amt = parseFloat(String(amount).replace(",", "."));
    if (isNaN(amt) || amt <= 0) return setError("Montant invalide (positif).");
    if (!start || !end) return setError("Période requise.");
    setSaving(true);
    try {
      const payload = {
        type,
        amount: amt,
        periodStart: `${start}T00:00:00.000Z`,
        periodEnd: `${end}T23:59:59.000Z`,
        categoryId: categoryId || undefined,
      };
      const res = isNew
        ? await fetch("/api/budgets", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch(`/api/budgets/${b!.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return setError(data?.error?.formErrors?.join(", ") || "Erreur lors de l'enregistrement.");
      }
      const saved: B = await res.json();
      onSaved(saved);
    } finally {
      if (alive.current) setSaving(false);
    }
  };

  const remove = async () => {
    if (!b) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/budgets/${b.id}`, { method: "DELETE" });
      if (res.ok) onSaved(null, b.id);
    } finally {
      if (alive.current) setDeleting(false);
    }
  };

  const canSave = !isNaN(parseFloat(String(amount).replace(",", "."))) &&
    parseFloat(String(amount).replace(",", ".")) > 0 &&
    !!start &&
    !!end;

  const [editing, setEditing] = useState(isNew === true);

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
            {isNew ? "Nouveau budget" : "Modifier le budget"}
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
              <label className="block text-xs text-muted mb-1">Montant ({defaultCurrency})</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded border border-border-log bg-ink px-2 py-1.5 text-sm outline-none focus:border-brass"
              />
            </div>

            <div>
              <label className="block text-xs text-muted mb-1">Type</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setType("MONTHLY")}
                  className={`flex-1 px-2 py-1.5 text-xs rounded border ${
                    type === "MONTHLY"
                      ? "border-brass text-parchment bg-ink"
                      : "border-border-log text-muted"
                  }`}
                >
                  Mensuel
                </button>
                <button
                  onClick={() => setType("CUSTOM")}
                  className={`flex-1 px-2 py-1.5 text-xs rounded border ${
                    type === "CUSTOM"
                      ? "border-brass text-parchment bg-ink"
                      : "border-border-log text-muted"
                  }`}
                >
                  Personnalisé
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs text-muted mb-1">Début</label>
                <input
                  type="date"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                  className="w-full rounded border border-border-log bg-ink px-2 py-1.5 text-sm outline-none focus:border-brass"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-muted mb-1">Fin</label>
                <input
                  type="date"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                  className="w-full rounded border border-border-log bg-ink px-2 py-1.5 text-sm outline-none focus:border-brass"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-muted mb-1">Catégorie (optionnel)</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded border border-border-log bg-ink px-2 py-1.5 text-sm outline-none focus:border-brass"
              >
                <option value="">Global (toutes dépenses)</option>
                {categories.map((c: C) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {error && <p className="text-xs text-rust">{error}</p>}
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <p className="text-xs text-muted mb-1">Montant</p>
              <p className="font-mono-log text-parchment">
                {Number(amount).toLocaleString("fr-FR")} {defaultCurrency}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted mb-1">Type</p>
              <p className="text-sm">{type === "MONTHLY" ? "Mensuel" : "Personnalisé"}</p>
            </div>
            <div>
              <p className="text-xs text-muted mb-1">Période</p>
              <p className="text-sm">{periodLabel(b!)}</p>
            </div>
            <div>
              <p className="text-xs text-muted mb-1">Catégorie</p>
              <p className="text-sm">
                {b?.categoryId
                  ? categories.find((c: C) => c.id === b.categoryId)?.name ?? "—"
                  : "Global (toutes dépenses)"}
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-4">
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
