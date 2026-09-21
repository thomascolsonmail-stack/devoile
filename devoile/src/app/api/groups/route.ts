import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser, UnauthenticatedError } from "@/lib/auth";
import { generateInviteCode } from "@/lib/media";

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Requête invalide." }, { status: 400 });

    const name = String(body.name || "").trim();
    const revealAtRaw = body.revealAt;
    const wallpaperUrl = body.wallpaperUrl ? String(body.wallpaperUrl) : null;

    if (name.length < 1 || name.length > 60) {
      return NextResponse.json({ error: "Le nom du groupe doit contenir entre 1 et 60 caractères." }, { status: 400 });
    }

    const revealAt = new Date(revealAtRaw);
    if (isNaN(revealAt.getTime()) || revealAt.getTime() <= Date.now()) {
      return NextResponse.json({ error: "La date de révélation doit être dans le futur." }, { status: 400 });
    }

    let inviteCode = generateInviteCode();
    for (let i = 0; i < 5; i++) {
      const clash = await prisma.group.findUnique({ where: { inviteCode } });
      if (!clash) break;
      inviteCode = generateInviteCode();
    }

    const group = await prisma.group.create({
      data: {
        name,
        wallpaperUrl,
        revealAt,
        inviteCode,
        ownerId: user.id,
        memberships: { create: { userId: user.id } }
      }
    });

    return NextResponse.json({ id: group.id, inviteCode: group.inviteCode });
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return NextResponse.json({ error: "Connecte-toi d'abord." }, { status: 401 });
    }
    console.error(err);
    return NextResponse.json({ error: "Erreur lors de la création du groupe." }, { status: 500 });
  }
}
