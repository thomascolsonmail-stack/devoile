import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser, UnauthenticatedError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();

    const q = req.nextUrl.searchParams.get("q")?.trim() || "";
    if (q.length < 2) {
      return NextResponse.json({ users: [] });
    }

    const users = await prisma.user.findMany({
      where: {
        id: { not: user.id },
        OR: [
          { username: { contains: q, mode: "insensitive" } },
          { firstName: { contains: q, mode: "insensitive" } }
        ]
      },
      select: { id: true, username: true, firstName: true },
      orderBy: { firstName: "asc" },
      take: 20
    });

    return NextResponse.json({ users });
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return NextResponse.json({ error: "Connecte-toi d'abord." }, { status: 401 });
    }
    console.error(err);
    return NextResponse.json({ error: "Erreur lors de la recherche." }, { status: 500 });
  }
}