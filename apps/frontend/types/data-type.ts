export type { TelemetryData, ChargingPileEntry } from "@/types/telemetry";

export interface AggregatedDailyData {
  date: string;
  count: number;
  avgSOC: number;
  avgSOH: number;
  avgVoltage: number;
  totalUsage: number;
  totalCharging: number;
  avgSuperCharging: { 開關: string; 數值: number };
  avgDC: { 上限: number; 開關: string; 數值: number };
}

export type TimeRange = "today" | "month" | "year";

export type SiteId = "neihu" | "etai";

export type SiteType = "charging" | "storage";

export interface SummaryData {
  electricityUsage: {
    value: number;
    unit: string;
    withBESS?: number;
  };
  costs: {
    value: number;
    unit: string;
  };
  solarPower: {
    value: number;
    unit: string;
  };
  energyStorage: {
    value: number;
    unit: string;
    status: "charging" | "discharging" | "idle";
  };
  chargingPiles: {
    active: number;
    total: number;
    usage: number;
  };
  savings?: {
    value: number;
    unit: string;
    costWithoutBESS: number;
    costWithBESS: number;
    peakDischargeKWh: number;
    offPeakChargeKWh: number;
  };
}

export interface PeriodSavings {
  period: "month" | "year";
  start: string;
  end: string;
  savings: number;
  costWithoutBESS: number;
  costWithBESS: number;
  savingsRate: number;
  daysCount: number;
}

export interface SiteDataState {
  currentSite: SiteId;
  currentSiteType: SiteType;
  data: Record<SiteId, import("@/types/telemetry").TelemetryData[]>;
  summaryData: Record<SiteId, SummaryData>;
  bessState: Record<SiteId, import("@/types/bess-type").PersistedBESSState | null>;
  isLoading: boolean;
  error: Record<SiteId, string | null>;
  lastUpdated: Date | null;

  setCurrentSite: (siteId: SiteId) => void;
  fetchData: (siteId: SiteId) => Promise<void>;
  appendData: (siteId: SiteId, item: import("@/types/telemetry").TelemetryData) => void;
  calculatePeriodSavings: (period: "month" | "year") => Promise<PeriodSavings>;
}
