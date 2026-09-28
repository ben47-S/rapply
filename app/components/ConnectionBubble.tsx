"use client";

import { useSyncExternalStore } from "react";

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
  const status = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (status === "unknown") return null;

  const online = status === "online";

  return (
    <div
      className={`connection-bubble ${online ? "connection-bubble--online" : "connection-bubble--offline"}`}
      role="status"
      aria-live="polite"
      aria-label={online ? "Connexion réseau active" : "Aucune connexion réseau"}
    >
      <span className="connection-bubble__dot" aria-hidden="true" />
      {!online && <span className="connection-bubble__slash" aria-hidden="true" />}
    </div>
  );
}
