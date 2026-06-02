/**
 * 完整測試 Chat API 的每個步驟
 */

import { prisma } from "../lib/prisma.js";
import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import dotenv from "dotenv";

dotenv.config();

async function testFullChat() {
  console.log("🔍 完整診斷 Chat API\n");
  console.log("=".repeat(60));

  try {
    // 1. 測試資料庫連接
    console.log("\n1️⃣ 測試資料庫連接...");
    await prisma.$connect();
    console.log("✅ 資料庫連接成功");

    // 2. 測試創建 ChatSession
    console.log("\n2️⃣ 測試創建 ChatSession...");
    const testUserId = "test-user-id";

    const session = await prisma.chatSession.create({
      data: {
        userId: testUserId,
        title: "測試對話",
      },
    });
    console.log(`✅ ChatSession 創建成功: ${session.id}`);

    // 3. 測試創建 Message
    console.log("\n3️⃣ 測試創建 Message...");
    const userMessage = await prisma.message.create({
      data: {
        sessionId: session.id,
        role: "user",
        content: "測試訊息",
      },
    });
    console.log(`✅ Message 創建成功: ${userMessage.id}`);

    // 4. 測試 AI 生成
    console.log("\n4️⃣ 測試 AI 生成...");
    const { text, usage } = await generateText({
      model: anthropic("claude-3-haiku-20240307"),
      system: "你是測試助手，請簡短回答。",
      messages: [
        {
          role: "user",
          content: "你好",
        },
      ],
      maxOutputTokens: 100,
    });
    console.log(`✅ AI 生成成功: ${text.slice(0, 50)}...`);
    console.log(
      `   Tokens: ${usage.inputTokens} input, ${usage.outputTokens} output`,
    );

    // 5. 測試保存 AI 回應
    console.log("\n5️⃣ 測試保存 AI 回應...");
    const aiMessage = await prisma.message.create({
      data: {
        sessionId: session.id,
        role: "assistant",
        content: text,
      },
    });
    console.log(`✅ AI Message 保存成功: ${aiMessage.id}`);

    // 6. 測試保存 UsageMetric
    console.log("\n6️⃣ 測試保存 UsageMetric...");
    const metric = await prisma.usageMetric.create({
      data: {
        userId: testUserId,
        promptTokens: usage.inputTokens || 0,
        completionTokens: usage.outputTokens || 0,
        totalTokens: usage.totalTokens || 0,
      },
    });
    console.log(`✅ UsageMetric 保存成功: ${metric.id}`);

    // 清理測試數據
    console.log("\n7️⃣ 清理測試數據...");
    await prisma.message.deleteMany({ where: { sessionId: session.id } });
    await prisma.chatSession.delete({ where: { id: session.id } });
    await prisma.usageMetric.delete({ where: { id: metric.id } });
    console.log("✅ 測試數據清理完成");

    console.log("\n" + "=".repeat(60));
    console.log("✅ 所有測試通過！Chat API 應該可以正常工作。");
  } catch (error) {
    console.error("\n❌ 測試失敗:");
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testFullChat();
