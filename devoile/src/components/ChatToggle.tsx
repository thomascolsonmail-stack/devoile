"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ChatToggle({ groupId, initialEnabled }: { groupId: string; initialEnabled: boolean }) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    const next = !enabled;
    setLoading(true);
    setEnabled(next); // mise à jour optimiste
    try {
      const res = await fetch(`/api/groups/${groupId}/chat`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: next })
      });
      if (!res.ok) {
        setEnabled(!next); // rollback si erreur serveur
      } else {
        router.refresh();
      }
    } catch {
      setEnabled(!next);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button onClick={toggle} disabled={loading} className="flex items-center justify-between w-full text-sm">
      <span>💬 Chat de groupe</span>
      <span
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
          enabled ? "bg-accent2" : "bg-white/15"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
            enabled ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </span>
    </button>
  );
}