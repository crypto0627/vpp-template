/**
 * Electricity Rate Calculation
 *
 * Peak/semi-peak/off-peak rate retrieval based on Taiwan time, season,
 * and the per-site rate schedule (批次時間電價).
 */

import type { SiteSimulationConfig } from "@/config/site-configs";
import { isSummerDate } from "@/config/site-configs";
import { isPeakTimeTW, isSemiPeakTimeTW } from "./time-utils";

/**
 * 獲取電價費率（依案場配置）
 * Returns peak, semi-peak, and off-peak rates based on the date's season.
 */
export function getElectricityRate(
  utc: Date,
  config: SiteSimulationConfig,
): {
  peakRate: number;
  semiPeakRate: number;
  offRate: number;
} {
  const tw = new Date(utc.getTime() + 8 * 60 * 60 * 1000);
  const month = tw.getUTCMonth() + 1;
  const day = tw.getUTCDate();
  const summer = isSummerDate(month, day, config);

  return {
    peakRate: summer ? config.SUMMER_PEAK_RATE : config.NON_SUMMER_PEAK_RATE,
    semiPeakRate: summer
      ? config.SUMMER_SEMI_PEAK_RATE
      : config.NON_SUMMER_SEMI_PEAK_RATE,
    offRate: summer
      ? config.SUMMER_OFFPEAK_RATE
      : config.NON_SUMMER_OFFPEAK_RATE,
  };
}

/**
 * 獲取當前時段的電價 (NT$/kWh)
 * Checks peak → semi-peak → off-peak in priority order.
 */
export function getCurrentRate(
  date: Date,
  config: SiteSimulationConfig,
): number {
  const { peakRate, semiPeakRate, offRate } = getElectricityRate(date, config);

  if (isPeakTimeTW(date, config)) return peakRate;
  if (isSemiPeakTimeTW(date, config)) return semiPeakRate;
  return offRate;
}
