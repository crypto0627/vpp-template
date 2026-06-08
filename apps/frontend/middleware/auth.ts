import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { AUTH_COOKIE_NAME, getJwtSecret } from "@/lib/auth";
import type { User } from "@/lib/generated/prisma";

export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return null;

    // Single source of truth for the secret — never a hardcoded fallback,
    // which would silently accept forged tokens if JWT_SECRET were unset.
    const decoded = jwt.verify(token, getJwtSecret()) as { userId: string };
    return await prisma.user.findUnique({ where: { id: decoded.userId } });
  } catch {
    return null;
  }
}

export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}
