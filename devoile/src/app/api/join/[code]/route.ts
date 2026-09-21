import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser, UnauthenticatedError } from "@/lib/auth";

export async function POST(_req: Request, { params }: { params: { code: string } }) {
  try {
    const user = await requireUser();
    const code = params.code.toUpperCase();
    const group = await prisma.group.findUnique({ where: { inviteCode: code } });
    if (!group) return NextResponse.json({ error: "Code d'invitation invalide." }, { status: 404 });

    await prisma.membership.upsert({
      where: { userId_groupId: { userId: user.id, groupId: group.id } },
      create: { userId: user.id, groupId: group.id },
      update: {}
    });

    return NextResponse.json({ groupId: group.id });
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return NextResponse.json({ error: "Connecte-toi d'abord." }, { status: 401 });
    }
    console.error(err);
    return NextResponse.json({ error: "Erreur lors de la connexion au groupe." }, { status: 500 });
  }
}
