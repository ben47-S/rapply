"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CURRENCIES, CURRENCY_LABELS } from "@/app/lib/currencies";
import { BackButton, DownloadIcon } from "@/app/components/IconButton";

function Spinner({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
      aria-hidden
    />
  );
}

export function SettingsView({
  currency: initial,
  totalIncome,
  totalExpense,
  categories: initialCategories,
}: {
  currency: string;
  totalIncome: number;
  totalExpense: number;
  categories: any[];
}) {
  const router = useRouter();
  const [currency, setCurrency] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [cats, setCats] = useState<any[]>(initialCategories);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState({ name: "", color: "" });
  const [catSaving, setCatSaving] = useState(false);
  const [catError, setCatError] = useState("");

  const [addingType, setAddingType] = useState<"EXPENSE" | "INCOME" | null>(null);
  const [newCatName, setNewCatName] = useState("");
  const [newCatColor, setNewCatColor] = useState("#C89B3C");
  const [newCatSaving, setNewCatSaving] = useState(false);
  const [newCatError, setNewCatError] = useState("");
  const alive = useRef(true);
  useEffect(() => () => {
    alive.current = false;
  }, []);

  const createCategory = async (type: "EXPENSE" | "INCOME") => {
    setNewCatError("");
    if (!newCatName.trim()) return setNewCatError("Le nom est requis.");
    setNewCatSaving(true);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCatName.trim(),
          type,
          color: newCatColor || undefined,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        return setNewCatError(
          d?.error?.formErrors?.join(", ") || d?.error || "Erreur lors de la création."
        );
      }
      const created = await res.json();
      setCats((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setAddingType(null);
      setNewCatName("");
      setNewCatColor("#C89B3C");
    } finally {
      if (alive.current) setNewCatSaving(false);
    }
  };

  const startEdit = (c: any) => {
    setEditingId(c.id);
    setDraft({ name: c.name, color: c.color || "#888888" });
    setCatError("");
  };

  const saveCat = async (c: any) => {
    setCatError("");
    if (!draft.name.trim()) return setCatError("Nom requis.");
    setCatSaving(true);
    try {
      const res = await fetch(`/api/categories/${c.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: draft.name.trim(),
          type: c.type,
          color: draft.color || undefined,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        return setCatError(d?.error?.formErrors?.join(", ") || "Erreur.");
      }
      const updated = await res.json();
      setCats((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
      setEditingId(null);
    } finally {
      if (alive.current) setCatSaving(false);
    }
  };

  const deleteCat = async (c: any) => {
    if (
      !confirm(
        "Supprimer cette catégorie ? Les budgets liés seront aussi supprimés."
      )
    )
      return;
    const res = await fetch(`/api/categories/${c.id}`, { method: "DELETE" });
    if (res.ok) setCats((prev) => prev.filter((x) => x.id !== c.id));
  };

  const save = async () => {
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currency }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return setError(data?.error || "Erreur lors de l'enregistrement.");
      }
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const revokeAllSessions = async () => {
    if (
      !confirm(
        "Voulez-vous déconnecter tous vos appareils ? Vous devrez vous reconnecter."
      )
    ) {
      return;
    }
    await fetch("/api/auth/revoke", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <BackButton />
        <h1 className="font-display text-2xl text-parchment">Paramètres</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 max-w-md lg:max-w-none">
        <div className="bg-surface border border-border-log rounded-md px-4 py-5">
          <p className="text-[11px] uppercase tracking-widest text-muted mb-1">
            Revenus
          </p>
          <p className="font-mono-log text-xl sm:text-2xl text-teal-log truncate">
            +{Number(totalIncome).toLocaleString("fr-FR")} {currency}
          </p>
          <p className="text-[10px] text-muted mt-1">Depuis la création du compte</p>
        </div>
        <div className="bg-surface border border-border-log rounded-md px-4 py-5">
          <p className="text-[11px] uppercase tracking-widest text-muted mb-1">
            Dépenses
          </p>
          <p className="font-mono-log text-xl sm:text-2xl text-rust truncate">
            -{Number(totalExpense).toLocaleString("fr-FR")} {currency}
          </p>
          <p className="text-[10px] text-muted mt-1">Depuis la création du compte</p>
        </div>
      </div>

      <div className="bg-surface border border-border-log rounded-md px-4 py-5 max-w-md lg:max-w-none">
        <p className="text-[11px] uppercase tracking-widest text-muted mb-1">
          Devise par défaut
        </p>
        <p className="text-xs text-muted mb-3">
          Utilisée pour les nouvelles transactions. Chaque transaction conserve la
          devise avec laquelle elle a été enregistrée.
        </p>
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          className="w-full rounded border border-border-log bg-ink px-2 py-1.5 text-sm outline-none focus:border-brass mb-3"
        >
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>
              {CURRENCY_LABELS[c] ?? c}
            </option>
          ))}
        </select>
        {error && <p className="text-xs text-rust mb-2">{error}</p>}
        <button
          onClick={save}
          disabled={saving || currency === initial}
          className={`px-3 py-1.5 text-xs rounded font-medium flex items-center gap-1.5 ${
            saving || currency === initial
              ? "bg-surface-raised text-muted cursor-not-allowed"
              : "bg-brass text-ink hover:opacity-90 cursor-pointer"
          }`}
        >
          {saving && <Spinner />}
          Enregistrer
        </button>
      </div>

      <div className="max-w-md lg:max-w-none mt-6">
        <h2 className="font-display text-lg text-parchment mb-3">Catégories</h2>
        {([
          { type: "EXPENSE", label: "Dépenses" },
          { type: "INCOME", label: "Entrées" },
        ] as const).map((g) => {
          const group = cats.filter((c) => c.type === g.type);
          return (
            <div key={g.type} className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] uppercase tracking-widest text-muted">
                  {g.label}
                </p>
                <button
                  onClick={() => {
                    if (addingType === g.type) {
                      setAddingType(null);
                    } else {
                      setAddingType(g.type);
                      setNewCatName("");
                      setNewCatColor(g.type === "EXPENSE" ? "#B24B3E" : "#4C8577");
                      setNewCatError("");
                    }
                  }}
                  className="text-xs text-brass hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {addingType === g.type ? "✕ Fermer" : "+ Ajouter"}
                </button>
              </div>

              {addingType === g.type && (
                <div className="mb-3 p-3 bg-surface border border-border-log rounded space-y-2">
                  <p className="text-xs text-parchment font-medium">
                    Nouvelle catégorie ({g.label.toLowerCase()})
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      placeholder="Nom de la catégorie"
                      className="flex-1 min-w-[10rem] rounded border border-border-log bg-ink px-2 py-1 text-sm outline-none focus:border-brass"
                      autoFocus
                    />
                    <input
                      type="color"
                      value={newCatColor}
                      onChange={(e) => setNewCatColor(e.target.value)}
                      className="h-8 w-8 rounded border border-border-log bg-ink cursor-pointer"
                      aria-label="Couleur"
                    />
                    <button
                      onClick={() => createCategory(g.type)}
                      disabled={newCatSaving}
                      className="px-3 py-1 text-xs rounded font-medium bg-brass text-ink hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                    >
                      {newCatSaving && <Spinner />}
                      Créer
                    </button>
                    <button
                      onClick={() => {
                        setAddingType(null);
                        setNewCatName("");
                        setNewCatError("");
                      }}
                      className="px-2 py-1 text-xs rounded border border-border-log text-muted hover:text-parchment cursor-pointer"
                    >
                      Annuler
                    </button>
                  </div>
                  {newCatError && <p className="text-xs text-rust">{newCatError}</p>}
                </div>
              )}

              <div className="space-y-2">
                {group.length === 0 && (
                  <p className="text-xs text-muted">Aucune catégorie.</p>
                )}
                {group.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center gap-2 bg-surface border border-border-log rounded px-3 py-2"
                  >
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{
                        backgroundColor: c.color || "var(--color-surface-raised)",
                      }}
                    />
                    {editingId === c.id ? (
                      <div className="flex flex-1 flex-wrap items-center gap-2">
                        <input
                          value={draft.name}
                          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                          placeholder="Nom"
                          className="flex-1 min-w-[8rem] rounded border border-border-log bg-ink px-2 py-1 text-sm outline-none focus:border-brass"
                        />
                        <input
                          type="color"
                          value={draft.color}
                          onChange={(e) => setDraft({ ...draft, color: e.target.value })}
                          className="h-8 w-8 rounded border border-border-log bg-ink cursor-pointer"
                          aria-label="Couleur"
                        />
                        <button
                          onClick={() => saveCat(c)}
                          disabled={catSaving}
                          className="px-2 py-1 text-xs rounded font-medium bg-brass text-ink hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5"
                        >
                          {catSaving && <Spinner />}
                          OK
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-2 py-1 text-xs rounded border border-border-log text-muted hover:text-parchment"
                        >
                          Annuler
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="flex-1 min-w-0 truncate text-sm">
                          {c.name}
                        </span>
                        <button
                          onClick={() => startEdit(c)}
                          className="text-muted hover:text-parchment text-xs shrink-0"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => deleteCat(c)}
                          aria-label="Supprimer"
                          className="text-rust hover:underline text-xs shrink-0"
                        >
                          Supprimer
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
              {catError && editingId && (
                <p className="text-xs text-rust mt-1">{catError}</p>
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-surface border border-border-log rounded-md px-4 py-5 max-w-md lg:max-w-none mt-6">
        <h2 className="font-display text-base text-parchment mb-1">
          Sauvegarde & Export des données
        </h2>
        <p className="text-xs text-muted mb-4">
          Téléchargez une copie complète au format JSON de toutes vos données (rappels, notes, transactions, budgets, emploi du temps).
        </p>
        <a
          href="/api/export"
          download
          className="inline-flex items-center gap-2 px-3 py-2 text-xs rounded font-medium border border-border-log bg-ink hover:border-brass text-parchment transition-colors cursor-pointer"
        >
          <DownloadIcon className="w-4 h-4 text-brass" />
          Exporter toutes les données (JSON)
        </a>
      </div>

      <div className="max-w-md lg:max-w-none mt-6 flex flex-wrap items-center gap-3">
        <button
          onClick={logout}
          className="px-3 py-1.5 text-xs rounded font-medium border border-border-log text-muted hover:text-parchment hover:border-parchment transition-colors cursor-pointer"
        >
          Se déconnecter
        </button>
        <button
          onClick={revokeAllSessions}
          className="px-3 py-1.5 text-xs rounded font-medium border border-rust text-rust hover:bg-rust hover:text-ink transition-colors cursor-pointer"
        >
          Déconnecter tous les appareils
        </button>
      </div>
    </div>
  );
}
