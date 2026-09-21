"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

export default function InviteCard({ inviteCode }: { inviteCode: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [joinUrl, setJoinUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const url = `${window.location.origin}/join/${inviteCode}`;
    setJoinUrl(url);
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, url, {
        width: 176,
        margin: 1,
        color: { dark: "#12101a", light: "#ffffff" }
      }).catch(() => {});
    }
  }, [inviteCode]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  }

  return (
    <div className="card p-5">
      <p className="label mb-3">Inviter des amis</p>
      <div className="flex items-center gap-4">
        <div className="bg-white rounded-2xl p-2 shrink-0">
          <canvas ref={canvasRef} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-white/40 mb-1">Code d&apos;invitation</p>
          <p className="text-2xl font-bold tracking-[0.2em] mb-3">{inviteCode}</p>
          <button onClick={copyLink} className="btn-secondary w-full text-sm py-2">
            {copied ? "Lien copié ✓" : "Copier le lien"}
          </button>
        </div>
      </div>
    </div>
  );
}
