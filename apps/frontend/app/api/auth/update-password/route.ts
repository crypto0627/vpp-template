import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { AUTH_COOKIE_NAME, getJwtSecret, isJwtError } from "@/lib/auth";

export async function PUT(req: NextRequest) {
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

    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "請填寫所有欄位" }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "新密碼至少 6 個字元" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) {
      return NextResponse.json({ error: "用戶不存在" }, { status: 404 });
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return NextResponse.json({ error: "目前密碼不正確" }, { status: 400 });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: decoded.userId }, data: { password: hashed } });

    return NextResponse.json({ message: "密碼已更新" });
  } catch (error) {
    console.error("Update password error:", error);
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}
