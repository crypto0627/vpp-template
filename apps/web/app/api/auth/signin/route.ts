import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { ALLOWED_EMAILS, getUserRoleConfig } from "@/constants/auth-constants";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    if (!ALLOWED_EMAILS.includes(email)) {
      return NextResponse.json(
        {
          error:
            "Invalid email, please call website manager 'jake.kuo@fortune.com.tw'",
        },
        { status: 401 },
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials, cannot find user" },
        { status: 401 },
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || "fallback-secret",
      {
        expiresIn: "7d",
      },
    );

    // Create response with role info
    const roleConfig = getUserRoleConfig(user.email);
    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        role: roleConfig.role,
        sitePermissions: roleConfig.sitePermissions,
      },
    });

    // Set HTTP-only cookie
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return response;
  } catch (error) {
    console.error("❌ Signin API Error:", error);
    console.error(
      "Error details:",
      error instanceof Error ? error.message : error,
    );
    console.error("Stack:", error instanceof Error ? error.stack : "N/A");
    return NextResponse.json({ error: "Failed to sign in" }, { status: 500 });
  }
}
