import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser, UnauthenticatedError } from "@/lib/auth";
import { ALLOWED_REACTION_EMOJIS } from "@/lib/media";

export async function POST(req: NextRequest, { params }: { params: { id: string; mediaId: string } }) {
  try {
    const user = await requireUser();

    const membership = await prisma.membership.findUnique({
      where: { userId_groupId: { userId: user.id, groupId: params.id } }
    });
    if (!membership) {
      return NextResponse.json({ error: "Tu ne fais pas partie de ce groupe." }, { status: 403 });
    }

    const media = await prisma.media.findUnique({ where: { id: params.mediaId } });
    if (!media || media.groupId !== params.id) {
      return NextResponse.json({ error: "Souvenir introuvable." }, { status: 404 });
    }

    const body = await req.json().catch(() => null);
    const emoji = typeof body?.emoji === "string" ? body.emoji : "";
    if (!ALLOWED_REACTION_EMOJIS.includes(emoji)) {
      return NextResponse.json({ error: "Réaction invalide." }, { status: 400 });
    }

    const existing = await prisma.reaction.findUnique({
      where: { mediaId_userId_emoji: { mediaId: params.mediaId, userId: user.id, emoji } }
    });

    let toggledOn: boolean;
    if (existing) {
      await prisma.reaction.delete({ where: { id: existing.id } });
      toggledOn = false;
    } else {
      await prisma.reaction.create({ data: { mediaId: params.mediaId, userId: user.id, emoji } });
      toggledOn = true;
    }

    const grouped = await prisma.reaction.groupBy({
      by: ["emoji"],
      where: { mediaId: params.mediaId },
      _count: true
    });
    const counts = grouped.map((g) => ({ emoji: g.emoji, count: g._count }));

    return NextResponse.json({ counts, toggledOn });
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return NextResponse.json({ error: "Connecte-toi d'abord." }, { status: 401 });
    }
    console.error(err);
    return NextResponse.json({ error: "Erreur lors de l'envoi de la réaction." }, { status: 500 });
  }
}