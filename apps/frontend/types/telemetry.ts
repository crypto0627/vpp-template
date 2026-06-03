export interface ChargingPileEntry {
  開關?: string;
  數值: number;
  上限?: number;
}

export interface TelemetryData {
  TotalUsage: number; // watts (W)
  createAt: string;
  BESS: {
    SOC?: number;   // not always present in API response
    SOH: number;
    Voltage: number;
    Power?: number; // not always present in API response
  };
  ChargingInfo: Record<string, ChargingPileEntry | number>;
}
