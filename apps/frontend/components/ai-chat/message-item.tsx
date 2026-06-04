"use client";

import { useMemo } from "react";
import { ChartRenderer } from "./chart-renderer";
import type { ChartConfig } from "@/types/ai-types";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface MessageItemProps {
  message: Message;
}

function parseContent(content: string) {
  const chartRegex = /<CHART>([\s\S]*?)<\/CHART>/g;
  const charts: ChartConfig[] = [];
  let textContent = content;

  for (const match of Array.from(content.matchAll(chartRegex))) {
    try {
      const chartConfig = JSON.parse(match[1]!.trim()) as ChartConfig;
      charts.push(chartConfig);
      textContent = textContent.replace(match[0]!, "").trim();
    } catch (error) {
      console.error("Failed to parse chart JSON:", error);
    }
  }

  return { text: textContent, charts };
}

export function MessageItem({ message }: MessageItemProps) {
  const isUser = message.role === "user";
  const { text, charts } = useMemo(
    () => parseContent(message.content),
    [message.content],
  );

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      <div
        className={`max-w-[85%] rounded-2xl ${
          isUser
            ? "bg-gradient-to-br from-[#DA7756] to-[#C2614A] text-white px-4 py-2.5"
            : "bg-[#262420]/70 text-[#F5F0EA] border border-[#DA7756]/30 px-4 py-2.5"
        }`}
      >
        {text && (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{text}</p>
        )}

        {charts.length > 0 && (
          <div className="mt-2">
            {charts.map((chartConfig, index) => (
              <ChartRenderer key={index} config={chartConfig} />
            ))}
          </div>
        )}

        <p className={`text-xs mt-1.5 ${isUser ? "text-[#E8DDD3]" : "text-[#BEA98F]/60"}`}>
          {message.timestamp.toLocaleTimeString("zh-TW", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}
