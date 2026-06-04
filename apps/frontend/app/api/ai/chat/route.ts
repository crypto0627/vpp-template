import { NextResponse } from "next/server";
import { requireAuth } from "@/middleware/auth";
import { chatService } from "@/services/ai/chat-service";
import { aiProvider } from "@/services/ai/ai-provider";
import { usageTracker } from "@/services/ai/usage-tracker";
import { responseParser } from "@/services/ai/response-parser";
import { getSystemPrompt } from "@/lib/ai/prompts";
import { getSiteDataContext } from "@/services/ai/context-provider";
import { detectDateRange, getHistoricalReport } from "@/services/ai/historical-data-service";
import type { ChatRequest, ChatResponse, ChartConfig } from "@/types/ai-types";

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const body = (await req.json()) as ChatRequest;
    const { sessionId, message, context } = body;

    if (!message?.trim()) {
      return NextResponse.json({ error: "訊息不能為空" }, { status: 400 });
    }

    const session = await chatService.getOrCreateSession(sessionId, user.id, message);
    await chatService.saveUserMessage(session.id, message);

    const conversationHistory = aiProvider.buildConversationHistory(session.messages, message);

    let finalContext = context;
    if (!finalContext) {
      const dateRange = detectDateRange(message);
      if (dateRange) {
        finalContext = await getHistoricalReport(dateRange.start, dateRange.end);
      } else {
        finalContext = await getSiteDataContext("neihu");
      }
    }

    const systemPrompt = getSystemPrompt("energyAdvisor", finalContext, message);
    const aiResult = await aiProvider.generateResponse(systemPrompt, conversationHistory);
    const parsed = responseParser.parseResponse(aiResult.text);

    const aiMessage = await chatService.saveAssistantMessage(
      session.id,
      aiResult.text,
      parsed.type,
      parsed.charts.length > 0 ? parsed.charts[0]! : null,
    );

    await usageTracker.trackUsage(user.id, aiResult.usage);
    await chatService.updateLastMessageTime(session.id);

    const response: ChatResponse = {
      sessionId: session.id,
      message: {
        id: aiMessage.id,
        role: aiMessage.role,
        content: aiMessage.content,
        contentType: aiMessage.contentType,
        chartConfig: aiMessage.chartConfig as ChartConfig | null,
        timestamp: aiMessage.createdAt,
      },
      usage: aiResult.usage,
      finishReason: aiResult.finishReason,
    };

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "請先登入" }, { status: 401 });
    }
    console.error("Chat API Error:", error);
    return NextResponse.json({ error: "AI 回應生成失敗，請稍後再試" }, { status: 500 });
  }
}
