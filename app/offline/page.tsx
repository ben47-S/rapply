"use client";

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-ink px-4">
      <div className="w-full max-w-sm bg-surface border border-border-log rounded-md p-6 sm:p-8 text-center">
        <p className="font-display text-2xl text-parchment mb-3">Rapply</p>
        <p className="text-sm text-muted mb-6">
          Cette page n&apos;est pas disponible hors ligne. Reconnecte-toi au réseau
          pour continuer.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="w-full border border-brass text-brass py-2.5 rounded hover:bg-brass hover:text-ink transition-colors"
        >
          Réessayer
        </button>
      </div>
    </div>
  );
}
