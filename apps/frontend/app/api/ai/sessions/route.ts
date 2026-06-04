import { NextResponse } from "next/server";
import { requireAuth } from "@/middleware/auth";
import { chatService } from "@/services/ai/chat-service";

export async function GET() {
  try {
    const user = await requireAuth();
    const sessions = await chatService.getUserSessions(user.id);

    return NextResponse.json({
      sessions: sessions.map((session) => ({
        id: session.id,
        title: session.title,
        lastMessageAt: session.lastMessageAt,
        createdAt: session.createdAt,
      })),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "請先登入" }, { status: 401 });
    }
    console.error("Get sessions error:", error);
    return NextResponse.json({ error: "獲取對話列表失敗" }, { status: 500 });
  }
}
