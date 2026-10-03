"use client";

import { useEffect, useState } from "react";

// Durée minimale d'affichage avant d'entamer le fondu de sortie. En PWA
// installée (display-mode: standalone), le splash natif Android/WebAPK
// reste visible plus longtemps au démarrage à froid qu'un simple onglet de
// navigateur ; avec un délai identique dans les deux cas, ce logo finissait
// déjà démonté avant que le splash natif ne se lève, donc jamais vu.
const VISIBLE_MS = 650;
const VISIBLE_MS_STANDALONE = 1600;
const FADE_MS = 350; // doit rester synchro avec la transition de .initial-loading

export function InitialLoading() {
  const [hiding, setHiding] = useState(false);
  const [mounted, setMounted] = useState(true);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches;
    const timeout = window.setTimeout(
      () => setHiding(true),
      standalone ? VISIBLE_MS_STANDALONE : VISIBLE_MS
    );
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!hiding) return;
    const timeout = window.setTimeout(() => setMounted(false), FADE_MS);
    return () => window.clearTimeout(timeout);
  }, [hiding]);

  if (!mounted) return null;

  return (
    <div
      className={`initial-loading${hiding ? " initial-loading--hidden" : ""}`}
      role="status"
      aria-label="Chargement de Rapply"
    >
      <img src="/logo-ben-512.png" alt="Rapply" className="initial-loading__logo" />
    </div>
  );
}
