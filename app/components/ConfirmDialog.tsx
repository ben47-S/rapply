"use client";

import { useEffect } from "react";

export function ConfirmDialog({
  title,
  message,
  confirmLabel = "Supprimer",
  cancelLabel = "Annuler",
  onCancel,
  onConfirm,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onCancel]);

  return (
    <div
      className="pwa-sheet-overlay fixed inset-0 flex items-end sm:items-center justify-center bg-black/70 p-0 sm:p-4"
      style={{ zIndex: 70 }}
      onClick={onCancel}
      role="alertdialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="pwa-sheet w-full sm:max-w-sm rounded-t-2xl sm:rounded-lg bg-surface border-0 sm:border border-border-log p-4 text-parchment"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display text-base mb-1">{title}</h2>
        <p className="text-sm text-muted">{message}</p>
        <div className="flex gap-2 mt-4 justify-end">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-xs rounded border border-border-log text-muted hover:text-parchment"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="px-3 py-1.5 text-xs rounded font-medium bg-rust text-ink hover:opacity-90 cursor-pointer"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
