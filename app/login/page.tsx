"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CustomsStamp } from "@/app/components/CustomsStamp";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [stamping, setStamping] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleFail() {
    if (stamping) return;
    setStamping(true);
    timer.current = setTimeout(() => {
      window.location.reload();
    }, 1500);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (stamping) return;

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      handleFail();
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

        <button
          type="submit"
          disabled={stamping}
          className="w-full border border-brass text-brass py-2.5 rounded hover:bg-brass hover:text-ink transition-colors disabled:opacity-50"
        >
          {stamping ? "…" : "Se connecter"}
        </button>
      </form>

      {stamping && <CustomsStamp />}
    </div>
  );
}
