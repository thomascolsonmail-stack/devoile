"use client";

import { useEffect, useState } from "react";
import { pushSupported } from "@/lib/pushClient";

export default function NotificationToggle() {
  const [ready, setReady] = useState(false);
  const [endpoint, setEndpoint] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!pushSupported()) {
      setReady(true);
      return;
    }
    navigator.serviceWorker.ready.then(async (reg) => {
      const sub = await reg.pushManager.getSubscription();
      if (!sub) {
        setReady(true);
        return;
      }
      setEndpoint(sub.endpoint);
      try {
        const res = await fetch(`/api/push/subscribe?endpoint=${encodeURIComponent(sub.endpoint)}`);
        if (res.ok) {
          const data = await res.json();
          setEnabled(data.chatNotifications);
        }
      } finally {
        setReady(true);
      }
    });
  }, []);

  async function toggle() {
    if (!endpoint) return;
    const next = !enabled;
    setLoading(true);
    setEnabled(next);
    try {
      const res = await fetch("/api/push/subscribe", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint, chatNotifications: next })
      });
      if (!res.ok) setEnabled(!next);
    } catch {
      setEnabled(!next);
    } finally {
      setLoading(false);
    }
  }

  if (!ready) return null;
  if (!endpoint) return null;

  return (
    <button onClick={toggle} disabled={loading} className="flex items-center justify-between w-full text-sm">
      <span>💬 Notifications de messages</span>
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