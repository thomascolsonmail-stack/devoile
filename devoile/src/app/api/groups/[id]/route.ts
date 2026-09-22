import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser, UnauthenticatedError } from "@/lib/auth";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();

    const group = await prisma.group.findUnique({ where: { id: params.id } });
    if (!group) return NextResponse.json({ error: "Groupe introuvable." }, { status: 404 });
    if (group.ownerId !== user.id) {
      return NextResponse.json({ error: "Seul·e l'organisateur·rice peut supprimer ce groupe." }, { status: 403 });
    }

    // Cascade Prisma : memberships, media, réactions et messages liés
    // sont supprimés automatiquement (onDelete: Cascade dans schema.prisma).
    // Les fichiers déjà envoyés sur Vercel Blob ne sont pas effacés par ce
    // endpoint (nettoyage best-effort à ajouter plus tard si besoin).
    await prisma.group.delete({ where: { id: params.id } });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return NextResponse.json({ error: "Connecte-toi d'abord." }, { status: 401 });
    }
    console.error(err);
    return NextResponse.json({ error: "Erreur lors de la suppression." }, { status: 500 });
  }
}