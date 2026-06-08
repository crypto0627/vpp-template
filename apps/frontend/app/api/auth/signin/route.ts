import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { ALLOWED_EMAILS, getUserRoleConfig } from "@/constants/auth-constants";
import { AUTH_COOKIE_NAME, AUTH_COOKIE_MAX_AGE, JWT_EXPIRES_IN, authCookieOptions, getJwtSecret } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

    const token = jwt.sign({ userId: user.id }, getJwtSecret(), {
      expiresIn: JWT_EXPIRES_IN,
    });

    const roleConfig = getUserRoleConfig(user.email);
    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        role: roleConfig.role,
        sitePermissions: roleConfig.sitePermissions,
      },
    });

    response.cookies.set(AUTH_COOKIE_NAME, token, authCookieOptions(AUTH_COOKIE_MAX_AGE));
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");

    return response;
  } catch (error) {
    console.error("Signin error:", error);
    return NextResponse.json({ error: "Failed to sign in" }, { status: 500 });
  }
}
