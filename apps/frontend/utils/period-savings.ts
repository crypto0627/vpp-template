import { PeriodSavings } from "@/types/data-type";

export async function calculatePeriodSavings(period: "month" | "year"): Promise<PeriodSavings> {
  try {
    const now = new Date();
    const twNow = toTW(now);

    const yesterday = new Date(now.getTime() + 8 * 60 * 60 * 1000);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const yTW = {
      year: yesterday.getUTCFullYear(),
      month: yesterday.getUTCMonth() + 1,
      day: yesterday.getUTCDate(),
    };

    let start: string;
    if (period === "month") {
      start = `${twNow.year}-${String(twNow.month).padStart(2, "0")}-01`;
    } else {
      start = `${twNow.year}-01-01`;
    }

    const end = `${yTW.year}-${String(yTW.month).padStart(2, "0")}-${String(yTW.day).padStart(2, "0")}`;

    if (end < start) {
      return { period, start, end: start, savings: 0, costWithoutBESS: 0, costWithBESS: 0, savingsRate: 0, daysCount: 0 };
    }

    const response = await fetch(`/api/neihu/report?start=${start}&end=${end}`);
    if (!response.ok) throw new Error(`Report API returned ${response.status}`);

    const data = await response.json();
    const summary = data.summary || {};

    return {
      period, start, end,
      savings: summary.savings || 0,
      costWithoutBESS: summary.costWithoutBESS || 0,
      costWithBESS: summary.costWithBESS || 0,
      savingsRate: summary.savingsRate || 0,
      daysCount: data.dailyReport?.length || 0,
    };
  } catch {
    return { period, start: "", end: "", savings: 0, costWithoutBESS: 0, costWithBESS: 0, savingsRate: 0, daysCount: 0 };
  }
}

function toTW(utc: Date) {
  const tw = new Date(utc.getTime() + 8 * 60 * 60 * 1000);
  return { year: tw.getUTCFullYear(), month: tw.getUTCMonth() + 1, day: tw.getUTCDate() };
}
