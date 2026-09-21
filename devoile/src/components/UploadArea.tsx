"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function UploadArea({ groupId }: { groupId: string }) {
  const router = useRouter();
  const captureRef = useRef<HTMLInputElement>(null);
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
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const capturedAt = new Date(file.lastModified || Date.now()).toISOString();
      const form = new FormData();
      form.append("file", file);
      form.append("capturedAt", capturedAt);
      try {
        const res = await fetch(`/api/groups/${groupId}/media`, { method: "POST", body: form });
        if (!res.ok) failures++;
      } catch {
        failures++;
      }
      setProgress((p) => ({ ...p, done: p.done + 1 }));
    }

    setUploading(false);
    if (failures > 0) setError(`${failures} fichier(s) n'ont pas pu être envoyés.`);
    router.refresh();
  }

  return (
    <div className="card p-5">
      <p className="label mb-3">Ajouter des souvenirs</p>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          className="btn-primary py-4 flex-col text-sm"
          onClick={() => captureRef.current?.click()}
          disabled={uploading}
        >
          📷 Prendre une photo/vidéo
        </button>
        <button
          type="button"
          className="btn-secondary py-4 flex-col text-sm"
          onClick={() => importRef.current?.click()}
          disabled={uploading}
        >
          🖼️ Importer
        </button>
      </div>

      <input
        ref={captureRef}
        type="file"
        accept="image/*,video/*"
        capture="environment"
        className="hidden"
        onChange={(e) => uploadFiles(e.target.files)}
      />
      <input
        ref={importRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={(e) => uploadFiles(e.target.files)}
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
