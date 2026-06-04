import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { getUserRoleConfig } from "@/constants/auth-constants";
import { AUTH_COOKIE_NAME, getJwtSecret, isJwtError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
    // TEMP DEBUG — remove after diagnosing /sites auth issue
    console.log(
      `[auth/me] token=${token ? "present(" + token.length + ")" : "MISSING"} ` +
        `cookieHeader=${req.headers.get("cookie") ? "yes" : "no"} ` +
        `allCookies=[${req.cookies.getAll().map((c) => c.name).join(",")}]`,
    );
    if (!token) {
      return NextResponse.json({ error: "No authentication token" }, { status: 401 });
    }

    let decoded: { userId: string };
    try {
      decoded = jwt.verify(token, getJwtSecret()) as { userId: string };
    } catch (error) {
      // Only a genuinely bad/expired token is a 401. Anything else (e.g. a
      // missing JWT_SECRET) is a server error and must not sign the user out.
      if (isJwtError(error)) {
        return NextResponse.json({ error: "Invalid token" }, { status: 401 });
      }
      throw error;
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, createdAt: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const roleConfig = getUserRoleConfig(user.email);
    return NextResponse.json({
      ...user,
      role: roleConfig.role,
      sitePermissions: roleConfig.sitePermissions,
    });
  } catch (error) {
    console.error("Auth me error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
