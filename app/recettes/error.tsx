"use client";

export default function RecettesError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-surface border border-border-log rounded-md p-6 sm:p-8 text-center">
        <p className="font-display text-lg text-parchment mb-3">
          Impossible de charger cette page
        </p>
        <p className="text-sm text-muted mb-6">
          Vérifie ta connexion, puis réessaie.
        </p>
        <button
          onClick={reset}
          className="w-full border border-brass text-brass py-2.5 rounded hover:bg-brass hover:text-ink transition-colors"
        >
          Réessayer
        </button>
      </div>
    </div>
  );
}
