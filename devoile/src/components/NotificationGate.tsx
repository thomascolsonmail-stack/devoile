"use client";

import { useEffect, useState } from "react";
import { ensurePushSubscription, pushSupported } from "@/lib/pushClient";

type Status = "checking" | "granted" | "needed" | "blocked" | "unsupported";

export default function NotificationGate({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>("checking");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!pushSupported()) {
      setStatus("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setStatus("blocked");
      return;
    }
    if (Notification.permission !== "granted") {
      setStatus("needed");
      return;
    }
    navigator.serviceWorker.ready
      .then(async (reg) => {
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          setStatus("granted");
          return;
        }
        try {
          await ensurePushSubscription();
          setStatus("granted");
        } catch {
          setStatus("needed");
        }
      })
      .catch(() => setStatus("needed"));
  }, []);

  async function activate() {
    setLoading(true);
    setError(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission === "denied") {
        setStatus("blocked");
        return;
      }
      if (permission !== "granted") {
        setError("Autorisation non accordée.");
        return;
      }
      await ensurePushSubscription();
      setStatus("granted");
    } catch {
      setError("Impossible d'activer les notifications. Réessaie.");
    } finally {
      setLoading(false);
    }
  }

  if (status === "checking" || status === "unsupported" || status === "granted") {
    return <>{children}</>;
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center gap-4">
      <p className="text-4xl">🔔</p>
      <h1 className="text-xl font-bold">Active les notifications</h1>

      {status === "needed" && (
        <>
          <p className="text-white/60 text-sm max-w-sm">
            Dévoile en a besoin pour te prévenir quand tu es ajouté·e à un groupe ou quand c&apos;est l&apos;heure
            de capturer un souvenir. Sans ça, tu ne peux pas continuer.
          </p>
          <button onClick={activate} disabled={loading} className="btn-primary px-6 py-3">
            {loading ? "Activation..." : "Activer les notifications"}
          </button>
        </>
      )}

      {status === "blocked" && (
        <p className="text-white/60 text-sm max-w-sm">
          Les notifications sont bloquées pour ce site dans les réglages de ton navigateur. Autorise-les
          manuellement (icône 🔒 ou ⓘ à côté de l&apos;adresse), puis recharge cette page.
        </p>
      )}

      {error && <p className="text-sm text-accent">{error}</p>}
    </main>
  );
}