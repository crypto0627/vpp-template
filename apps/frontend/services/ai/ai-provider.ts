import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";

type CoreMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

export interface AIGenerateResult {
  text: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  finishReason: string;
}

export class AIProvider {
  private readonly model = anthropic("claude-3-haiku-20240307");
  private readonly temperature = 0.7;
  private readonly maxOutputTokens = 2000;

  async generateResponse(
    systemPrompt: string,
    messages: CoreMessage[],
  ): Promise<AIGenerateResult> {
    const { text, usage, finishReason } = await generateText({
      model: this.model,
      system: systemPrompt,
      messages,
      temperature: this.temperature,
      maxOutputTokens: this.maxOutputTokens,
    });

    return {
      text,
      usage: {
        inputTokens: usage.inputTokens || 0,
        outputTokens: usage.outputTokens || 0,
        totalTokens: usage.totalTokens || 0,
      },
      finishReason: finishReason || "stop",
    };
  }

  buildConversationHistory(
    messages: Array<{ role: string; content: string }>,
    newMessage: string,
  ): CoreMessage[] {
    const history = messages.map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    }));
    history.push({ role: "user" as const, content: newMessage });
    return history;
  }
}

export const aiProvider = new AIProvider();
