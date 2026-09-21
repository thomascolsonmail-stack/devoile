import { NextRequest, NextResponse } from "next/server";
import { requireUser, UnauthenticatedError } from "@/lib/auth";
import { saveFile } from "@/lib/storage";
import { validateWallpaperFile } from "@/lib/media";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Aucun fichier reçu." }, { status: 400 });
    }

    const error = validateWallpaperFile(file.type, file.size);
    if (error) return NextResponse.json({ error }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await saveFile(buffer, file.name || "wallpaper.jpg", file.type, `wallpapers/${user.id}`);
    return NextResponse.json({ url });
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return NextResponse.json({ error: "Connecte-toi d'abord." }, { status: 401 });
    }
    console.error(err);
    return NextResponse.json({ error: "Erreur lors de l'upload." }, { status: 500 });
  }
}
