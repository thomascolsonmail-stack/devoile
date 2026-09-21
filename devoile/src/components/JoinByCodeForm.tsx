"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function JoinByCodeForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/join/${encodeURIComponent(code.trim().toUpperCase())}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Code invalide.");
        return;
      }
      router.push(`/groups/${data.groupId}`);
      router.refresh();
    } catch {
      setError("Impossible de rejoindre le groupe.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex gap-2">
        <input
          className="input-field flex-1 uppercase tracking-widest text-center"
          placeholder="CODE"
          value={code}
          maxLength={10}
          onChange={(e) => setCode(e.target.value)}
        />
        <button className="btn-secondary" disabled={loading} type="submit">
          Rejoindre
        </button>
      </div>
      {error && <p className="text-sm text-accent mt-2">{error}</p>}
    </form>
  );
}
