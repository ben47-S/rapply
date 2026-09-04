"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CustomsStamp } from "@/app/components/CustomsStamp";
import { FloatingChaos } from "@/app/components/FloatingChaos";
import { BorderTicker } from "@/app/components/BorderTicker";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [stamping, setStamping] = useState(false);
  const [chaosCount, setChaosCount] = useState(8);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setChaosCount(window.innerWidth < 640 ? 6 : 12);
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (stamping) return;
    setError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (res.status === 429) {
      // vraiment bloqué (5+ échecs) -> le tampon + le chaos
      setStamping(true);
      setTimeout(() => {
        setStamping(false);
        setPassword("");
      }, 2500);
      return;
    }

    if (!res.ok) {
      // simple erreur -> message normal, pas de tampon
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Identifiants invalides");
      return;
    }

    router.push("/");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-surface border border-border-log rounded-md p-6 sm:p-8">
        <p className="font-display text-2xl text-parchment mb-6">Rapply</p>

        <label className="block text-xs uppercase tracking-widest text-muted mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-ink border border-border-log rounded px-3 py-2.5 text-parchment mb-4 focus:outline-none focus:border-brass"
        />

        <label className="block text-xs uppercase tracking-widest text-muted mb-1">Mot de passe</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-ink border border-border-log rounded px-3 py-2.5 text-parchment mb-4 focus:outline-none focus:border-brass"
        />

        {error && <p className="text-rust text-sm mb-4 font-mono-log">{error}</p>}

        <button
          type="submit"
          disabled={stamping}
          className="w-full border border-brass text-brass py-2.5 rounded hover:bg-brass hover:text-ink transition-colors disabled:opacity-50"
        >
          {stamping ? "…" : "Se connecter"}
        </button>
      </form>

      {stamping && (
        <>
          <div className="fixed inset-0 alarm-vignette pointer-events-none z-30" />
          <CustomsStamp />
          <BorderTicker />
          <FloatingChaos count={chaosCount} />
        </>
      )}
    </div>
  );
}
