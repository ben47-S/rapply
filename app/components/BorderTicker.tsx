"use client";

const MESSAGES = [
  "⚠ ACCÈS REFUSÉ — CONTACTEZ UN AGENT DOUANIER ⚠",
  "⚠ DOSSIER INCOMPLET — TAMPON REQUIS ⚠",
  "⚠ SUSPECT NON IDENTIFIÉ — VÉRIFICATION EN COURS ⚠",
];

export function BorderTicker() {
  return (
    <div className="fixed inset-x-0 top-0 z-40 overflow-hidden pointer-events-none bg-rust/90 text-ink">
      <div className="whitespace-nowrap font-mono-log text-xs uppercase tracking-widest py-1 animate-[ticker_12s_linear_infinite]">
        {[...MESSAGES, ...MESSAGES].map((m, i) => (
          <span key={i} className="px-6">
            {m}
          </span>
        ))}
      </div>
    </div>
  );
}
