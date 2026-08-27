"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      setError("Identifiants invalides");
      return;
    }

    router.push("/");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-surface border border-border-log rounded-md p-6">
        <p className="font-display text-2xl text-parchment mb-6">Rapply</p>

        <label className="block text-xs uppercase tracking-widest text-muted mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-ink border border-border-log rounded px-3 py-2 text-parchment mb-4 focus:outline-none focus:border-brass"
        />

        <label className="block text-xs uppercase tracking-widest text-muted mb-1">Mot de passe</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-ink border border-border-log rounded px-3 py-2 text-parchment mb-4 focus:outline-none focus:border-brass"
        />

        {error && <p className="text-rust text-sm mb-4 font-mono-log">{error}</p>}

        <button
          type="submit"
          className="w-full border border-brass text-brass py-2 rounded hover:bg-brass hover:text-ink transition-colors"
        >
          Se connecter
        </button>
      </form>
    </div>
  );
}