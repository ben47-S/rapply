"use client";

import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";

const STANDALONE_PATHS = new Set(["/login", "/parametres", "/recettes"]);

type Status = "unknown" | "online" | "offline";

function subscribe(onChange: () => void) {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

function getSnapshot(): Status {
  return navigator.onLine ? "online" : "offline";
}

function getServerSnapshot(): Status {
  return "unknown";
}

export function ConnectionBubble() {
  const pathname = usePathname();
  const status = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (status === "unknown") return null;

  const online = status === "online";
  const standalone = STANDALONE_PATHS.has(pathname);

  return (
    <div
      className={[
        "connection-bubble",
        online ? "connection-bubble--online" : "connection-bubble--offline",
        standalone && "connection-bubble--standalone",
      ]
        .filter(Boolean)
        .join(" ")}
      role="status"
      aria-live="polite"
      aria-label={online ? "Connexion réseau active" : "Aucune connexion réseau"}
    >
      <span className="connection-bubble__dot" aria-hidden="true" />
      {!online && <span className="connection-bubble__slash" aria-hidden="true" />}
    </div>
  );
}
