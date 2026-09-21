import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { nanoid } from "nanoid";

const useBlob = !!process.env.BLOB_READ_WRITE_TOKEN;

function extFromName(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot) : "";
}

/**
 * Stocke un fichier soit sur Vercel Blob (si BLOB_READ_WRITE_TOKEN est défini,
 * nécessaire en production sur Vercel car le disque n'est pas persistant),
 * soit sur le disque local sous /public/uploads (pratique en développement).
 */
export async function saveFile(
  buffer: Buffer,
  originalName: string,
  contentType: string,
  folder: string
): Promise<string> {
  const filename = `${nanoid(12)}${extFromName(originalName)}`;
  const key = `${folder}/${filename}`;

  if (useBlob) {
    const { put } = await import("@vercel/blob");
    const blob = await put(key, buffer, {
      access: "public",
      contentType,
      addRandomSuffix: false
    });
    return blob.url;
  }

  const dir = path.join(process.cwd(), "public", "uploads", folder);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), buffer);
  return `/uploads/${folder}/${filename}`;
}

export function isUsingCloudStorage(): boolean {
  return useBlob;
}
