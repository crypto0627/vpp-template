export interface ChatRequest {
  sessionId?: string;
  message: string;
  context?: string;
}

export interface ChatResponse {
  sessionId: string;
  message: {
    id: string;
    role: string;
    content: string;
    contentType?: MessageContentType;
    chartConfig?: ChartConfig | null;
    timestamp: Date;
  };
  usage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  finishReason?: string;
}

export interface ChatSessionItem {
  id: string;
  title: string;
  lastMessageAt: Date | null;
  createdAt: Date;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

export type MessageContentType = "text" | "chart" | "mixed";

export interface ChartConfig {
  type:
    | "power-demand"
    | "bess-charge-discharge"
    | "cost-trend"
    | "cost-comparison"
    | "battery-soc"
    | "yearly-comparison";
  title: string;
  dateRange?: {
    start: string;
    end: string;
  };
  dataSource: "realtime" | "historical";
  data?: Array<Record<string, unknown>>;
  siteId?: string;
}
