import { prisma } from "@/lib/prisma";
import type { ChatSession, Message } from "@/lib/generated/prisma";

export class ChatService {
  async getOrCreateSession(
    sessionId: string | undefined,
    userId: string,
    firstMessage: string,
  ): Promise<ChatSession & { messages: Message[] }> {
    if (sessionId) {
      const session = await prisma.chatSession.findUnique({
        where: { id: sessionId },
        include: { messages: { orderBy: { createdAt: "asc" } } },
      });
      if (session) return session;
    }

    const title =
      firstMessage.length > 30
        ? firstMessage.slice(0, 30) + "..."
        : firstMessage;

    return await prisma.chatSession.create({
      data: { id: sessionId, userId, title },
      include: { messages: true },
    });
  }

  async saveUserMessage(sessionId: string, content: string): Promise<Message> {
    return await prisma.message.create({
      data: { sessionId, role: "user", content },
    });
  }

  async saveAssistantMessage(
    sessionId: string,
    content: string,
    contentType: "text" | "chart" | "mixed" = "text",
    chartConfig: unknown | null = null,
  ): Promise<Message> {
    return await prisma.message.create({
      data: {
        sessionId,
        role: "assistant",
        content,
        contentType,
        chartConfig: chartConfig ? JSON.parse(JSON.stringify(chartConfig)) : null,
      },
    });
  }

  async updateLastMessageTime(sessionId: string): Promise<void> {
    await prisma.chatSession.update({
      where: { id: sessionId },
      data: { lastMessageAt: new Date() },
    });
  }

  async getUserSessions(userId: string): Promise<ChatSession[]> {
    return await prisma.chatSession.findMany({
      where: { userId },
      orderBy: { lastMessageAt: "desc" },
      take: 50,
    });
  }

  async getSessionMessages(sessionId: string): Promise<Message[]> {
    return await prisma.message.findMany({
      where: { sessionId },
      orderBy: { createdAt: "asc" },
    });
  }

  async deleteSession(sessionId: string): Promise<void> {
    await prisma.chatSession.delete({ where: { id: sessionId } });
  }
}

export const chatService = new ChatService();
