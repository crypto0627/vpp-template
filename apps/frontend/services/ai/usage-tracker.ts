import { prisma } from "@/lib/prisma";

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export class UsageTracker {
  async trackUsage(userId: string, usage: TokenUsage): Promise<void> {
    await prisma.usageMetric.create({
      data: {
        userId,
        promptTokens: usage.inputTokens,
        completionTokens: usage.outputTokens,
        totalTokens: usage.totalTokens,
      },
    });
  }
}

export const usageTracker = new UsageTracker();
