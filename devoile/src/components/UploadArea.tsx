"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function UploadArea({ groupId }: { groupId: string }) {
  const router = useRouter();
  const photoRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);

  async function uploadFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    setUploading(true);
    setProgress({ done: 0, total: files.length });

    let failures = 0;
    let lastErrorMessage: string | null = null;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const capturedAt = new Date(file.lastModified || Date.now()).toISOString();
      const form = new FormData();
      form.append("file", file);
      form.append("capturedAt", capturedAt);
      try {
        const res = await fetch(`/api/groups/${groupId}/media`, { method: "POST", body: form });
        if (!res.ok) {
          failures++;
          const data = await res.json().catch(() => null);
          if (data?.error) lastErrorMessage = data.error;
        }
      } catch {
        failures++;
      }
      setProgress((p) => ({ ...p, done: p.done + 1 }));
    }

    setUploading(false);
    if (failures > 0) {
      setError(lastErrorMessage || `${failures} fichier(s) n'ont pas pu être envoyés.`);
    }
    router.refresh();
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    uploadFiles(e.target.files);
    // Sans ça, sélectionner deux fois de suite le même fichier (ex : reprendre
    // une photo juste après ratée) ne redéclenche pas onChange.
    e.target.value = "";
  }

  return (
    <div className="card p-5">
      <p className="label mb-3">Ajouter des souvenirs</p>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          className="btn-primary py-4 flex-col text-sm"
          onClick={() => photoRef.current?.click()}
          disabled={uploading}
        >
          📷 Photo
        </button>
        <button
          type="button"
          className="btn-primary py-4 flex-col text-sm"
          onClick={() => videoRef.current?.click()}
          disabled={uploading}
        >
          🎥 Vidéo
        </button>
      </div>

      <button
        type="button"
        className="btn-secondary py-3 w-full mt-3 text-sm"
        onClick={() => importRef.current?.click()}
        disabled={uploading}
      >
        🖼️ Importer depuis la galerie
      </button>

      {/*
        Deux inputs caméra séparés, un par type de média : combiner
        accept="image/*,video/*" avec capture="environment" dans un seul
        <input> ouvre la caméra de façon peu fiable sur mobile (notamment
        iOS Safari, qui ignore souvent la vidéo dans ce cas). En limitant
        chaque input à un seul type, la caméra s'ouvre systématiquement
        dans le bon mode (photo ou vidéo).
      */}
      <input
        ref={photoRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleChange}
      />
      <input
        ref={videoRef}
        type="file"
        accept="video/*"
        capture="environment"
        className="hidden"
        onChange={handleChange}
      />
      {/* Import depuis la galerie : pas de "capture", tous types, multi-fichiers. */}
      <input
        ref={importRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={handleChange}
      />

      {uploading && (
        <p className="text-sm text-white/50 mt-3">
          Envoi en cours... {progress.done}/{progress.total}
        </p>
      )}
      {error && <p className="text-sm text-accent mt-3">{error}</p>}
    </div>
  );
}