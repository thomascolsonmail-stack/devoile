import { SignJWT, jwtVerify } from "jose";

// Fichier "edge-safe" : pas de Prisma ni bcrypt ici, pour pouvoir être
// importé depuis middleware.ts (qui tourne en Edge Runtime).

export const SESSION_COOKIE = "devoile_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 180; // 180 jours -> reconnexion auto sur le même appareil
const ALG = "HS256";

function getSecretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET manquant dans les variables d'environnement");
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime("180d")
    .sign(getSecretKey());
}

export async function verifySessionToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE
  };
}
