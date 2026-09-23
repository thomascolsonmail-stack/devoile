import { sendPushToUsers } from "@/lib/push";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser, UnauthenticatedError } from "@/lib/auth";
import { MAX_MESSAGE_LENGTH } from "@/lib/media";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();

    const membership = await prisma.membership.findUnique({
      where: { userId_groupId: { userId: user.id, groupId: params.id } }
    });
    if (!membership) {
      return NextResponse.json({ error: "Tu ne fais pas partie de ce groupe." }, { status: 403 });
    }

    const messages = await prisma.message.findMany({
      where: { groupId: params.id },
      orderBy: { createdAt: "asc" },
      include: { author: { select: { firstName: true } } },
      take: 200
    });

    const otherMembers = await prisma.membership.findMany({
      where: { groupId: params.id, userId: { not: user.id } },
      select: { userId: true }
    });

    await sendPushToUsers(
      otherMembers.map((m) => m.userId),
      { title: group.name, body: `${user.firstName} : ${content}`, url: `/groups/${params.id}` }
    ).catch((err) => console.error("Erreur envoi notifications :", err));

    return NextResponse.json({
      messages: messages.map((m) => ({
        id: m.id,
        content: m.content,
        createdAt: m.createdAt.toISOString(),
        authorId: m.authorId,
        authorName: m.author.firstName
      }))
    });
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return NextResponse.json({ error: "Connecte-toi d'abord." }, { status: 401 });
    }
    console.error(err);
    return NextResponse.json({ error: "Erreur." }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();

    const group = await prisma.group.findUnique({ where: { id: params.id } });
    if (!group) return NextResponse.json({ error: "Groupe introuvable." }, { status: 404 });

    const membership = await prisma.membership.findUnique({
      where: { userId_groupId: { userId: user.id, groupId: params.id } }
    });
    if (!membership) {
      return NextResponse.json({ error: "Tu ne fais pas partie de ce groupe." }, { status: 403 });
    }

    if (!group.chatEnabled) {
      return NextResponse.json({ error: "Le chat est désactivé pour ce groupe." }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    const content = typeof body?.content === "string" ? body.content.trim() : "";
    if (!content) return NextResponse.json({ error: "Message vide." }, { status: 400 });
    if (content.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json({ error: `Message trop long (max ${MAX_MESSAGE_LENGTH} caractères).` }, { status: 400 });
    }

    const message = await prisma.message.create({
      data: { groupId: params.id, authorId: user.id, content }
    });

    return NextResponse.json({
      id: message.id,
      content: message.content,
      createdAt: message.createdAt.toISOString(),
      authorId: message.authorId,
      authorName: user.firstName
    });
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return NextResponse.json({ error: "Connecte-toi d'abord." }, { status: 401 });
    }
    console.error(err);
    return NextResponse.json({ error: "Erreur lors de l'envoi du message." }, { status: 500 });
  }
}