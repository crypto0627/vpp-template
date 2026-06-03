import type { TelemetryData, ChargingPileEntry } from "@/types/telemetry";
import type { SiteSimulationConfig } from "@/config/site-configs";
import { isSummerDate } from "@/config/site-configs";
import { isPeakTimeTW, isSemiPeakTimeTW } from "@/utils/bess-algorithm/time-utils";
import { getElectricityRate } from "@/utils/bess-algorithm/electricity-rate";
import { isNationalHolidayTW } from "@/constants/taiwan-holidays";

export type BatteryStatus = "充電中" | "放電中" | "待機";

export interface LiveStats {
  usageKWh: number;
  costNTD: number;
  latestSOC: number | null;
  batteryStatus: BatteryStatus;
  chargingPiles: { active: number; total: number; usage: number } | null;
}

/**
 * Derives battery status from current time using the BESS algorithm rules:
 * - Weekend / holiday → 待機 (no operation)
 * - Peak time → 放電中 (discharging to reduce peak demand)
 * - Before peak start on weekday → 充電中 (off-peak charging window)
 * - Otherwise → 待機
 */
function deriveBatteryStatus(
  now: Date,
  config: SiteSimulationConfig,
): BatteryStatus {
  const isWeekend = now.getDay() === 0 || now.getDay() === 6;
  const isHoliday = isNationalHolidayTW(now);
  if (isWeekend || isHoliday) return "待機";

  if (isPeakTimeTW(now, config)) return "放電中";

  // Determine charging window: 00:00 → peak start (season-aware)
  const tw = new Date(now.getTime() + 8 * 3600 * 1000);
  const month = tw.getUTCMonth() + 1;
  const day = tw.getUTCDate();
  const isSummer = isSummerDate(month, day, config);
  const peakStartH = isSummer ? config.PEAK_START_HOUR : config.NON_SUMMER_PEAK_START_HOUR;
  const peakStartM = isSummer ? config.PEAK_START_MINUTE : config.NON_SUMMER_PEAK_START_MINUTE;
  const nowMin = tw.getUTCHours() * 60 + tw.getUTCMinutes();
  if (nowMin < peakStartH * 60 + peakStartM) return "充電中";

  return "待機";
}

/**
 * Counts active and total charging piles from the latest ChargingInfo record.
 * Returns null if the site has no charging piles (e.g. ETai).
 */
function parseChargingPiles(
  info: Record<string, ChargingPileEntry | number> | undefined,
): { active: number; total: number; usage: number } | null {
  if (!info) return null;
  const piles = Object.entries(info).filter(
    ([key, val]) => key !== "TotalCharging" && typeof val === "object" && val !== null,
  ) as [string, ChargingPileEntry][];

  if (piles.length === 0) return null;

  const total = piles.length;
  const active = piles.filter(([, v]) => typeof v.數值 === "number" && v.數值 > 0).length;
  const usage = total > 0 ? Math.round((active / total) * 1000) / 10 : 0;
  return { total, active, usage };
}

export function calcLiveStats(
  data: TelemetryData[],
  config: SiteSimulationConfig,
): LiveStats {
  const empty: LiveStats = {
    usageKWh: 0,
    costNTD: 0,
    latestSOC: null,
    batteryStatus: "待機",
    chargingPiles: null,
  };
  if (data.length === 0) return empty;

  let usageKWh = 0;
  let costNTD = 0;

  let avgIntervalHours = 5 / 3600;
  if (data.length >= 2) {
    const first = new Date(data[0]!.createAt).getTime();
    const last = new Date(data[data.length - 1]!.createAt).getTime();
    avgIntervalHours = (last - first) / (1000 * 3600) / (data.length - 1);
    avgIntervalHours = Math.max(0, Math.min(avgIntervalHours, 1));
  }

  for (let i = 0; i < data.length; i++) {
    const item = data[i]!;
    const date = new Date(item.createAt);

    const nextItem = i < data.length - 1 ? data[i + 1] : null;
    let intervalHours: number;
    if (nextItem) {
      intervalHours = (new Date(nextItem.createAt).getTime() - date.getTime()) / (1000 * 3600);
      intervalHours = Math.max(0, Math.min(intervalHours, 1));
    } else {
      intervalHours = avgIntervalHours;
    }
    if (intervalHours <= 0) continue;

    const loadKW = (item.TotalUsage || 0) / 1000;
    const kwh = loadKW * intervalHours;
    usageKWh += kwh;

    const { peakRate, semiPeakRate, offRate } = getElectricityRate(date, config);
    const isPeak = isPeakTimeTW(date, config);
    const isSemiPeak = !isPeak && isSemiPeakTimeTW(date, config);
    const rate = isPeak ? peakRate : isSemiPeak ? semiPeakRate : offRate;
    costNTD += kwh * rate;
  }

  const latest = data[data.length - 1]!;
  const latestTime = new Date(latest.createAt);

  return {
    usageKWh: Math.round(usageKWh * 100) / 100,
    costNTD: Math.round(costNTD),
    latestSOC: latest.BESS?.SOC ?? null,
    batteryStatus: deriveBatteryStatus(latestTime, config),
    chargingPiles: parseChargingPiles(latest.ChargingInfo),
  };
}
