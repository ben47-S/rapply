"use client";

import { useEffect, useRef, useState } from "react";
import { IconButton, PlusIcon } from "@/app/components/IconButton";

function Spinner({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
      aria-hidden
    />
  );
}

type R = any;
type Ing = any;
type Step = any;

const DIFFICULTY_LABELS: Record<string, string> = {
  EASY: "Facile",
  MEDIUM: "Moyen",
  HARD: "Difficile",
};

const UNITS = [
  "g",
  "kg",
  "mg",
  "ml",
  "cl",
  "l",
  "cuillère à café",
  "cuillère à soupe",
  "pièce",
  "demi",
  "quart",
  "tranche",
  "pincée",
  "verre",
  "tasse",
  "boîte",
];

const onlyDigits = (v: string) => v.replace(/[^\d]/g, "");

const onlyDecimal = (v: string) => {
  const cleaned = v.replace(/[^\d.]/g, "");
  const firstDot = cleaned.indexOf(".");
  return firstDot === -1
    ? cleaned
    : cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, "");
};

const isModKey = (e: React.KeyboardEvent) =>
  e.ctrlKey || e.metaKey || e.altKey;

const blockNonDigitKey = (e: React.KeyboardEvent) => {
  if (e.key.length === 1 && !/[\d]/.test(e.key) && !isModKey(e)) {
    e.preventDefault();
  }
};

const blockNonDecimalKey = (e: React.KeyboardEvent) => {
  if (e.key.length === 1 && !/[\d.]/.test(e.key) && !isModKey(e)) {
    e.preventDefault();
  }
};

function formatCost(r: R): string {
  return Number(r.estimatedCost).toLocaleString("fr-FR");
}

export function RecipesView({
  initial,
  currency,
}: {
  initial: R[];
  currency: string;
}) {
  const [recipes, setRecipes] = useState<R[]>(initial);
  const [open, setOpen] = useState<{ r?: R } | null>(null);
  const [query, setQuery] = useState("");

  const filtered = recipes.filter((r: R) => {
    if (!query.trim()) return true;
    return r.title.toLowerCase().includes(query.toLowerCase());
  });

  const handleSaved = (updated: R | null, deletedId?: string) => {
    setOpen(null);
    if (deletedId) {
      setRecipes((list) => list.filter((x) => x.id !== deletedId));
      return;
    }
    if (updated) {
      setRecipes((list) =>
        list.some((x) => x.id === updated.id)
          ? list.map((x) => (x.id === updated.id ? updated : x))
          : [updated, ...list]
      );
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl text-parchment">Recettes</h1>
        <IconButton
          ariaLabel="Ajouter une recette"
          onClick={() => setOpen({})}
          variant="brass"
          className="h-7 w-7 sm:h-6 sm:w-6"
        >
          <PlusIcon className="w-3.5 h-3.5 sm:w-3.5 sm:h-3.5" />
        </IconButton>
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Rechercher une recette…"
        className="w-full rounded border border-border-log bg-ink px-3 py-2 text-sm outline-none focus:border-brass mb-6"
      />

      {recipes.length === 0 ? (
        <p className="text-sm text-muted mb-4">Aucune recette pour le moment.</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted mb-4">Aucune recette ne correspond.</p>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((r: R) => (
          <button
            key={r.id}
            onClick={() => setOpen({ r })}
            className="text-left bg-surface border border-border-log rounded-md p-4 hover:border-brass"
          >
            <div className="flex items-start gap-3">
              {r.photoUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={r.photoUrl}
                  alt=""
                  className="w-16 h-16 rounded object-cover shrink-0"
                />
              ) : null}
              <div className="min-w-0 flex-1">
                <p className="text-parchment font-medium mb-1 truncate">
                  {r.title}
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs mt-2">
                  {r.difficulty && (
                    <span
                      className={`border-b px-1 py-0.5 ${
                        r.difficulty === "HARD"
                          ? "text-rust border-rust"
                          : r.difficulty === "MEDIUM"
                          ? "text-amber border-amber"
                          : "text-teal-log border-teal-log"
                      }`}
                    >
                      {DIFFICULTY_LABELS[r.difficulty]}
                    </span>
                  )}
                  {r.prepTime != null && (
                    <span className="inline-flex items-baseline gap-1">
                      <span className="uppercase tracking-wider text-[10px] text-muted">
                        Prép
                      </span>
                      <span className="text-parchment">{r.prepTime} min</span>
                    </span>
                  )}
                  {r.cookTime != null && (
                    <span className="inline-flex items-baseline gap-1">
                      <span className="uppercase tracking-wider text-[10px] text-muted">
                        Cuisson
                      </span>
                      <span className="text-parchment">{r.cookTime} min</span>
                    </span>
                  )}
                  {r.servings != null && (
                    <span className="inline-flex items-baseline gap-1">
                      <span className="uppercase tracking-wider text-[10px] text-muted">
                        Portions
                      </span>
                      <span className="text-parchment">{r.servings}</span>
                    </span>
                  )}
                  {r.estimatedCost != null && (
                    <span className="inline-flex items-baseline gap-1">
                      <span className="uppercase tracking-wider text-[10px] text-brass">
                        Coût
                      </span>
                      <span className="text-brass">~{formatCost(r)} {currency}</span>
                    </span>
                  )}
                </div>
                {r.description && (
                  <p className="text-sm text-muted mt-2">
                    {r.description}
                  </p>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {open && (
        <RecipeModal
          r={open.r}
          currency={currency}
          onClose={() => setOpen(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

function RecipeModal({
  r,
  currency,
  onClose,
  onSaved,
}: {
  r?: R;
  currency: string;
  onClose: () => void;
  onSaved: (updated: R | null, deletedId?: string) => void;
}) {
  const isNew = !r;
  const [title, setTitle] = useState(r?.title ?? "");
  const [description, setDescription] = useState(r?.description ?? "");
  const [servings, setServings] = useState(r?.servings?.toString() ?? "");
  const [prepTime, setPrepTime] = useState(r?.prepTime?.toString() ?? "");
  const [cookTime, setCookTime] = useState(r?.cookTime?.toString() ?? "");
  const [difficulty, setDifficulty] = useState(r?.difficulty ?? "");
  const [estimatedCost, setEstimatedCost] = useState(
    r?.estimatedCost != null ? String(r.estimatedCost) : ""
  );

  const [ingredients, setIngredients] = useState<Ing[]>(
    r?.ingredients?.map((i: Ing) => ({ ...i })) ?? []
  );
  const [steps, setSteps] = useState<Step[]>(
    r?.steps?.map((s: Step) => ({ ...s })) ?? []
  );
  const [accessories, setAccessories] = useState<any[]>(
    r?.accessories?.map((a: any) => ({ ...a })) ?? []
  );

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [shoppingSaving, setShoppingSaving] = useState(false);
  const [shoppingCreated, setShoppingCreated] = useState(false);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const [mode, setMode] = useState<"view" | "edit">(isNew ? "edit" : "view");
  const editing = mode === "edit";

  const addIngredient = () =>
    setIngredients((l) => [...l, { name: "", quantity: "", unit: "" }]);
  const updateIngredient = (idx: number, patch: Partial<Ing>) =>
    setIngredients((l) =>
      l.map((ig, i) => (i === idx ? { ...ig, ...patch } : ig))
    );
  const removeIngredient = (idx: number) =>
    setIngredients((l) => l.filter((_, i) => i !== idx));

  const addStep = () =>
    setSteps((l) => [...l, { order: l.length, instruction: "", duration: "" }]);
  const updateStep = (idx: number, patch: Partial<Step>) =>
    setSteps((l) => l.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  const removeStep = (idx: number) =>
    setSteps((l) =>
      l
        .filter((_, i) => i !== idx)
        .map((s, i) => ({ ...s, order: i }))
    );

  const addAccessory = () => setAccessories((l) => [...l, { name: "" }]);
  const updateAccessory = (idx: number, name: string) =>
    setAccessories((l) => l.map((a, i) => (i === idx ? { ...a, name } : a)));
  const removeAccessory = (idx: number) =>
    setAccessories((l) => l.filter((_, i) => i !== idx));

  const submit = async () => {
    setError("");
    if (!title.trim()) return setError("Le titre est requis.");
    if (ingredients.some((ig) => !ig.name.trim()))
      return setError("Chaque ingrédient doit avoir un nom.");
    if (steps.some((s) => !s.instruction.trim()))
      return setError("Chaque étape doit avoir un texte.");
    if (accessories.some((a) => !a.name.trim()))
      return setError("Chaque accessoire doit avoir un nom.");
    setSaving(true);
    try {
      const payload: any = {
        title: title.trim(),
        description: description.trim() || undefined,
        servings: servings ? Number(servings) : undefined,
        prepTime: prepTime ? Number(prepTime) : undefined,
        cookTime: cookTime ? Number(cookTime) : undefined,
        difficulty: difficulty || undefined,
        estimatedCost: estimatedCost ? Number(estimatedCost) : undefined,
        ingredients: ingredients.map((ig) => ({
          id: ig.id || undefined,
          name: ig.name.trim(),
          quantity: ig.quantity === "" || ig.quantity == null ? null : Number(ig.quantity),
          unit: ig.unit?.trim() || null,
        })),
        steps: steps.map((s) => ({
          id: s.id || undefined,
          order: s.order,
          instruction: s.instruction.trim(),
          duration:
            s.duration === "" || s.duration == null ? null : Number(s.duration),
        })),
        accessories: accessories.map((a) => ({
          id: a.id || undefined,
          name: a.name.trim(),
        })),
      };
      const res = isNew
        ? await fetch("/api/recipes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch(`/api/recipes/${r!.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return setError(
          data?.error?.formErrors?.join(", ") ||
            data?.error ||
            "Erreur lors de l'enregistrement."
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
      const res = await fetch(`/api/recipes/${r.id}`, { method: "DELETE" });
      if (res.ok) onSaved(null, r.id);
    } finally {
      if (alive.current) setDeleting(false);
    }
  };

  const makeShoppingList = async () => {
    if (!r) return;
    setShoppingSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/recipes/${r.id}/shopping-list`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return setError(data?.error || "Erreur lors de la création.");
      }
      setShoppingCreated(true);
    } finally {
      if (alive.current) setShoppingSaving(false);
    }
  };

  const canSave = title.trim().length > 0;

  const inputCls =
    "rounded border border-border-log bg-ink px-2 py-1.5 text-sm outline-none focus:border-brass";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-lg bg-surface border-0 sm:border border-border-log p-4 text-parchment"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-lg">
            {isNew ? "Nouvelle recette" : editing ? "Modifier la recette" : r.title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="text-muted hover:text-parchment text-sm"
          >
            ✕
          </button>
        </div>

        {!editing ? (
          // ---------- MODE PRÉSENTATION (lecture seule) ----------
          <div className="space-y-4">
            {r.photoUrl && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={r.photoUrl} alt="" className="w-full h-40 object-cover rounded" />
            )}

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
              {r.difficulty && (
                <span
                  className={`border-b px-1 py-0.5 ${
                    r.difficulty === "HARD"
                      ? "text-rust border-rust"
                      : r.difficulty === "MEDIUM"
                      ? "text-amber border-amber"
                      : "text-teal-log border-teal-log"
                  }`}
                >
                  {DIFFICULTY_LABELS[r.difficulty]}
                </span>
              )}
              {r.prepTime != null && (
                <span className="inline-flex items-baseline gap-1">
                  <span className="uppercase tracking-wider text-[10px] text-muted">
                    Prép
                  </span>
                  <span className="text-parchment">{r.prepTime} min</span>
                </span>
              )}
              {r.cookTime != null && (
                <span className="inline-flex items-baseline gap-1">
                  <span className="uppercase tracking-wider text-[10px] text-muted">
                    Cuisson
                  </span>
                  <span className="text-parchment">{r.cookTime} min</span>
                </span>
              )}
              {r.servings != null && (
                <span className="inline-flex items-baseline gap-1">
                  <span className="uppercase tracking-wider text-[10px] text-muted">
                    Portions
                  </span>
                  <span className="text-parchment">{r.servings}</span>
                </span>
              )}
              {r.estimatedCost != null && (
                <span className="inline-flex items-baseline gap-1">
                  <span className="uppercase tracking-wider text-[10px] text-brass">
                    Coût
                  </span>
                  <span className="text-brass">~{formatCost(r)} {currency}</span>
                </span>
              )}
            </div>

            {r.description && <p className="text-sm text-muted">{r.description}</p>}

            {r.ingredients?.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-widest text-muted mb-2">
                  Ingrédients
                </p>
                <ul className="space-y-1">
                  {r.ingredients.map((ig: Ing) => (
                    <li key={ig.id} className="text-sm flex gap-2">
                      <span className="text-brass">•</span>
                      <span>
                        {ig.quantity ? `${ig.quantity} ` : ""}
                        {ig.unit ? `${ig.unit} ` : ""}
                        {ig.name}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {r.accessories?.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-widest text-muted mb-2">
                  Accessoires
                </p>
                <ul className="space-y-1">
                  {r.accessories.map((a: any) => (
                    <li key={a.id} className="text-sm flex gap-2">
                      <span className="text-brass">•</span>
                      <span>{a.name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {r.steps?.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-widest text-muted mb-2">
                  Étapes
                </p>
                <ol className="space-y-2">
                  {[...r.steps]
                    .sort((a: Step, b: Step) => a.order - b.order)
                    .map((s: Step, i: number) => (
                      <li key={s.id} className="text-sm flex gap-2">
                        <span className="font-mono-log text-brass shrink-0">
                          {i + 1}.
                        </span>
                        <span>
                          {s.instruction}
                          {s.duration ? (
                            <span className="text-muted"> ({s.duration} min)</span>
                          ) : (
                            ""
                          )}
                        </span>
                      </li>
                    ))}
                </ol>
              </div>
            )}

            {error && <p className="text-xs text-rust">{error}</p>}

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-3">
                <button
                  onClick={remove}
                  disabled={deleting}
                  className="text-xs text-rust hover:underline disabled:opacity-50 flex items-center gap-1.5"
                >
                  {deleting && <Spinner />} Supprimer
                </button>
                {shoppingCreated ? (
                  <span className="text-xs text-teal-log flex items-center gap-1.5">
                    ✓ Liste de courses créée
                  </span>
                ) : (
                  <button
                    onClick={makeShoppingList}
                    disabled={shoppingSaving}
                    className="text-xs text-brass border border-brass px-2 py-1 rounded hover:bg-brass hover:text-ink disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {shoppingSaving && <Spinner />} Liste de courses
                  </button>
                )}
              </div>
              <button
                onClick={() => setMode("edit")}
                className="px-3 py-1.5 text-xs rounded font-medium bg-brass text-ink hover:opacity-90"
              >
                Modifier
              </button>
            </div>
          </div>
        ) : (
          // ---------- MODE ÉDITION (formulaire) ----------
          <>
            <div className="space-y-3">
            <div>
              <label className="block text-xs text-muted mb-1">Titre *</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={`${inputCls} w-full`}
              />
            </div>

          <div>
            <label className="block text-xs text-muted mb-1">
              Description (optionnel)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className={`${inputCls} w-full`}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted mb-1">
                Portions (optionnel)
              </label>
              <input
                value={servings}
                inputMode="numeric"
                placeholder="ex. 4"
                onKeyDown={blockNonDigitKey}
                onChange={(e) => setServings(onlyDigits(e.target.value))}
                className={`${inputCls} w-full`}
              />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">
                Difficulté (optionnel)
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className={`${inputCls} w-full`}
              >
                <option value="">—</option>
                <option value="EASY">Facile</option>
                <option value="MEDIUM">Moyen</option>
                <option value="HARD">Difficile</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">
                Temps prép (min, optionnel)
              </label>
              <input
                value={prepTime}
                inputMode="numeric"
                placeholder="ex. 15"
                onKeyDown={blockNonDigitKey}
                onChange={(e) => setPrepTime(onlyDigits(e.target.value))}
                className={`${inputCls} w-full`}
              />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">
                Temps cuisson (min, optionnel)
              </label>
              <input
                value={cookTime}
                inputMode="numeric"
                placeholder="ex. 25"
                onKeyDown={blockNonDigitKey}
                onChange={(e) => setCookTime(onlyDigits(e.target.value))}
                className={`${inputCls} w-full`}
              />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">
                Coût estimé (optionnel)
              </label>
              <input
                value={estimatedCost}
                inputMode="decimal"
                placeholder="ex. 4500"
                onKeyDown={blockNonDecimalKey}
                onChange={(e) => setEstimatedCost(onlyDecimal(e.target.value))}
                className={`${inputCls} w-full`}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs text-muted">Ingrédients *</label>
              <button
                onClick={addIngredient}
                className="text-xs text-brass hover:underline flex items-center gap-1"
              >
                + Ajouter
              </button>
            </div>
            <div className="space-y-2">
              {ingredients.length === 0 && (
                <p className="text-xs text-muted">
                  Aucun ingrédient. Ajoutez-en au moins un.
                </p>
              )}
              {ingredients.map((ig, idx) => (
                <div key={idx} className="border border-border-log rounded p-2 space-y-2">
                  <div className="flex gap-2 items-center">
                    <input
                      value={ig.name}
                      onChange={(e) =>
                        updateIngredient(idx, { name: e.target.value })
                      }
                      placeholder="Nom de l'ingrédient"
                      className={`${inputCls} flex-1 min-w-0`}
                    />
                    <button
                      onClick={() => removeIngredient(idx)}
                      aria-label="Supprimer l'ingrédient"
                      className="text-rust hover:underline text-sm shrink-0"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <input
                      value={ig.quantity ?? ""}
                      inputMode="decimal"
                      placeholder="Qté"
                      onKeyDown={blockNonDecimalKey}
                      onChange={(e) =>
                        updateIngredient(idx, { quantity: onlyDecimal(e.target.value) })
                      }
                      className={`${inputCls} w-24 shrink-0`}
                    />
                    <select
                      value={ig.unit ?? ""}
                      onChange={(e) =>
                        updateIngredient(idx, { unit: e.target.value })
                      }
                      className={`${inputCls} flex-1 min-w-0`}
                    >
                      <option value="">—</option>
                      {UNITS.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs text-muted">
                Accessoires (optionnel)
              </label>
              <button
                onClick={addAccessory}
                className="text-xs text-brass hover:underline flex items-center gap-1"
              >
                + Ajouter
              </button>
            </div>
            <div className="space-y-2">
              {accessories.length === 0 && (
                <p className="text-xs text-muted">
                  Aucun accessoire (casserole, four…).
                </p>
              )}
              {accessories.map((a, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input
                    value={a.name}
                    onChange={(e) => updateAccessory(idx, e.target.value)}
                    placeholder="Nom de l'accessoire"
                    className={`${inputCls} flex-1 min-w-0`}
                  />
                  <button
                    onClick={() => removeAccessory(idx)}
                    aria-label="Supprimer l'accessoire"
                    className="text-rust hover:underline text-sm shrink-0"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs text-muted">Étapes *</label>
              <button
                onClick={addStep}
                className="text-xs text-brass hover:underline flex items-center gap-1"
              >
                + Ajouter
              </button>
            </div>
            <div className="space-y-2">
              {steps.length === 0 && (
                <p className="text-xs text-muted">
                  Aucune étape. Ajoutez-en au moins une.
                </p>
              )}
              {steps.map((s, idx) => (
                <div key={idx} className="border border-border-log rounded p-2 space-y-2">
                  <div className="flex gap-2 items-start">
                    <span className="font-mono-log text-sm text-brass mt-1.5 shrink-0 w-5">
                      {idx + 1}.
                    </span>
                    <textarea
                      value={s.instruction}
                      onChange={(e) =>
                        updateStep(idx, { instruction: e.target.value })
                      }
                      rows={2}
                      placeholder="Description de l'étape"
                      className={`${inputCls} flex-1 min-w-0`}
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <input
                      value={s.duration ?? ""}
                      inputMode="numeric"
                      placeholder="min"
                      onKeyDown={blockNonDigitKey}
                      onChange={(e) =>
                        updateStep(idx, { duration: onlyDigits(e.target.value) })
                      }
                      className={`${inputCls} w-20 shrink-0`}
                    />
                    <button
                      onClick={() => removeStep(idx)}
                      aria-label="Supprimer l'étape"
                      className="text-rust hover:underline text-sm shrink-0"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {error && <p className="text-xs text-rust">{error}</p>}
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-3">
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
            </div>
            <div className="flex gap-2 ml-auto">
              <button
                onClick={() => (isNew ? onClose() : setMode("view"))}
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
                {isNew ? "Créer" : "Enregistrer"}
              </button>
            </div>
          </div>
            </>
        )}
      </div>
    </div>
  );
}
