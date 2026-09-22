import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser, UnauthenticatedError } from "@/lib/auth";
import { validateMediaFile } from "@/lib/media";
import { saveFile } from "@/lib/storage";
import { generateBlurredPreview } from "@/lib/thumbnail";

export const runtime = "nodejs";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();

    // Il faut être membre du groupe pour pouvoir y déposer un souvenir.
    const membership = await prisma.membership.findUnique({
      where: { userId_groupId: { userId: user.id, groupId: params.id } }
    });
    if (!membership) {
      return NextResponse.json({ error: "Tu ne fais pas partie de ce groupe." }, { status: 403 });
    }

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Aucun fichier reçu." }, { status: 400 });
    }

    const validation = validateMediaFile(file.type, file.size);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const capturedAtRaw = form.get("capturedAt");
    const capturedAt =
      typeof capturedAtRaw === "string" && !isNaN(new Date(capturedAtRaw).getTime())
        ? new Date(capturedAtRaw)
        : new Date();

    const buffer = Buffer.from(await file.arrayBuffer());
    const extGuess = validation.type === "photo" ? "jpg" : "mp4";
    const url = await saveFile(buffer, file.name || `media.${extGuess}`, file.type, `groups/${params.id}`);

    // Aperçu flouté irréversible : uniquement pour les photos (sharp ne décode
    // pas la vidéo). Une vidéo reste simplement masquée par l'icône 🎬 côté UI
    // (voir BlurPreview.tsx) tant que le groupe n'est pas révélé.
    let blurredUrl: string | null = null;
    if (validation.type === "photo") {
      try {
        const blurredBuffer = await generateBlurredPreview(buffer);
        blurredUrl = await saveFile(blurredBuffer, "preview.jpg", "image/jpeg", `groups/${params.id}/previews`);
      } catch (err) {
        console.error("Erreur génération aperçu flouté :", err);
        // On continue sans aperçu flouté plutôt que de faire échouer tout l'envoi.
      }
    }

    const media = await prisma.media.create({
      data: {
        groupId: params.id,
        uploaderId: user.id,
        url,
        blurredUrl,
        type: validation.type,
        capturedAt
      }
    });

    return NextResponse.json({
      id: media.id,
      url: media.url,
      blurredUrl: media.blurredUrl,
      type: media.type,
      capturedAt: media.capturedAt.toISOString()
    });
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return NextResponse.json({ error: "Connecte-toi d'abord." }, { status: 401 });
    }
    console.error(err);
    return NextResponse.json({ error: "Erreur lors de l'envoi du fichier." }, { status: 500 });
  }
}