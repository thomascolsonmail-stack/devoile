"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";

// Mets NEXT_PUBLIC_HAS_BLOB="true" UNIQUEMENT quand BLOB_READ_WRITE_TOKEN
// est configuré côté serveur (prod). Sinon repli sur l'ancien envoi serveur.
const HAS_BLOB = process.env.NEXT_PUBLIC_HAS_BLOB === "true";

export default function UploadArea({ groupId }: { groupId: string }) {
  const router = useRouter();
  const photoRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [fileIndex, setFileIndex] = useState(0);
  const [fileTotal, setFileTotal] = useState(0);
  const [filePercent, setFilePercent] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const overallPercent =
    fileTotal > 0 ? Math.round(((fileIndex + filePercent / 100) / fileTotal) * 100) : 0;

  async function uploadViaBlob(file: File, capturedAt: string) {
    await upload(`groups/${groupId}/${file.name}`, file, {
      access: "public",
      handleUploadUrl: `/api/groups/${groupId}/media/upload-token`,
      clientPayload: JSON.stringify({ capturedAt }),
      onUploadProgress: ({ percentage }) => setFilePercent(percentage)
    });
  }

  function uploadViaServer(file: File, capturedAt: string) {
    return new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `/api/groups/${groupId}/media`);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) setFilePercent(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) return resolve();
        try {
          const data = JSON.parse(xhr.responseText);
          reject(new Error(data.error || "Erreur lors de l'envoi."));
        } catch {
          reject(new Error("Erreur lors de l'envoi."));
        }
      };
      xhr.onerror = () => reject(new Error("Erreur réseau lors de l'envoi."));
      const form = new FormData();
      form.append("file", file);
      form.append("capturedAt", capturedAt);
      xhr.send(form);
    });
  }

  async function uploadFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    setUploading(true);
    setFileTotal(files.length);
    setFileIndex(0);
    setFilePercent(0);

    let failures = 0;
    let lastErrorMessage: string | null = null;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const capturedAt = new Date(file.lastModified || Date.now()).toISOString();
      setFilePercent(0);
      try {
        if (HAS_BLOB) {
          await uploadViaBlob(file, capturedAt);
        } else {
          await uploadViaServer(file, capturedAt);
        }
      } catch (err) {
        failures++;
        lastErrorMessage = err instanceof Error ? err.message : null;
      }
      setFileIndex(i + 1);
    }

    setUploading(false);
    if (failures > 0) {
      setError(lastErrorMessage || `${failures} fichier(s) n'ont pas pu être envoyés.`);
    }
    router.refresh();
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    uploadFiles(e.target.files);
    e.target.value = "";
  }

  return (
    <div className="card p-5">
      <p className="label mb-3">Ajouter des souvenirs</p>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          className="btn-primary py-4 text-sm"
          onClick={() => photoRef.current?.click()}
          disabled={uploading}
        >
          📷 Photo
        </button>
        <button
          type="button"
          className="btn-primary py-4 text-sm"
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
      <input
        ref={importRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={handleChange}
      />

      {uploading && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-white/50 mb-1">
            <span>
              Envoi {Math.min(fileIndex + 1, fileTotal)}/{fileTotal}
            </span>
            <span>{overallPercent}%</span>
          </div>
          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-accent2 transition-all duration-150"
              style={{ width: `${overallPercent}%` }}
            />
          </div>
        </div>
      )}
      {error && <p className="text-sm text-accent mt-3">{error}</p>}
    </div>
  );
}