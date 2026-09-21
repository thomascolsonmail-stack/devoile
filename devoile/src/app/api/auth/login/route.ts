import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  createSessionToken,
  isLocked,
  registerFailedLogin,
  resetLoginAttempts,
  sessionCookieOptions,
  verifyPassword
} from "@/lib/auth";
import { SESSION_COOKIE } from "@/lib/session";

const GENERIC_ERROR = "Nom d'utilisateur ou mot de passe incorrect.";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Requête invalide." }, { status: 400 });

  const username = String(body.username || "").trim().toLowerCase();
  const password = String(body.password || "");
  if (!username || !password) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
  }

  if (isLocked(user)) {
    return NextResponse.json(
      { error: "Compte temporairement bloqué suite à plusieurs échecs. Réessaie dans quelques minutes." },
      { status: 423 }
    );
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    await registerFailedLogin(user.id, user.failedLoginAttempts);
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
  }

  await resetLoginAttempts(user.id);
  const token = await createSessionToken(user.id);
  const res = NextResponse.json({ id: user.id, username: user.username, firstName: user.firstName });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return res;
}
