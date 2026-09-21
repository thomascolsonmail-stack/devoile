"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

function diffParts(targetMs: number) {
  const diff = Math.max(0, targetMs - Date.now());
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return { diff, days, hours, minutes, seconds };
}

export default function Countdown({
  target,
  compact = false,
  onReveal
}: {
  target: string;
  compact?: boolean;
  onReveal?: () => void;
}) {
  const targetMs = new Date(target).getTime();
  const [parts, setParts] = useState(() => diffParts(targetMs));
  const revealed = parts.diff <= 0;
  const router = useRouter();

  useEffect(() => {
    if (targetMs <= Date.now()) return;
    const id = setInterval(() => {
      const next = diffParts(targetMs);
      setParts(next);
      if (next.diff <= 0) {
        clearInterval(id);
        onReveal?.();
        router.refresh();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [targetMs, onReveal, router]);

  if (revealed) {
    return <span className="font-semibold text-gold">🎉 Révélé !</span>;
  }

  if (compact) {
    return (
      <span className="tabular-nums text-white/70 text-sm">
        {parts.days > 0 ? `${parts.days}j ` : ""}
        {String(parts.hours).padStart(2, "0")}:{String(parts.minutes).padStart(2, "0")}:{String(parts.seconds).padStart(2, "0")}
      </span>
    );
  }

  return (
    <div className="flex gap-3">
      {[
        { label: "jours", value: parts.days },
        { label: "heures", value: parts.hours },
        { label: "min", value: parts.minutes },
        { label: "sec", value: parts.seconds }
      ].map((p) => (
        <div key={p.label} className="flex flex-col items-center bg-panel2 rounded-2xl px-4 py-3 min-w-[64px]">
          <span className="text-2xl font-bold tabular-nums">{String(p.value).padStart(2, "0")}</span>
          <span className="text-[11px] uppercase tracking-wide text-white/40">{p.label}</span>
        </div>
      ))}
    </div>
  );
}
