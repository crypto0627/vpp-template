/**
 * Authentication Middleware - JWT 驗證邏輯
 */

import { cookies } from "next/headers";
import { verify } from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import type { User } from "@/lib/generated/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

/**
 * 從 JWT token 獲取當前用戶
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;

    if (!token) {
      return null;
    }

    // 驗證 JWT
    const decoded = verify(token, JWT_SECRET) as { userId: string };

    // 從資料庫獲取用戶
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    return user;
  } catch (error) {
    console.error("JWT verification failed:", error);
    return null;
  }
}

/**
 * 要求認證的 middleware（用於 API routes）
 */
export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  return user;
}
