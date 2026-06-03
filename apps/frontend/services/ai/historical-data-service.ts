interface ReportSummary {
  totalKWh: number;
  totalPeakKWh: number;
  totalOffPeakKWh: number;
  costWithoutBESS: number;
  withoutPeakCost: number;
  withoutOffpeakCost: number;
  costWithBESS: number;
  withPeakCost: number;
  withOffpeakCost: number;
  savings: number;
  savingsRate: number;
  peakSavingsKWh: number;
}

export function detectDateRange(
  message: string,
): { start: string; end: string } | null {
  const lowerMessage = message.toLowerCase();

  const monthMatch = message.match(/20(\d{2})[年/-](\d{1,2})(月)?/);
  if (monthMatch && monthMatch[1] && monthMatch[2]) {
    const year = `20${monthMatch[1]}`;
    const month = monthMatch[2].padStart(2, "0");
    const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
    return { start: `${year}-${month}-01`, end: `${year}-${month}-${lastDay}` };
  }

  const yearMatch = message.match(/20(\d{2})(年)?/);
  if (yearMatch) {
    const year = `20${yearMatch[1]}`;
    return { start: `${year}-01-01`, end: `${year}-12-31` };
  }

  if (lowerMessage.includes("今年") || lowerMessage.includes("this year")) {
    const year = new Date().getFullYear();
    return { start: `${year}-01-01`, end: `${year}-12-31` };
  }

  if (lowerMessage.includes("上個月") || lowerMessage.includes("last month")) {
    const lastMonth = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);
    const year = lastMonth.getFullYear();
    const month = String(lastMonth.getMonth() + 1).padStart(2, "0");
    const lastDay = new Date(year, lastMonth.getMonth() + 1, 0).getDate();
    return { start: `${year}-${month}-01`, end: `${year}-${month}-${lastDay}` };
  }

  return null;
}

export async function getHistoricalReport(
  start: string,
  end: string,
): Promise<string> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const response = await fetch(
      `${baseUrl}/api/neihu/report?start=${start}&end=${end}`,
      { cache: "no-store" },
    );

    if (!response.ok) return `無法獲取 ${start} 至 ${end} 的歷史數據`;

    const data = await response.json();
    if (data.error === "NO_DATA") return `${start} 至 ${end} 期間沒有可用的歷史數據`;

    return formatHistoricalReport(start, end, data.summary);
  } catch (error) {
    return `獲取歷史數據時發生錯誤: ${error instanceof Error ? error.message : "Unknown error"}`;
  }
}

function formatHistoricalReport(
  start: string,
  end: string,
  summary: ReportSummary,
): string {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const duration = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
  );

  return `
Historical Energy Report (${start} to ${end}):

Summary (${duration} days):
- Total Energy Consumption: ${summary.totalKWh.toLocaleString()} kWh
  - Peak Hours: ${summary.totalPeakKWh.toLocaleString()} kWh
  - Off-Peak Hours: ${summary.totalOffPeakKWh.toLocaleString()} kWh

Cost Analysis:
- Without BESS: NT$ ${summary.costWithoutBESS.toLocaleString()}
  - Peak Cost: NT$ ${summary.withoutPeakCost.toLocaleString()}
  - Off-Peak Cost: NT$ ${summary.withoutOffpeakCost.toLocaleString()}

- With BESS: NT$ ${summary.costWithBESS.toLocaleString()}
  - Peak Cost: NT$ ${summary.withPeakCost.toLocaleString()}
  - Off-Peak Cost: NT$ ${summary.withOffpeakCost.toLocaleString()}

BESS Performance:
- Total Savings: NT$ ${summary.savings.toLocaleString()} (${summary.savingsRate}% reduction)
- Peak Energy Replaced by BESS: ${summary.peakSavingsKWh.toLocaleString()} kWh

Daily Average:
- Energy Consumption: ${(summary.totalKWh / duration).toFixed(2)} kWh/day
- Cost Without BESS: NT$ ${(summary.costWithoutBESS / duration).toFixed(2)}/day
- Cost With BESS: NT$ ${(summary.costWithBESS / duration).toFixed(2)}/day
- Daily Savings: NT$ ${(summary.savings / duration).toFixed(2)}/day
  `.trim();
}
