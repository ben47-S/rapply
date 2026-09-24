"use client";

import { useEffect, useState } from "react";

export function InitialLoading() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timeout = window.setTimeout(() => setVisible(false), 650);
    return () => window.clearTimeout(timeout);
  }, []);

  if (!visible) return null;

  return (
    <div className="initial-loading" role="status" aria-label="Chargement de Rapply">
      <img src="/logo-ben-512.png" alt="Rapply" className="initial-loading__logo" />
    </div>
  );
}
