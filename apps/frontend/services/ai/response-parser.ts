import type { ChartConfig } from "@/types/ai-types";

export class ResponseParser {
  parseResponse(rawContent: string): {
    type: "text" | "chart" | "mixed";
    text: string;
    charts: ChartConfig[];
  } {
    const chartRegex = /<CHART>([\s\S]*?)<\/CHART>/g;
    const matches = Array.from(rawContent.matchAll(chartRegex));
    const charts: ChartConfig[] = [];
    let textContent = rawContent;

    for (const match of matches) {
      try {
        const chartConfig = JSON.parse(match[1]!.trim()) as ChartConfig;
        charts.push(chartConfig);
        textContent = textContent.replace(match[0]!, "").trim();
      } catch (error) {
        console.error("Failed to parse chart JSON:", error);
      }
    }

    const type =
      charts.length === 0 ? "text" : charts.length === 1 ? "chart" : "mixed";

    return { type, text: textContent, charts };
  }
}

export const responseParser = new ResponseParser();
