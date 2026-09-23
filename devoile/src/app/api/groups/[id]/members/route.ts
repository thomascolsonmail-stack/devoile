import { sendPushToUsers } from "@/lib/push";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser, UnauthenticatedError } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();

    const group = await prisma.group.findUnique({ where: { id: params.id } });
    if (!group) return NextResponse.json({ error: "Groupe introuvable." }, { status: 404 });
    if (group.ownerId !== user.id) {
      return NextResponse.json({ error: "Seul·e l'organisateur·rice peut ajouter des membres." }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    const username = typeof body?.username === "string" ? body.username.trim().toLowerCase() : "";
    if (!username) {
      return NextResponse.json({ error: "Indique un nom d'utilisateur." }, { status: 400 });
    }

    const target = await prisma.user.findUnique({ where: { username } });
    if (!target) {
      return NextResponse.json({ error: "Aucun utilisateur avec ce nom." }, { status: 404 });
    }

    await prisma.membership.upsert({
      where: { userId_groupId: { userId: target.id, groupId: group.id } },
      create: { userId: target.id, groupId: group.id },
      update: {}
    });

    await sendPushToUsers([target.id], {
      title: "Dévoile",
      body: `Tu as été ajouté·e au groupe « ${group.name} ».`,
      url: `/groups/${group.id}`
    }).catch((err) => console.error("Erreur envoi notification :", err));

    return NextResponse.json({ firstName: target.firstName });
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return NextResponse.json({ error: "Connecte-toi d'abord." }, { status: 401 });
    }
    console.error(err);
    return NextResponse.json({ error: "Erreur lors de l'ajout." }, { status: 500 });
  }
}