import { prisma } from "@/lib/prisma";
import type { ChatSession, Message } from "@/lib/generated/prisma";

export class ChatService {
  async getOrCreateSession(
    sessionId: string | undefined,
    userId: string,
    firstMessage: string,
  ): Promise<ChatSession & { messages: Message[] }> {
    if (sessionId) {
      // Scope by userId so a caller can only resume their OWN session.
      const session = await prisma.chatSession.findFirst({
        where: { id: sessionId, userId },
        include: { messages: { orderBy: { createdAt: "asc" } } },
      });
      if (session) return session;
    }

    const title =
      firstMessage.length > 30
        ? firstMessage.slice(0, 30) + "..."
        : firstMessage;

    // Let Prisma generate the id (cuid). Never trust a client-supplied id —
    // doing so produced guessable, sequential ids (Date.now()).
    return await prisma.chatSession.create({
      data: { userId, title },
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

  async getSessionMessages(sessionId: string, userId: string): Promise<Message[]> {
    // The nested `session: { userId }` filter ensures messages are only
    // returned when the session belongs to the requesting user.
    return await prisma.message.findMany({
      where: { sessionId, session: { userId } },
      orderBy: { createdAt: "asc" },
    });
  }

  /** Deletes the session only if it belongs to `userId`. Returns true when a
   *  row was actually deleted (false → not found or not owned by the caller). */
  async deleteSession(sessionId: string, userId: string): Promise<boolean> {
    const result = await prisma.chatSession.deleteMany({
      where: { id: sessionId, userId },
    });
    return result.count > 0;
  }
}

export const chatService = new ChatService();
