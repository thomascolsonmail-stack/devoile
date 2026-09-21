"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Une erreur est survenue.");
        return;
      }
      const next = searchParams.get("next") || "/dashboard";
      router.push(next);
      router.refresh();
    } catch {
      setError("Impossible de se connecter. Vérifie ta connexion.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label" htmlFor="username">Nom d&apos;utilisateur</label>
        <input
          id="username"
          className="input-field mt-1"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          required
        />
      </div>
      <div>
        <label className="label" htmlFor="password">Mot de passe</label>
        <input
          id="password"
          type="password"
          className="input-field mt-1"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
      </div>
      {error && <p className="text-sm text-accent">{error}</p>}
      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? "Connexion..." : "Se connecter"}
      </button>
      <p className="text-center text-sm text-white/50">
        Pas encore de compte ?{" "}
        <Link href="/signup" className="text-accent2 font-medium">
          Inscris-toi
        </Link>
      </p>
    </form>
  );
}
