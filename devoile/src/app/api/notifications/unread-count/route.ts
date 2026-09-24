import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser, UnauthenticatedError } from "@/lib/auth";

export async function GET() {
  try {
    const user = await requireUser();
    const count = await prisma.notificationLog.count({ where: { userId: user.id, read: false } });
    return NextResponse.json({ count });
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return NextResponse.json({ error: "Connecte-toi d'abord." }, { status: 401 });
    }
    console.error(err);
    return NextResponse.json({ error: "Erreur." }, { status: 500 });
  }
}