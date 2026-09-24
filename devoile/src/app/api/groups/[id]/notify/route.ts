import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser, UnauthenticatedError } from "@/lib/auth";
import { sendPushToUsers } from "@/lib/push";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();

    const group = await prisma.group.findUnique({ where: { id: params.id } });
    if (!group) return NextResponse.json({ error: "Groupe introuvable." }, { status: 404 });
    if (group.ownerId !== user.id) {
      return NextResponse.json({ error: "Seul·e l'organisateur·rice peut envoyer ce rappel." }, { status: 403 });
    }

    const members = await prisma.membership.findMany({
      where: { groupId: params.id, userId: { not: user.id } },
      select: { userId: true }
    });

    await sendPushToUsers(
      members.map((m) => m.userId),
      { title: group.name, body: "📸 C'est l'heure de mettre une photo !", url: `/groups/${params.id}` }
    );

    return NextResponse.json({ ok: true, memberCount: members.length });
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return NextResponse.json({ error: "Connecte-toi d'abord." }, { status: 401 });
    }
    console.error(err);
    // ASTUCE : On affiche le vrai message d'erreur au lieu du texte générique
    return NextResponse.json({ 
      error: "Erreur : " + ((err as Error).message || "inconnue") 
    }, { status: 500 });
  }
}