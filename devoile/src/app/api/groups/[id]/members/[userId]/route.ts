import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser, UnauthenticatedError } from "@/lib/auth";

export async function DELETE(_req: Request, { params }: { params: { id: string; userId: string } }) {
  try {
    const user = await requireUser();

    const group = await prisma.group.findUnique({ where: { id: params.id } });
    if (!group) return NextResponse.json({ error: "Groupe introuvable." }, { status: 404 });
    if (group.ownerId !== user.id) {
      return NextResponse.json({ error: "Seul·e l'organisateur·rice peut retirer un membre." }, { status: 403 });
    }
    if (params.userId === group.ownerId) {
      return NextResponse.json({ error: "Impossible de retirer l'organisateur·rice du groupe." }, { status: 400 });
    }

    await prisma.membership.deleteMany({ where: { userId: params.userId, groupId: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return NextResponse.json({ error: "Connecte-toi d'abord." }, { status: 401 });
    }
    console.error(err);
    return NextResponse.json({ error: "Erreur lors du retrait." }, { status: 500 });
  }
}