export const MAX_IMAGE_BYTES = 20 * 1024 * 1024; // 20 Mo
export const MAX_VIDEO_BYTES = 200 * 1024 * 1024; // 200 Mo
export const MAX_WALLPAPER_BYTES = 10 * 1024 * 1024; // 10 Mo

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif", "image/gif"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm", "video/x-m4v"];

export function classifyMediaType(mimeType: string): "photo" | "video" | null {
  if (ALLOWED_IMAGE_TYPES.includes(mimeType)) return "photo";
  if (ALLOWED_VIDEO_TYPES.includes(mimeType)) return "video";
  return null;
}

export function validateMediaFile(mimeType: string, size: number): { ok: true; type: "photo" | "video" } | { ok: false; error: string } {
  const type = classifyMediaType(mimeType);
  if (!type) return { ok: false, error: "Type de fichier non supporté. Utilise une photo ou une vidéo." };
  const max = type === "photo" ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES;
  if (size > max) return { ok: false, error: `Fichier trop volumineux (max ${Math.round(max / 1024 / 1024)} Mo).` };
  return { ok: true, type };
}

export function validateWallpaperFile(mimeType: string, size: number): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(mimeType)) return "Le fond d'écran doit être une image.";
  if (size > MAX_WALLPAPER_BYTES) return `Image trop volumineuse (max ${MAX_WALLPAPER_BYTES / 1024 / 1024} Mo).`;
  return null;
}

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sans caractères ambigus (0/O, 1/I/l)

export function generateInviteCode(length = 7): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}
