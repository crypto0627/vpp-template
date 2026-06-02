/**
 * Static mock data for VPP Dashboard Template
 *
 * This file is the single source of truth for all demo data.
 * Replace these values with your real API calls when integrating a live backend.
 */

import type { TelemetryData, SummaryData } from "@/types/data-type";
import type { ReportData, DailyRecord, Summary } from "@/types/report-type";
import type { HourlyPowerRecord } from "@/types/hourly-power-record";

// ─── Telemetry (24 hourly snapshots for today) ───────────────────────────────

export const MOCK_TELEMETRY: TelemetryData[] = Array.from({ length: 24 }, (_, h) => {
  const soc = h < 5
    ? Math.round((h + 1) * 18)                          // 00–04: charging 0→90%
    : h < 16
      ? 90                                               // 05–15: idle at 90%
      : Math.max(0, Math.round(90 - (h - 15) * 15));    // 16–23: discharging

  const totalUsageW = (300 + Math.round(Math.sin((h - 8) * 0.5) * 100)) * 1000;

  const acPiles: Record<string, { 開關: string; 數值: number }> = {};
  for (let i = 1; i <= 15; i++) {
    const key = `AC${i}`;
    const isActive = h >= 8 && h <= 22 && i <= 8;
    acPiles[key] = { 開關: isActive ? "ON" : "OFF", 數值: isActive ? 22 + (i % 3) * 7 : 0 };
  }

  return {
    BESS: { SOC: soc, SOH: 96, Voltage: 748 },
    TotalUsage: totalUsageW,
    ChargingInfo: {
      TotalCharging: h >= 8 && h <= 22 ? 180 + h * 3 : 0,
      SuperCharging: { 開關: h >= 10 && h <= 20 ? "ON" : "OFF", 數值: h >= 10 && h <= 20 ? 90 : 0 },
      DC: { 上限: 150, 開關: h >= 9 && h <= 21 ? "ON" : "OFF", 數值: h >= 9 && h <= 21 ? 120 : 0 },
      ...acPiles,
    },
    createAt: `2026-06-02T${String(h).padStart(2, "0")}:00:00.000Z`,
  };
});

// ─── Summary (home & site pages) ─────────────────────────────────────────────

export const MOCK_SUMMARY_NEIHU: SummaryData = {
  electricityUsage: { value: 1248.5, unit: "kWh", withBESS: 978.0 },
  costs: { value: 46070, unit: "NT$" },
  solarPower: { value: 0, unit: "kW" },
  energyStorage: { value: 74, unit: "%", status: "idle" },
  chargingPiles: { active: 8, total: 15, usage: 53.33 },
  savings: {
    value: 7650,
    unit: "NT$",
    costWithoutBESS: 46070,
    costWithBESS: 38420,
    peakDischargeKWh: 320.5,
    offPeakChargeKWh: 370.0,
  },
};

export const MOCK_SUMMARY_ETAI: SummaryData = {
  electricityUsage: { value: 8420.0, unit: "kWh", withBESS: 6890.0 },
  costs: { value: 182400, unit: "NT$" },
  solarPower: { value: 0, unit: "kW" },
  energyStorage: { value: 68, unit: "%", status: "idle" },
  chargingPiles: { active: 0, total: 0, usage: 0 },
  savings: {
    value: 35200,
    unit: "NT$",
    costWithoutBESS: 217600,
    costWithBESS: 182400,
    peakDischargeKWh: 2800.0,
    offPeakChargeKWh: 3200.0,
  },
};

// ─── Report (financial report page) ──────────────────────────────────────────

function makeDailyRecord(date: string, dayIndex: number): DailyRecord {
  const base = 1200 + dayIndex * 8;
  const withoutBESS = Math.round(base * 12.47 + base * 0.7 * 3.05);
  const withBESS = Math.round(withoutBESS * 0.833);
  return {
    date,
    peakKWh: base,
    offPeakKWh: Math.round(base * 0.7),
    hours: 24,
    withoutBESS,
    withBESS,
    savings: withoutBESS - withBESS,
    chargedKWh: 370,
    dischargedKWh: 335,
    startSOC: dayIndex % 5 === 0 ? 10 : 280,
    endSOC: dayIndex % 5 === 0 ? 355 : 20,
    soh: 96,
    capacityKWh: 370,
    overContractCount: Math.round(Math.random() * 2),
    bessSuppressedCount: Math.round(Math.random() * 2),
    peakGridSupplementCount: 2,
  };
}

const reportDays: DailyRecord[] = Array.from({ length: 30 }, (_, i) => {
  const d = new Date("2026-01-01");
  d.setDate(d.getDate() + i);
  return makeDailyRecord(d.toISOString().split("T")[0]!, i);
});

const reportSummary: Summary = {
  totalHours: 720,
  totalPeakKWh: reportDays.reduce((s, d) => s + d.peakKWh, 0),
  totalOffPeakKWh: reportDays.reduce((s, d) => s + d.offPeakKWh, 0),
  totalKWh: reportDays.reduce((s, d) => s + d.peakKWh + d.offPeakKWh, 0),
  costWithoutBESS: reportDays.reduce((s, d) => s + d.withoutBESS, 0),
  costWithBESS: reportDays.reduce((s, d) => s + d.withBESS, 0),
  savings: reportDays.reduce((s, d) => s + d.savings, 0),
  savingsRate: 16.6,
  peakSavingsKWh: 9900,
  withoutPeakCost: Math.round(reportDays.reduce((s, d) => s + d.withoutBESS, 0) * 0.7),
  withoutOffpeakCost: Math.round(reportDays.reduce((s, d) => s + d.withoutBESS, 0) * 0.3),
  withPeakCost: Math.round(reportDays.reduce((s, d) => s + d.withBESS, 0) * 0.55),
  withOffpeakCost: Math.round(reportDays.reduce((s, d) => s + d.withBESS, 0) * 0.45),
  totalOverContractCount: 12,
  totalBessSuppressedCount: 10,
  totalPeakGridSupplementCount: 58,
  drDays: 0,
  drTotalCost: 0,
  costWithBESSAfterDR: reportDays.reduce((s, d) => s + d.withBESS, 0),
  sRegRevenue: 0,
  costWithBESSFinal: reportDays.reduce((s, d) => s + d.withBESS, 0),
};

export const MOCK_REPORT_DATA: ReportData = {
  summary: reportSummary,
  dailyReport: reportDays,
};

// ─── History (history page) ───────────────────────────────────────────────────

export const MOCK_HOURLY_DATA: HourlyPowerRecord[] = Array.from({ length: 24 }, (_, h) => ({
  date_timerange: `2026-01-15T${String(h).padStart(2, "0")}:00:00+08:00`,
  "power(kwh)": Math.round((300 + Math.sin((h - 8) * 0.5) * 100) * 10) / 10,
}));

// History report (same shape as ReportData, used on history page)
export const MOCK_HISTORY_REPORT = MOCK_REPORT_DATA;

// ─── Period savings (site-summary-cards) ──────────────────────────────────────

export const MOCK_MONTHLY_SAVINGS = {
  period: "month" as const,
  savings: 189600,
  costWithoutBESS: 1382400,
  costWithBESS: 1192800,
  savingsRate: 13.7,
  daysCount: 30,
  start: "2026-01-01",
  end: "2026-01-31",
};

export const MOCK_YEARLY_SAVINGS = {
  period: "year" as const,
  savings: 2275200,
  costWithoutBESS: 16588800,
  costWithBESS: 14313600,
  savingsRate: 13.7,
  daysCount: 365,
  start: "2026-01-01",
  end: "2026-12-31",
};
