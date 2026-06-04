import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { AUTH_COOKIE_NAME, authCookieOptions, getJwtSecret, isJwtError } from "@/lib/auth";

export async function DELETE(req: NextRequest) {
  try {
    const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ error: "未登入" }, { status: 401 });
    }

    let decoded: { userId: string };
    try {
      decoded = jwt.verify(token, getJwtSecret()) as { userId: string };
    } catch (error) {
      if (isJwtError(error)) {
        return NextResponse.json({ error: "登入已失效" }, { status: 401 });
      }
      throw error;
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) {
      return NextResponse.json({ error: "用戶不存在" }, { status: 404 });
    }

    await prisma.user.delete({ where: { id: decoded.userId } });

    const response = NextResponse.json({ message: "帳號已刪除" });
    response.cookies.set(AUTH_COOKIE_NAME, "", authCookieOptions(0));
    return response;
  } catch (error) {
    console.error("Delete account error:", error);
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}
