"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

function toLocalInputValue(date: Date) {
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
}

export default function CreateGroupForm() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [wallpaperPreview, setWallpaperPreview] = useState<string | null>(null);
  const [revealAt, setRevealAt] = useState(() => toLocalInputValue(new Date(Date.now() + 3 * 3600 * 1000)));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setWallpaperPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Donne un nom à ton groupe.");
      return;
    }
    const revealDate = new Date(revealAt);
    if (isNaN(revealDate.getTime()) || revealDate.getTime() <= Date.now()) {
      setError("La date de révélation doit être dans le futur.");
      return;
    }

    setLoading(true);
    try {
      let wallpaperUrl: string | null = null;
      const file = fileRef.current?.files?.[0];
      if (file) {
        const form = new FormData();
        form.append("file", file);
        const upRes = await fetch("/api/upload/wallpaper", { method: "POST", body: form });
        const upData = await upRes.json();
        if (!upRes.ok) throw new Error(upData.error || "Erreur lors de l'upload du fond d'écran.");
        wallpaperUrl = upData.url;
      }

      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), revealAt: revealDate.toISOString(), wallpaperUrl })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors de la création du groupe.");

      router.push(`/groups/${data.id}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="label">Fond d&apos;écran du groupe</label>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="mt-2 w-full h-36 rounded-2xl border-2 border-dashed border-white/15 bg-panel2 flex items-center justify-center overflow-hidden relative"
        >
          {wallpaperPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={wallpaperPreview} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-white/40 text-sm">Choisir une image</span>
          )}
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      </div>

      <div>
        <label className="label" htmlFor="name">Nom du groupe</label>
        <input
          id="name"
          className="input-field mt-1"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Mariage de Léa & Tom"
          required
        />
      </div>

      <div>
        <label className="label" htmlFor="revealAt">Date et heure de révélation</label>
        <input
          id="revealAt"
          type="datetime-local"
          className="input-field mt-1"
          value={revealAt}
          onChange={(e) => setRevealAt(e.target.value)}
          required
        />
      </div>

      {error && <p className="text-sm text-accent">{error}</p>}

      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? "Création..." : "Créer le groupe"}
      </button>
    </form>
  );
}
