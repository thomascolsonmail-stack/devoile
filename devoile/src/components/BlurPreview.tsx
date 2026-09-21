"use client";

import { useRef, useState } from "react";
import Countdown from "./Countdown";

export type TeaserItem = {
  id: string;
  type: "photo" | "video";
  blurredUrl: string | null;
  uploaderName: string;
};

export default function BlurPreview({ items, revealAt }: { items: TeaserItem[]; revealAt: string }) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const scrollerRef = useRef<HTMLDivElement>(null);

  if (items.length === 0) return null;

  function openAt(i: number) {
    setIndex(i);
    setOpen(true);
    requestAnimationFrame(() => {
      scrollerRef.current?.scrollTo({ left: i * scrollerRef.current.clientWidth });
    });
  }

  function handleScroll() {
    const el = scrollerRef.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== index) setIndex(i);
  }

  function go(delta: number) {
    const el = scrollerRef.current;
    if (!el) return;
    const next = Math.min(items.length - 1, Math.max(0, index + delta));
    el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
    setIndex(next);
  }

  return (
    <>
      <button onClick={() => openAt(0)} className="card p-5 w-full text-left flex items-center justify-between">
        <span>
          <span className="font-semibold">👀 Aperçu flouté</span>
          <span className="block text-sm text-white/40 mt-0.5">
            Fais défiler {items.length} souvenir{items.length > 1 ? "s" : ""}... en flou total
          </span>
        </span>
        <span className="text-white/40">→</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          <div className="flex items-center justify-between p-4 text-sm text-white/70 shrink-0">
            <div className="flex items-center gap-2">
              <span>🔒</span>
              <Countdown target={revealAt} compact />
            </div>
            <span>
              {index + 1} / {items.length}
            </span>
            <button onClick={() => setOpen(false)} className="text-xl px-2">
              ✕
            </button>
          </div>

          <div
            ref={scrollerRef}
            onScroll={handleScroll}
            className="flex-1 flex overflow-x-auto snap-x snap-mandatory"
            style={{ scrollbarWidth: "none" }}
          >
            {items.map((item) => (
              <div key={item.id} className="w-full h-full shrink-0 snap-center flex flex-col items-center justify-center relative px-6">
                <div className="relative w-full max-w-sm aspect-square rounded-3xl overflow-hidden bg-panel2">
                  {item.blurredUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.blurredUrl}
                      alt=""
                      className="w-full h-full object-cover"
                      style={{ filter: "blur(18px) saturate(1.3)", transform: "scale(1.15)" }}
                    />
                  ) : (
                    <div className="w-full h-full bg-brand-gradient opacity-40" />
                  )}
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/10">
                    <span className="text-4xl">{item.type === "video" ? "🎬" : "🔒"}</span>
                  </div>
                </div>
                <p className="text-white/50 text-sm mt-4">Ajouté par {item.uploaderName}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-6 p-5 shrink-0">
            <button onClick={() => go(-1)} disabled={index === 0} className="btn-secondary px-5 disabled:opacity-30">
              ← Précédent
            </button>
            <button onClick={() => go(1)} disabled={index === items.length - 1} className="btn-secondary px-5 disabled:opacity-30">
              Suivant →
            </button>
          </div>
        </div>
      )}
    </>
  );
}
