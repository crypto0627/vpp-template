/**
 * Mock data generators for tests
 */

import type { TelemetryData, BESS, ChargingInfo } from "@/types/data-type";
import type { PersistedBESSState } from "@/types/bess-type";
import type { DailyRecord, Summary, ReportData } from "@/types/report-type";

/**
 * Generate mock telemetry data
 */
export function createMockTelemetryData(
  overrides?: Partial<TelemetryData>,
): TelemetryData {
  const mockBESS: BESS = {
    SOC: 75.5,
    SOH: 98.2,
    Voltage: 720.5,
    ...overrides?.BESS,
  };

  const mockChargingInfo: ChargingInfo = {
    TotalCharging: 25.5,
    SuperCharging: { 開關: "OFF", 數值: 0 },
    DC: { 上限: 150, 開關: "OFF", 數值: 0 },
    ...overrides?.ChargingInfo,
  };

  return {
    createAt: new Date().toISOString(),
    BESS: mockBESS,
    ChargingInfo: mockChargingInfo,
    TotalUsage: 25.5,
    ...overrides,
  };
}

/**
 * Generate mock BESS state
 */
export function createMockBESSState(
  overrides?: Partial<PersistedBESSState>,
): PersistedBESSState {
  const dateStr = new Date().toISOString().split("T")[0];
  if (!dateStr) {
    throw new Error("Failed to format date");
  }

  return {
    socKWh: 280,
    lastTimestamp: Date.now(),
    lastChargeSessionDateTW: dateStr,
    chargeSessionActive: false,
    ...overrides,
  };
}

/**
 * Generate mock daily report
 */
export function createMockDailyRecord(
  overrides?: Partial<DailyRecord>,
): DailyRecord {
  const dateStr = new Date().toISOString().split("T")[0];
  if (!dateStr) {
    throw new Error("Failed to format date");
  }

  return {
    date: dateStr,
    peakKWh: 150.5,
    offPeakKWh: 85.3,
    hours: 8.5,
    withoutBESS: 4500,
    withBESS: 3200,
    savings: 1300,
    chargedKWh: 200,
    dischargedKWh: 150,
    startSOC: 100,
    endSOC: 150,
    ...overrides,
  };
}

/**
 * Generate mock summary
 */
export function createMockSummary(overrides?: Partial<Summary>): Summary {
  return {
    totalHours: 250,
    totalPeakKWh: 4500,
    totalOffPeakKWh: 2500,
    totalKWh: 7000,
    costWithoutBESS: 135000,
    costWithBESS: 95000,
    savings: 40000,
    savingsRate: 29.6,
    peakSavingsKWh: 3000,
    withoutPeakCost: 90000,
    withoutOffpeakCost: 45000,
    withPeakCost: 60000,
    withOffpeakCost: 35000,
    ...overrides,
  };
}

/**
 * Generate mock report data
 */
export function createMockReportData(
  overrides?: Partial<ReportData>,
): ReportData {
  const dailyReport = Array.from({ length: 30 }, (_, i) => {
    const dateStr = new Date(2025, 0, i + 1).toISOString().split("T")[0];
    if (!dateStr) {
      throw new Error("Failed to format date");
    }
    return createMockDailyRecord({ date: dateStr });
  });

  return {
    summary: createMockSummary(),
    dailyReport,
    ...overrides,
  };
}
