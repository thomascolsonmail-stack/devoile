import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "./db";
import { SESSION_COOKIE, verifySessionToken } from "./session";

export * from "./session";

const MAX_LOGIN_ATTEMPTS = 6;
const LOCK_MINUTES = 15;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function getCurrentUserId(): Promise<string | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function getCurrentUser() {
  const userId = await getCurrentUserId();
  if (!userId) return null;
  return prisma.user.findUnique({ where: { id: userId } });
}

export class UnauthenticatedError extends Error {
  constructor() {
    super("UNAUTHENTICATED");
    this.name = "UNAUTHENTICATED";
  }
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new UnauthenticatedError();
  return user;
}

export function isLocked(user: { lockedUntil: Date | null }): boolean {
  return !!user.lockedUntil && user.lockedUntil.getTime() > Date.now();
}

export async function registerFailedLogin(userId: string, currentAttempts: number) {
  const attempts = currentAttempts + 1;
  const shouldLock = attempts >= MAX_LOGIN_ATTEMPTS;
  await prisma.user.update({
    where: { id: userId },
    data: {
      failedLoginAttempts: shouldLock ? 0 : attempts,
      lockedUntil: shouldLock ? new Date(Date.now() + LOCK_MINUTES * 60 * 1000) : undefined
    }
  });
}

export async function resetLoginAttempts(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { failedLoginAttempts: 0, lockedUntil: null }
  });
}

const USERNAME_RE = /^[a-zA-Z0-9_.-]{3,20}$/;

export function validateUsername(username: string): string | null {
  if (!USERNAME_RE.test(username)) {
    return "Le nom d'utilisateur doit contenir 3 à 20 caractères (lettres, chiffres, . _ -).";
  }
  return null;
}

export function validatePassword(password: string): string | null {
  if (password.length < 8) return "Le mot de passe doit contenir au moins 8 caractères.";
  return null;
}

export function validateFirstName(firstName: string): string | null {
  if (firstName.trim().length < 1 || firstName.trim().length > 30) {
    return "Le prénom doit contenir entre 1 et 30 caractères.";
  }
  return null;
}
