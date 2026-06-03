export type SiteId = "neihu" | "etai";
export type SiteType = "charging" | "storage";

export interface SiteStats {
  siteType: SiteType;
  electricityUsage: { withBESS: number; withoutBESS: number };
  electricityCost: { withBESS: number; withoutBESS: number };
  batteryStatus: "充電中" | "放電中" | "待機";
  chargingPiles?: { active: number; total: number; usage: number };
}

export const SITE_STATS: Record<SiteId, SiteStats> = {
  neihu: {
    siteType: "charging",
    electricityUsage: { withBESS: 1234.56, withoutBESS: 1456.78 },
    electricityCost: { withBESS: 4521, withoutBESS: 5321 },
    batteryStatus: "待機",
    chargingPiles: { active: 3, total: 8, usage: 37.5 },
  },
  etai: {
    siteType: "storage",
    electricityUsage: { withBESS: 8234.56, withoutBESS: 9456.78 },
    electricityCost: { withBESS: 32521, withoutBESS: 42321 },
    batteryStatus: "放電中",
  },
};
