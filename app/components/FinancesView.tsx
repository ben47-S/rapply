"use client";

import { useEffect, useRef, useState } from "react";
import dayjs from "@/app/lib/dayjs";
import { IconButton, PlusIcon, BudgetIcon } from "@/app/components/IconButton";

function Spinner({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
      aria-hidden
    />
  );
}

type Tx = any;
type Cat = any;

export function FinancesView({
  transactions: initial,
  categories: allCategories,
  defaultCurrency,
}: {
  transactions: Tx[];
  categories: Cat[];
  defaultCurrency: string;
}) {
  const [transactions, setTransactions] = useState<Tx[]>(initial);
  const [categories, setCategories] = useState<Cat[]>(allCategories);
  const [open, setOpen] = useState<{ tx?: Tx } | null>(null);
  const [period, setPeriod] = useState<"jour" | "mois" | "annee">("mois");

  const handleCategoryAdded = (c: Cat) => setCategories((prev) => [...prev, c]);

  const filtered = transactions
    .filter((t: Tx) => {
      const d = dayjs(t.date);
      if (period === "jour") return d.isSame(dayjs(), "day");
      if (period === "annee") return d.isSame(dayjs(), "year");
      return d.isSame(dayjs(), "month");
    })
    .sort((a, b) => {
      const byDate = new Date(b.date).getTime() - new Date(a.date).getTime();
      if (byDate !== 0) return byDate;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const totalIncome = filtered
    .filter((t: Tx) => t.type === "INCOME")
    .reduce((sum: number, t: Tx) => sum + Number(t.amount), 0);
  const totalExpense = filtered
    .filter((t: Tx) => t.type === "EXPENSE")
    .reduce((sum: number, t: Tx) => sum + Number(t.amount), 0);

  const handleSaved = (updated: Tx | null, deletedId?: string) => {
    setOpen(null);
    if (deletedId) {
      setTransactions((t) => t.filter((x) => x.id !== deletedId));
      return;
    }
    if (updated) {
      setTransactions((t) => {
        const next = t.some((x) => x.id === updated.id)
          ? t.map((x) => (x.id === updated.id ? updated : x))
          : [...t, updated];
        return next.sort((a, b) => {
          const byDate = new Date(b.date).getTime() - new Date(a.date).getTime();
          if (byDate !== 0) return byDate;
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        });
      });
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl text-parchment">Finances</h1>
        <div className="flex items-center gap-2">
          <IconButton
            ariaLabel="Budgets"
            href="/budgets"
            variant="surface"
            className="h-7 w-7 sm:h-6 sm:w-6"
          >
            <BudgetIcon className="w-3.5 h-3.5 sm:w-3.5 sm:h-3.5" />
          </IconButton>
          <IconButton
            ariaLabel="Ajouter une transaction"
            onClick={() => setOpen({})}
            variant="brass"
            className="h-7 w-7 sm:h-6 sm:w-6"
          >
            <PlusIcon className="w-3.5 h-3.5 sm:w-3.5 sm:h-3.5" />
          </IconButton>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {([
          { key: "jour", label: "Jour" },
          { key: "mois", label: "Mois" },
          { key: "annee", label: "Année" },
        ] as const).map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={`px-3 py-1.5 text-xs rounded border ${
              period === p.key
                ? "border-brass text-parchment bg-ink"
                : "border-border-log text-muted"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
        <div className="bg-surface border border-border-log rounded-md px-4 py-5">
          <p className="text-[11px] uppercase tracking-widest text-muted mb-1">Entrées</p>
          <p className="font-mono-log text-xl sm:text-2xl text-teal-log truncate">
            +{totalIncome.toLocaleString("fr-FR")} {defaultCurrency}
          </p>
        </div>
        <div className="bg-surface border border-border-log rounded-md px-4 py-5">
          <p className="text-[11px] uppercase tracking-widest text-muted mb-1">Dépenses</p>
          <p className="font-mono-log text-xl sm:text-2xl text-rust truncate">
            -{totalExpense.toLocaleString("fr-FR")} {defaultCurrency}
          </p>
        </div>
      </div>

      {transactions.length === 0 ? (
        <p className="text-sm text-muted mb-4">Aucune transaction pour le moment.</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted mb-4">Aucune transaction pour cette période.</p>
      ) : null}

      <div className="border-l border-border-log pl-6">
        {filtered.map((t: Tx) => (
          <button
            key={t.id}
            onClick={() => setOpen({ tx: t })}
            className="relative block w-full text-left pb-6 cursor-pointer group"
          >
            <div
              className={`absolute -left-[29px] top-1.5 w-2.5 h-2.5 rounded-full ${
                t.type === "INCOME" ? "bg-teal-log" : "bg-rust"
              }`}
            />
            <div className="flex items-center justify-between bg-surface border border-border-log rounded-md px-4 py-3 group-hover:border-brass">
              <div className="min-w-0">
                <p className="font-mono-log text-xs text-muted mb-1 flex items-center gap-1.5">
                  <span>{new Date(t.date).toLocaleDateString("fr-FR")}</span>
                  {t.category && (
                    <>
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: t.category.color }}
                      />
                      <span className="truncate">{t.category.name}</span>
                    </>
                  )}
                </p>
                <p className="text-parchment truncate">{t.note ?? "Sans description"}</p>
              </div>
              <p
                className={`font-mono-log ml-3 shrink-0 ${
                  t.type === "INCOME" ? "text-teal-log" : "text-rust"
                }`}
              >
                {t.type === "INCOME" ? "+" : "-"}
                {Number(t.amount).toLocaleString("fr-FR")} {t.currency}
              </p>
            </div>
          </button>
        ))}
      </div>

      {open && (
        <TransactionModal
          tx={open.tx}
          categories={categories}
          defaultCurrency={defaultCurrency}
          onClose={() => setOpen(null)}
          onSaved={handleSaved}
          onCategoryAdded={handleCategoryAdded}
        />
      )}
    </div>
  );
}

function TransactionModal({
  tx,
  categories,
  defaultCurrency,
  onClose,
  onSaved,
  onCategoryAdded,
}: {
  tx?: Tx;
  categories: Cat[];
  defaultCurrency: string;
  onClose: () => void;
  onSaved: (updated: Tx | null, deletedId?: string) => void;
  onCategoryAdded: (c: Cat) => void;
}) {
  const isNew = !tx;
  const [type, setType] = useState<"INCOME" | "EXPENSE">(tx?.type ?? "EXPENSE");
  const [amount, setAmount] = useState(tx ? String(Number(tx.amount)) : "");
  const [note, setNote] = useState(tx?.note ?? "");
  const [date, setDate] = useState(
    tx ? dayjs(tx.date).format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD")
  );
  const [categoryId, setCategoryId] = useState(tx?.categoryId ?? "");
  const [catForm, setCatForm] = useState(false);
  const [catName, setCatName] = useState("");
  const [catColor, setCatColor] = useState("");
  const [catSaving, setCatSaving] = useState(false);
  const [catError, setCatError] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const alive = useRef(true);
  useEffect(() => () => {
    alive.current = false;
  }, []);

  const catOptions = categories.filter((c: Cat) => c.type === type);

  const changeType = (t: "INCOME" | "EXPENSE") => {
    setType(t);
    const cur = categories.find((c: Cat) => c.id === categoryId);
    if (cur && cur.type !== t) setCategoryId("");
  };

  const submit = async () => {
    setError("");
    const amt = parseFloat(String(amount).replace(",", "."));
    if (isNaN(amt) || amt <= 0) return setError("Montant invalide (positif).");

    setSaving(true);
    try {
      const payload = {
        type,
        amount: amt,
        currency: defaultCurrency,
        note: note || undefined,
        date: `${date}T00:00:00.000Z`,
        categoryId: categoryId || undefined,
      };
      const res = isNew
        ? await fetch("/api/transactions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch(`/api/transactions/${tx!.id}`, {
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
      const saved: Tx = await res.json();
      const cat = categoryId ? categories.find((c: Cat) => c.id === categoryId) : null;
      onSaved({ ...saved, category: cat });
    } finally {
      if (alive.current) setSaving(false);
    }
  };

  const createCategory = async () => {
    setCatError("");
    if (!catName.trim()) return setCatError("Nom requis.");
    setCatSaving(true);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: catName.trim(), type, color: catColor || undefined }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return setCatError(data?.error?.formErrors?.join(", ") || "Erreur lors de la création.");
      }
      const c: Cat = await res.json();
      onCategoryAdded(c);
      setCategoryId(c.id);
      setCatName("");
      setCatColor("");
      setCatForm(false);
    } finally {
      if (alive.current) setCatSaving(false);
    }
  };

  const remove = async () => {
    if (!tx) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/transactions/${tx.id}`, { method: "DELETE" });
      if (res.ok) onSaved(null, tx.id);
    } finally {
      if (alive.current) setDeleting(false);
    }
  };

  const canSave = !isNaN(parseFloat(String(amount).replace(",", "."))) &&
    parseFloat(String(amount).replace(",", ".")) > 0;

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
            {isNew ? "Nouvelle transaction" : editing ? "Modifier la transaction" : note || "Transaction"}
          </h2>
          <div className="flex items-center gap-2">
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
              <label className="block text-xs text-muted mb-1">Type</label>
              <div className="flex gap-2">
                <button
                  onClick={() => changeType("EXPENSE")}
                  className={`flex-1 px-2 py-1.5 text-xs rounded border ${
                    type === "EXPENSE"
                      ? "border-brass text-parchment bg-ink"
                      : "border-border-log text-muted"
                  }`}
                >
                  Dépense
                </button>
                <button
                  onClick={() => changeType("INCOME")}
                  className={`flex-1 px-2 py-1.5 text-xs rounded border ${
                    type === "INCOME"
                      ? "border-brass text-parchment bg-ink"
                      : "border-border-log text-muted"
                  }`}
                >
                  Entrée
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs text-muted mb-1">
                Montant ({defaultCurrency})
              </label>
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
              <label className="block text-xs text-muted mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded border border-border-log bg-ink px-2 py-1.5 text-sm outline-none focus:border-brass"
              />
            </div>

            <div>
              <label className="block text-xs text-muted mb-1">Catégorie</label>
              <div className="flex items-center gap-2">
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="flex-1 rounded border border-border-log bg-ink px-2 py-1.5 text-sm outline-none focus:border-brass"
                >
                  <option value="">Sans catégorie</option>
                  {catOptions.map((c: Cat) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <IconButton
                  ariaLabel="Ajouter une catégorie"
                  onClick={() => {
                    setCatForm((v) => !v);
                    setCatError("");
                  }}
                  variant="surface"
                  className="h-8 w-8 shrink-0"
                >
                  <PlusIcon className="w-3.5 h-3.5" />
                </IconButton>
              </div>

              {catForm && (
                <div className="mt-2 space-y-2 rounded border border-border-log p-2">
                  <p className="text-[11px] text-muted">
                    Sera créée comme catégorie de{" "}
                    <span
                      className={type === "EXPENSE" ? "text-rust" : "text-teal-log"}
                    >
                      {type === "EXPENSE" ? "dépense" : "entrée"}
                    </span>
                  </p>
                  <input
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    placeholder="Nom de la catégorie"
                    className="w-full rounded border border-border-log bg-ink px-2 py-1.5 text-sm outline-none focus:border-brass"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={catColor || "#888888"}
                      onChange={(e) => setCatColor(e.target.value)}
                      className="h-8 w-8 rounded border border-border-log bg-ink cursor-pointer"
                      aria-label="Couleur"
                    />
                    <button
                      onClick={createCategory}
                      disabled={catSaving}
                      className="flex-1 px-3 py-1.5 text-xs rounded font-medium bg-brass text-ink hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      {catSaving && <Spinner />}
                      Créer
                    </button>
                    <button
                      onClick={() => {
                        setCatForm(false);
                        setCatName("");
                        setCatColor("");
                        setCatError("");
                      }}
                      className="px-3 py-1.5 text-xs rounded border border-border-log text-muted hover:text-parchment"
                    >
                      Annuler
                    </button>
                  </div>
                  {catError && <p className="text-xs text-rust">{catError}</p>}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs text-muted mb-1">Note</label>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full rounded border border-border-log bg-ink px-2 py-1.5 text-sm outline-none focus:border-brass"
              />
            </div>

            {error && <p className="text-xs text-rust">{error}</p>}
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <p className="text-xs text-muted mb-1">Type</p>
              <p className="text-sm">{type === "INCOME" ? "Entrée" : "Dépense"}</p>
            </div>
            <div>
              <p className="text-xs text-muted mb-1">Montant</p>
              <p className={`font-mono-log ${type === "INCOME" ? "text-teal-log" : "text-rust"}`}>
                {type === "INCOME" ? "+" : "-"}
                {Number(amount).toLocaleString("fr-FR")} {tx?.currency ?? defaultCurrency}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted mb-1">Date</p>
              <p className="text-sm">{dayjs(date).format("D MMMM YYYY")}</p>
            </div>
            <div>
              <p className="text-xs text-muted mb-1">Catégorie</p>
              <p className="text-sm">
                {categoryId ? (catOptions.find((c: Cat) => c.id === categoryId)?.name ?? "—") : "Sans catégorie"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted mb-1">Note</p>
              <p className="text-sm">{note || "—"}</p>
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
                onClick={onClose}
                className="px-3 py-1.5 text-xs rounded border border-border-log text-muted hover:text-parchment"
              >
                Fermer
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
