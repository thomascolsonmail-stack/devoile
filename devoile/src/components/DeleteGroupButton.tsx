"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteGroupButton({ groupId, groupName }: { groupId: string; groupName: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/groups/${groupId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error || "Erreur lors de la suppression.");
        setLoading(false);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Erreur lors de la suppression.");
      setLoading(false);
    }
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="btn-secondary w-full text-sm text-accent border-accent/30"
      >
        🗑️ Supprimer le groupe
      </button>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-white/60">
        Supprimer « {groupName} » effacera définitivement tous les souvenirs, membres et messages associés.
        C&apos;est irréversible.
      </p>
      <div className="flex gap-2">
        <button onClick={() => setConfirming(false)} className="btn-secondary flex-1 text-sm" disabled={loading}>
          Annuler
        </button>
        <button
          onClick={handleDelete}
          className="btn-secondary flex-1 text-sm text-accent border-accent/30"
          disabled={loading}
        >
          {loading ? "Suppression..." : "Confirmer"}
        </button>
      </div>
      {error && <p className="text-sm text-accent">{error}</p>}
    </div>
  );
}