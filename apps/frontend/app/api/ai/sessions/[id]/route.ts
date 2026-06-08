import { NextResponse } from "next/server";
import { requireAuth } from "@/middleware/auth";
import { chatService } from "@/services/ai/chat-service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const messages = await chatService.getSessionMessages(id, user.id);

    return NextResponse.json({
      messages: messages.map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        createdAt: msg.createdAt,
      })),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "請先登入" }, { status: 401 });
    }
    console.error("Get session messages error:", error);
    return NextResponse.json({ error: "獲取對話訊息失敗" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const deleted = await chatService.deleteSession(id, user.id);
    if (!deleted) {
      return NextResponse.json({ error: "對話不存在" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "請先登入" }, { status: 401 });
    }
    console.error("Delete session error:", error);
    return NextResponse.json({ error: "刪除對話失敗" }, { status: 500 });
  }
}
