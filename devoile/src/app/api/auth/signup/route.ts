import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  createSessionToken,
  hashPassword,
  sessionCookieOptions,
  validateFirstName,
  validatePassword,
  validateUsername
} from "@/lib/auth";
import { SESSION_COOKIE } from "@/lib/session";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Requête invalide." }, { status: 400 });

  const username = String(body.username || "").trim().toLowerCase();
  const firstName = String(body.firstName || "").trim();
  const password = String(body.password || "");

  const usernameError = validateUsername(username);
  const firstNameError = validateFirstName(firstName);
  const passwordError = validatePassword(password);
  if (usernameError || firstNameError || passwordError) {
    return NextResponse.json({ error: usernameError || firstNameError || passwordError }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    return NextResponse.json({ error: "Ce nom d'utilisateur est déjà pris." }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { username, firstName, passwordHash }
  });

  const token = await createSessionToken(user.id);
  const res = NextResponse.json({ id: user.id, username: user.username, firstName: user.firstName });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return res;
}
