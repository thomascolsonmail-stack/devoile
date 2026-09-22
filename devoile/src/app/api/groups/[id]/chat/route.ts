import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser, UnauthenticatedError } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();

    const group = await prisma.group.findUnique({ where: { id: params.id } });
    if (!group) return NextResponse.json({ error: "Groupe introuvable." }, { status: 404 });
    if (group.ownerId !== user.id) {
      return NextResponse.json({ error: "Seul·e l'organisateur·rice peut gérer le chat." }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    if (typeof body?.enabled !== "boolean") {
      return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
    }

    const updated = await prisma.group.update({
      where: { id: params.id },
      data: { chatEnabled: body.enabled }
    });

    return NextResponse.json({ chatEnabled: updated.chatEnabled });
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return NextResponse.json({ error: "Connecte-toi d'abord." }, { status: 401 });
    }
    console.error(err);
    return NextResponse.json({ error: "Erreur." }, { status: 500 });
  }
}