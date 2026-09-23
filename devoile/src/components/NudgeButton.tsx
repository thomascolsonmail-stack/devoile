"use client";

import { useState } from "react";

export default function NudgeButton({ groupId }: { groupId: string }) {
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function send() {
    setLoading(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/groups/${groupId}/notify`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setFeedback(data.error || "Erreur lors de l'envoi.");
        return;
      }
      setFeedback("Rappel envoyé ✅");
    } catch {
      setFeedback("Erreur lors de l'envoi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button onClick={send} disabled={loading} className="btn-secondary w-full text-sm">
        📸 {loading ? "Envoi..." : "C'est l'heure de la photo !"}
      </button>
      {feedback && <p className="text-xs text-white/50 mt-2 text-center">{feedback}</p>}
    </div>
  );
}