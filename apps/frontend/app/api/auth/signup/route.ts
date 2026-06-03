import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { ALLOWED_EMAILS, getUserRoleConfig } from "@/constants/auth-constants";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    if (!ALLOWED_EMAILS.includes(email)) {
      return NextResponse.json(
        { error: "Invalid email, please contact jake.kuo@fortune.com.tw" },
        { status: 401 },
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "User already exists" }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({ data: { email, password: hashedPassword } });

    const roleConfig = getUserRoleConfig(user.email);
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        role: roleConfig.role,
        sitePermissions: roleConfig.sitePermissions,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }
}
