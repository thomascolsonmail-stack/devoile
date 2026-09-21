"use client";

import { useState } from "react";

const EMOJIS = ["❤️", "😂", "😍", "😮", "👍", "🔥"];

export type ReactionCount = { emoji: string; count: number; reactedByMe: boolean };

export type MediaItem = {
  id: string;
  url: string;
  type: "photo" | "video";
  capturedAt: string;
  uploaderName: string;
  reactions: ReactionCount[];
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

async function downloadFile(url: string, filename: string) {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const objUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objUrl);
  } catch {
    window.open(url, "_blank");
  }
}

export default function MediaGrid({ groupId, initialMedia }: { groupId: string; initialMedia: MediaItem[] }) {
  const [media, setMedia] = useState(initialMedia);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  async function toggleReaction(mediaId: string, emoji: string) {
    const res = await fetch(`/api/groups/${groupId}/media/${mediaId}/reactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emoji })
    });
    if (!res.ok) return;
    const data = await res.json();
    setMedia((prev) =>
      prev.map((m) =>
        m.id === mediaId
          ? {
              ...m,
              reactions: EMOJIS.map((e) => {
                const found = data.counts.find((c: { emoji: string; count: number }) => c.emoji === e);
                const reactedByMe = e === emoji ? data.toggledOn : m.reactions.find((r) => r.emoji === e)?.reactedByMe ?? false;
                return { emoji: e, count: found?.count ?? 0, reactedByMe };
              }).filter((r) => r.count > 0 || r.reactedByMe)
            }
          : m
      )
    );
  }

  const active = openIndex !== null ? media[openIndex] : null;

  return (
    <>
      <div className="grid grid-cols-3 gap-1.5">
        {media.map((m, i) => (
          <button
            key={m.id}
            onClick={() => setOpenIndex(i)}
            className="relative aspect-square rounded-xl overflow-hidden bg-panel2"
          >
            {m.type === "photo" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={m.url} alt="" className="w-full h-full object-cover" loading="lazy" />
            ) : (
              <>
                <video src={m.url} className="w-full h-full object-cover" muted playsInline />
                <span className="absolute bottom-1 right-1 text-xs bg-black/60 rounded-full px-1.5 py-0.5">▶</span>
              </>
            )}
          </button>
        ))}
      </div>

      {active && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col" onClick={() => setOpenIndex(null)}>
          <div className="flex justify-between items-center p-4 text-sm text-white/70">
            <span>
              {active.uploaderName} · {formatDate(active.capturedAt)}
            </span>
            <button onClick={() => setOpenIndex(null)} className="text-xl px-2">
              ✕
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center px-2" onClick={(e) => e.stopPropagation()}>
            {active.type === "photo" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={active.url} alt="" className="max-h-full max-w-full object-contain rounded-lg" />
            ) : (
              <video src={active.url} className="max-h-full max-w-full rounded-lg" controls playsInline />
            )}
          </div>

          <div className="p-4 flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-wrap gap-2 justify-center">
              {EMOJIS.map((emoji) => {
                const r = active.reactions.find((x) => x.emoji === emoji);
                return (
                  <button
                    key={emoji}
                    onClick={() => toggleReaction(active.id, emoji)}
                    className={`px-3 py-1.5 rounded-full border text-sm ${
                      r?.reactedByMe ? "bg-accent2/30 border-accent2" : "bg-panel2 border-white/10"
                    }`}
                  >
                    {emoji} {r && r.count > 0 ? r.count : ""}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => downloadFile(active.url, `devoile-${active.id}`)}
              className="btn-secondary w-full"
            >
              ⬇️ Enregistrer cette photo
            </button>
          </div>
        </div>
      )}
    </>
  );
}
