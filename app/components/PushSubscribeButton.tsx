"use client";

import { useEffect, useState } from "react";

type State = "idle" | "loading" | "granted" | "denied" | "unsupported";

export function PushSubscribeButton() {
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState("");
  const [subscriptionReady, setSubscriptionReady] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testMessage, setTestMessage] = useState("");

  const refreshSubscription = async () => {
    if (!("serviceWorker" in navigator)) return false;
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    setSubscriptionReady(Boolean(subscription));
    return Boolean(subscription);
  };

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setState("unsupported");
        return;
      }
      if (Notification.permission === "granted") {
        setState("granted");
        refreshSubscription().catch(() => setSubscriptionReady(false));
      } else if (Notification.permission === "denied") setState("denied");
    }, 0);
    return () => window.clearTimeout(timeout);
  }, []);

  const subscribe = async () => {
    setError("");
    setTestMessage("");
    setSubscriptionReady(false);
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
      setSubscriptionReady(true);
    } catch {
      setError("Impossible d'activer les notifications.");
      setState("idle");
    }
  };

  const testNotification = async () => {
    setError("");
    setTestMessage("");
    setTesting(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        setSubscriptionReady(false);
        setError("Activez d'abord les notifications sur cet appareil.");
        return;
      }

      const res = await fetch("/api/push/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 410) setSubscriptionReady(false);
        setError(data?.error || "Échec de la notification de test.");
        return;
      }
      setTestMessage("Notification de test envoyée.");
    } catch {
      setError("Impossible d'envoyer la notification de test.");
    } finally {
      setTesting(false);
    }
  };

  const isIOS =
    typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isStandalone =
    typeof window !== "undefined" &&
    (window.matchMedia?.("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true);
  const showIOSHint = isIOS && !isStandalone;

  if (state === "granted") {
    return (
      <div className="flex flex-col items-start gap-2">
        <span className="text-xs text-teal-log">Notifications activées</span>
        <button
          onClick={testNotification}
          disabled={testing || !subscriptionReady}
          className="border border-border-log text-muted text-xs px-3 py-1.5 rounded hover:border-brass hover:text-parchment transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {testing ? "Envoi…" : "Tester la notification"}
        </button>
        {testMessage && <span className="text-xs text-teal-log">{testMessage}</span>}
        {error && <span className="text-xs text-rust">{error}</span>}
      </div>
    );
  }
  if (state === "unsupported") {
    return <span className="text-xs text-muted">Notifications non supportées</span>;
  }
  if (showIOSHint) {
    return (
      <span className="text-xs text-muted">
        Ajoute Rapply à l&apos;écran d&apos;accueil (Partager ▸ Sur l&apos;écran d&apos;accueil) pour
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
