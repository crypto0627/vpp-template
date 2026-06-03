import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { ALLOWED_EMAILS, getUserRoleConfig } from "@/constants/auth-constants";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email和密碼都是必填項" }, { status: 400 });
    }

    if (!ALLOWED_EMAILS.includes(email)) {
      return NextResponse.json(
        { error: "Email或密碼錯誤" },
        { status: 401 },
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json(
        { error: "Email或密碼錯誤" },
        { status: 401 },
      );
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json({ error: "Email或密碼錯誤" }, { status: 401 });
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || "fallback-secret",
      { expiresIn: "7d" },
    );

    const roleConfig = getUserRoleConfig(user.email);
    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        role: roleConfig.role,
        sitePermissions: roleConfig.sitePermissions,
      },
    });

    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error("Signin error:", error);
    return NextResponse.json({ error: "Failed to sign in" }, { status: 500 });
  }
}
