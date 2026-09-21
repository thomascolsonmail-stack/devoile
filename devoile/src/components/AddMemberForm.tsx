"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddMemberForm({ groupId }: { groupId: string }) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim()) return;
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim() })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur.");
        return;
      }
      setSuccess(`${data.firstName} ajouté·e !`);
      setUsername("");
      router.refresh();
    } catch {
      setError("Impossible d'ajouter cette personne.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex gap-2">
        <input
          className="input-field flex-1"
          placeholder="nom d'utilisateur"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <button className="btn-secondary" disabled={loading} type="submit">
          Ajouter
        </button>
      </div>
      {error && <p className="text-sm text-accent mt-2">{error}</p>}
      {success && <p className="text-sm text-emerald-400 mt-2">{success}</p>}
    </form>
  );
}
