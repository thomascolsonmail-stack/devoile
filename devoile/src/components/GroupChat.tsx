"use client";

import { useEffect, useRef, useState } from "react";

type ChatMessage = {
  id: string;
  content: string;
  createdAt: string;
  authorId: string;
  authorName: string;
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export default function GroupChat({ groupId, currentUserId }: { groupId: string; currentUserId: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(`/api/groups/${groupId}/chat/messages`);
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (!cancelled) setMessages(data.messages);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    const interval = setInterval(load, 5000); // simple polling, pas de websocket dans ce projet
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [groupId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const content = text.trim();
    if (!content) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/groups/${groupId}/chat/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur lors de l'envoi.");
        return;
      }
      setMessages((prev) => [...prev, data]);
      setText("");
    } catch {
      setError("Erreur lors de l'envoi.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="max-h-72 overflow-y-auto space-y-3 pr-1">
        {loading && <p className="text-sm text-white/40">Chargement...</p>}
        {!loading && messages.length === 0 && (
          <p className="text-sm text-white/40">Aucun message pour l&apos;instant.</p>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`flex flex-col ${m.authorId === currentUserId ? "items-end" : "items-start"}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                m.authorId === currentUserId ? "bg-accent2/30" : "bg-panel2"
              }`}
            >
              {m.authorId !== currentUserId && <p className="text-xs text-white/40 mb-0.5">{m.authorName}</p>}
              <p className="whitespace-pre-wrap break-words">{m.content}</p>
            </div>
            <span className="text-[10px] text-white/30 mt-0.5">{formatTime(m.createdAt)}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={send} className="flex gap-2">
        <input
          className="input-field flex-1 py-2"
          placeholder="Écris un message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={500}
        />
        <button className="btn-primary px-4" disabled={sending || !text.trim()}>
          Envoyer
        </button>
      </form>
      {error && <p className="text-sm text-accent">{error}</p>}
    </div>
  );
}