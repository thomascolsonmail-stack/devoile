import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ALLOWED_IMAGE_TYPES, ALLOWED_VIDEO_TYPES, classifyMediaType, MAX_VIDEO_BYTES } from "@/lib/media";
import { generateBlurredPreview } from "@/lib/thumbnail";
import { saveFile } from "@/lib/storage";

export const runtime = "nodejs";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = (await req.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        const user = await getCurrentUser();
        if (!user) throw new Error("Connecte-toi d'abord.");

        const membership = await prisma.membership.findUnique({
          where: { userId_groupId: { userId: user.id, groupId: params.id } }
        });
        if (!membership) throw new Error("Tu ne fais pas partie de ce groupe.");

        let capturedAt = new Date().toISOString();
        try {
          const parsed = JSON.parse(clientPayload || "{}");
          if (parsed.capturedAt && !isNaN(new Date(parsed.capturedAt).getTime())) {
            capturedAt = parsed.capturedAt;
          }
        } catch {
          // on garde la date du jour si le payload client est invalide
        }

        return {
          allowedContentTypes: [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES],
          maximumSizeInBytes: MAX_VIDEO_BYTES,
          tokenPayload: JSON.stringify({ userId: user.id, groupId: params.id, capturedAt })
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        if (!tokenPayload) return;
        const { userId, groupId, capturedAt } = JSON.parse(tokenPayload);

        const type = classifyMediaType(blob.contentType) ?? "photo";

        let blurredUrl: string | null = null;
        if (type === "photo") {
          try {
            const res = await fetch(blob.url);
            const buffer = Buffer.from(await res.arrayBuffer());
            const blurredBuffer = await generateBlurredPreview(buffer);
            blurredUrl = await saveFile(blurredBuffer, "preview.jpg", "image/jpeg", `groups/${groupId}/previews`);
          } catch (err) {
            console.error("Erreur génération aperçu flouté :", err);
          }
        }

        await prisma.media.create({
          data: {
            groupId,
            uploaderId: userId,
            url: blob.url,
            blurredUrl,
            type,
            capturedAt: new Date(capturedAt)
          }
        });
      }
    });

    return NextResponse.json(jsonResponse);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}