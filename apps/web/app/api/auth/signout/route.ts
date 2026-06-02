import { NextResponse } from "next/server";

export async function POST() {
  try {
    // Create response
    const response = NextResponse.json({ message: "Signed out successfully" });

    // Clear the auth-token cookie
    response.cookies.set("auth-token", "", {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 0, // Expire immediately
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Failed to sign out" }, { status: 500 });
  }
}
