"use client";

import { useEffect, useState } from "react";

type State = "idle" | "loading" | "granted" | "denied" | "unsupported";

export function PushSubscribeButton() {
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setState("unsupported");
      return;
    }
    if (Notification.permission === "granted") setState("granted");
    else if (Notification.permission === "denied") setState("denied");
  }, []);

  const subscribe = async () => {
    setError("");
    setState("loading");
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState("denied");
        return;
      }
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      });
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription),
      });
      if (!res.ok) {
        setError("Échec de l'enregistrement.");
        setState("idle");
        return;
      }
      setState("granted");
    } catch {
      setError("Impossible d'activer les notifications.");
      setState("idle");
    }
  };

  const isIOS =
    typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isStandalone =
    typeof window !== "undefined" &&
    (window.matchMedia?.("(display-mode: standalone)").matches ||
      (navigator as any).standalone === true);
  const showIOSHint = isIOS && !isStandalone;

  if (state === "granted") {
    return <span className="text-xs text-teal-log">Notifications activées</span>;
  }
  if (state === "unsupported") {
    return <span className="text-xs text-muted">Notifications non supportées</span>;
  }
  if (showIOSHint) {
    return (
      <span className="text-xs text-muted">
        Ajoute Rapply à l'écran d'accueil (Partager ▸ Sur l'écran d'accueil) pour
        activer les notifications.
      </span>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={subscribe}
        disabled={state === "loading"}
        className="border border-brass text-brass text-sm px-3 py-1.5 rounded hover:bg-brass hover:text-ink transition-colors disabled:opacity-50"
      >
        {state === "loading" ? "Activation…" : "Activer les notifications"}
      </button>
      {error && <span className="text-xs text-rust">{error}</span>}
    </div>
  );
}
