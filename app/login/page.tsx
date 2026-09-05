"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CustomsStamp } from "@/app/components/CustomsStamp";
import { BorderTicker } from "@/app/components/BorderTicker";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [blockedUntil, setBlockedUntil] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());

  const emailWrapRef = useRef<HTMLDivElement>(null);
  const passwordWrapRef = useRef<HTMLDivElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const countdownRef = useRef<HTMLParagraphElement>(null);

  const stamping = blockedUntil !== null && now < blockedUntil;
  const secondsLeft = blockedUntil ? Math.max(0, Math.ceil((blockedUntil - now) / 1000)) : 0;

  // Tick chaque seconde pour le compte à rebours + savoir quand ça se termine
  useEffect(() => {
    if (!blockedUntil) return;
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, [blockedUntil]);

  // Fait tout bouger (champs, titre, message, bouton) tant que stamping est actif
  useEffect(() => {
    if (!stamping) {
      [emailWrapRef.current, passwordWrapRef.current, errorRef.current, countdownRef.current].forEach((el) => {
        if (!el) return;
        el.style.position = "";
        el.style.left = "";
        el.style.top = "";
        el.style.transform = "";
        el.style.zIndex = "";
      });
      return;
    }

    let raf: number;
    const startTime = performance.now();
    const REVOLUTION_MS = 14000;

    const centerX = 50;
    const centerY = 48;
    const radiusX = 28;
    const radiusY = 22;

    function animate(t: number) {
      const elapsed = t - startTime;
      const baseAngle = (elapsed / REVOLUTION_MS) * Math.PI * 2;

      [
        { el: emailWrapRef.current, phase: 0, speedFactor: 1, radius: 1 },
        { el: passwordWrapRef.current, phase: Math.PI, speedFactor: 1.1, radius: 1 },
        { el: countdownRef.current, phase: Math.PI + 0.6, speedFactor: 1, radius: 0.55 },
        { el: errorRef.current, phase: 4.2, speedFactor: 1.15, radius: 0.4 },
      ].forEach(({ el, phase, speedFactor, radius }) => {
        if (!el) return;
        const angle = baseAngle * speedFactor + phase;

        const wobbleX = Math.sin(elapsed / 3900 + phase) * 3 * radius;
        const wobbleY = Math.cos(elapsed / 4600 + phase) * 2.5 * radius;

        const x = centerX + Math.cos(angle) * radiusX * radius + wobbleX;
        const y = centerY + Math.sin(angle) * radiusY * radius + wobbleY;
        const rotate = Math.sin(angle) * 8;

        el.style.position = "fixed";
        el.style.zIndex = "40";
        el.style.left = `${x}vw`;
        el.style.top = `${y}vh`;
        el.style.transform = `translate(-50%, -50%) rotate(${rotate}deg)`;
      });

      raf = requestAnimationFrame(animate);
    }

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [stamping]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (stamping) return;
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (res.status === 429) {
      setLoading(false);
      const retryAfter = Number(res.headers.get("Retry-After")) || 900;
      setNow(Date.now());
      setBlockedUntil(Date.now() + retryAfter * 1000);
      return;
    }

    if (!res.ok) {
      setLoading(false);
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Identifiants invalides");
      return;
    }

    router.push("/");
  }

  const minutesLeft = Math.floor(secondsLeft / 60);
  const secsLeft = secondsLeft % 60;

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-surface border border-border-log rounded-md p-6 sm:p-8 relative">
        <p className="font-display text-2xl text-parchment mb-6">Rapply</p>

        <div
          ref={emailWrapRef}
          className="w-[260px]"
        >
          <label className="block text-xs uppercase tracking-widest text-muted mb-1">Email</label>
          <input
            type="email"
            value={email}
            disabled={stamping}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-ink border border-border-log rounded px-3 py-2.5 text-parchment mb-4 focus:outline-none focus:border-brass disabled:opacity-70 shadow-lg"
          />
        </div>

        <div
          ref={passwordWrapRef}
          className="w-[260px]"
        >
          <label className="block text-xs uppercase tracking-widest text-muted mb-1">Mot de passe</label>
          <input
            type="password"
            value={password}
            disabled={stamping}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-ink border border-border-log rounded px-3 py-2.5 text-parchment mb-4 focus:outline-none focus:border-brass disabled:opacity-70 shadow-lg"
          />
        </div>

        {error && (
          <p
            ref={errorRef}
            className="text-rust text-sm mb-4 font-mono-log"
          >{error}</p>
        )}

        {stamping && (
          <p
            ref={countdownRef}
            className="text-center text-rust font-mono-log text-sm mb-4"
          >
            Réessaie dans {minutesLeft}:{secsLeft.toString().padStart(2, "0")}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || stamping}
          className="w-full border border-brass text-brass py-2.5 rounded hover:bg-brass hover:text-ink transition-colors disabled:opacity-50"
        >
          {loading ? (
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-brass border-t-transparent align-middle" />
          ) : (
            "Se connecter"
          )}
        </button>
      </form>

      {stamping && (
        <>
          <div className="fixed inset-0 alarm-vignette pointer-events-none z-30" />
          <CustomsStamp />
          <BorderTicker />
        </>
      )}
    </div>
  );
}
