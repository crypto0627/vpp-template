// types/telemetry.ts
export interface BESS {
  SOC: number;
  SOH: number;
  Voltage: number;
  Power?: number; // BESS 功率 (W)：正值=充電，負值=放電（由 simulateBESSForRealData 添加）
}

export interface ChargingInfo {
  TotalCharging: number;
  SuperCharging: {
    開關: string;
    數值: number;
  };
  DC: {
    上限: number;
    開關: string;
    數值: number;
  };
  [key: string]:
    | number
    | { 開關: string; 數值: number }
    | { 上限: number; 開關: string; 數值: number }; // AC1~AC15 with structure { 開關: string, 數值: number }
}

export interface TelemetryData {
  BESS: BESS;
  TotalUsage: number;
  ChargingInfo: ChargingInfo;
  createAt: string; // 注意：API 回傳的是 ISO string，前端 parse 成 Date 用 new Date(item.createAt)
}

// Aggregated daily data from Node.js server (for week/month ranges)
export interface AggregatedDailyData {
  date: string; // YYYY-MM-DD
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

export interface Site {
  id: SiteId;
  name: string;
  location: string;
  status: "online" | "offline" | "maintenance";
  contract_limit: number;
  capacity: number;
  type:
    | "storage"
    | "charging"
    | "charging-storage"
    | "charging-storage-solar"
    | "solar-storage";
}

export interface SummaryData {
  electricityUsage: {
    value: number; // 無儲能總用電量（場站負載）
    unit: string;
    withBESS?: number; // 有儲能總用電量（從電網取電）
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
  // 儲能省電費計算
  savings?: {
    value: number; // 省下的電費金額
    unit: string;
    costWithoutBESS: number; // 無儲能電費
    costWithBESS: number; // 有儲能電費
    peakDischargeKWh: number; // 尖峰放電量
    offPeakChargeKWh: number; // 離峰充電量
  };
}

export type SiteType = "charging" | "storage";

// Period savings result
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
  data: Record<SiteId, TelemetryData[]>;
  summaryData: Record<SiteId, SummaryData>;
  bessState: Record<SiteId, null>; // Reserved for future BESS state persistence
  isLoading: boolean;
  error: Record<SiteId, string | null>;
  lastUpdated: Date | null;

  setCurrentSite: (siteId: SiteId) => void;
  fetchData: (siteId: SiteId) => Promise<void>;
  appendData: (siteId: SiteId, item: TelemetryData) => void;
  calculatePeriodSavings: (period: "month" | "year") => Promise<PeriodSavings>;
}
