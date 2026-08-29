"use client";

import { useEffect, useRef, useState } from "react";
import { IconButton, PlusIcon } from "@/app/components/IconButton";
import { reminderSummary } from "@/app/lib/recurrence";

function Spinner({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
      aria-hidden
    />
  );
}

type N = any;
type Rm = any;

export function NotesView({ notes: initial, reminders }: { notes: N[]; reminders: Rm[] }) {
  const [notes, setNotes] = useState<N[]>(initial);
  const [open, setOpen] = useState<{ n?: N } | null>(null);
  const [query, setQuery] = useState("");

  const filtered = notes.filter((n: N) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
    );
  });

  const handleSaved = (updated: N | null, deletedId?: string) => {
    setOpen(null);
    if (deletedId) {
      setNotes((list) => list.filter((x) => x.id !== deletedId));
      return;
    }
    if (updated) {
      setNotes((list) =>
        list.some((x) => x.id === updated.id)
          ? list.map((x) => (x.id === updated.id ? updated : x))
          : [updated, ...list]
      );
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl text-parchment">Notes</h1>
        <IconButton
          ariaLabel="Ajouter une note"
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
        placeholder="Rechercher une note…"
        className="w-full rounded border border-border-log bg-ink px-3 py-2 text-sm outline-none focus:border-brass mb-6"
      />

      {notes.length === 0 ? (
        <p className="text-sm text-muted mb-4">Aucune note pour le moment.</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted mb-4">Aucune note ne correspond.</p>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((n: N) => {
          const linked = n.reminderId
            ? reminders.find((r: Rm) => r.id === n.reminderId)
            : null;
          return (
            <button
              key={n.id}
              onClick={() => setOpen({ n })}
              className="text-left bg-surface border border-border-log rounded-md p-4 hover:border-brass"
            >
              <p className="font-mono-log text-xs text-muted mb-2">
                {new Date(n.updatedAt).toLocaleDateString("fr-FR")}
              </p>
              <p className="text-parchment font-medium mb-1 truncate">{n.title}</p>
              <p className="text-sm text-muted line-clamp-3 whitespace-pre-line">
                {n.content}
              </p>
              {linked && (
                <span className="inline-block mt-3 text-[11px] font-mono-log text-brass border border-dashed border-brass px-2 py-0.5 -rotate-3">
                  liée à : {linked.title}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {open && (
        <NoteModal
          n={open.n}
          reminders={reminders}
          onClose={() => setOpen(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

function NoteModal({
  n,
  reminders,
  onClose,
  onSaved,
}: {
  n?: N;
  reminders: Rm[];
  onClose: () => void;
  onSaved: (updated: N | null, deletedId?: string) => void;
}) {
  const isNew = !n;
  const [title, setTitle] = useState(n?.title ?? "");
  const [content, setContent] = useState(n?.content ?? "");
  const [reminderId, setReminderId] = useState(n?.reminderId ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const alive = useRef(true);
  useEffect(() => () => {
    alive.current = false;
  }, []);

  const [editing, setEditing] = useState(isNew === true);

  const submit = async () => {
    setError("");
    if (!title.trim()) return setError("Le titre est requis.");
    if (!content.trim()) return setError("Le contenu est requis.");
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        content: content.trim(),
        reminderId: reminderId || undefined,
      };
      const res = isNew
        ? await fetch("/api/notes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch(`/api/notes/${n!.id}`, {
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
      const saved: N = await res.json();
      onSaved(saved);
    } finally {
      if (alive.current) setSaving(false);
    }
  };

  const remove = async () => {
    if (!n) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/notes/${n.id}`, { method: "DELETE" });
      if (res.ok) onSaved(null, n.id);
    } finally {
      if (alive.current) setDeleting(false);
    }
  };

  const canSave = title.trim().length > 0 && content.trim().length > 0;

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
            {isNew ? "Nouvelle note" : editing ? "Modifier la note" : n?.title}
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
              <label className="block text-xs text-muted mb-1">Contenu</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
                className="w-full rounded border border-border-log bg-ink px-2 py-1.5 text-sm outline-none focus:border-brass"
              />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">
                Lier à un rappel (optionnel)
              </label>
              <select
                value={reminderId}
                onChange={(e) => setReminderId(e.target.value)}
                className="w-full rounded border border-border-log bg-ink px-2 py-1.5 text-sm outline-none focus:border-brass"
              >
                <option value="">Aucun</option>
                {reminders.map((r: Rm) => (
                  <option key={r.id} value={r.id}>
                    {r.title}
                  </option>
                ))}
              </select>
            </div>
            {error && <p className="text-xs text-rust">{error}</p>}
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <p className="text-xs text-muted mb-1">Titre</p>
              <p className="text-sm">{n?.title}</p>
            </div>
            <div>
              <p className="text-xs text-muted mb-1">Contenu</p>
              <p className="text-sm whitespace-pre-line">{n?.content}</p>
            </div>
            {n?.reminderId &&
              (() => {
                const linked = reminders.find((r: Rm) => r.id === n.reminderId);
                if (!linked) return null;
                const s = reminderSummary(linked);
                return (
                  <div>
                    <p className="text-xs text-muted mb-1">Rappel lié</p>
                    <p className="text-sm text-brass font-medium">
                      {linked.title}
                    </p>
                    <dl className="mt-2 space-y-1 text-sm">
                      <div className="flex gap-2">
                        <dt className="text-muted w-24 shrink-0">
                          Pour quoi&nbsp;?
                        </dt>
                        <dd>{s.typeLabel}</dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="text-muted w-24 shrink-0">Échéance</dt>
                        <dd>{s.due ?? "—"}</dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="text-muted w-24 shrink-0">Statut</dt>
                        <dd>{s.statusLabel}</dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="text-muted w-24 shrink-0">
                          Plus tard
                        </dt>
                        <dd className="text-muted">{s.behavior}</dd>
                      </div>
                    </dl>
                  </div>
                );
              })()}
          </div>
        )}

        <div className="flex items-center justify-between mt-4">
          <div>
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
