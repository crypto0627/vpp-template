/**
 * BESS Constants & Configuration Helpers
 */

import {
  type SiteSimulationConfig,
  getSohForYear,
  getDCCapacity,
} from "@/config/site-configs";

export type { SiteSimulationConfig };

export function getMaxSOC(timeMs: number, config: SiteSimulationConfig): number {
  const year = new Date(timeMs + 8 * 60 * 60 * 1000).getUTCFullYear();
  return getDCCapacity(config, year);
}

export function getSohPercentForTime(timeMs: number, config: SiteSimulationConfig): number {
  const year = new Date(timeMs + 8 * 60 * 60 * 1000).getUTCFullYear();
  return Math.round(getSohForYear(config, year) * 10000) / 100;
}

export function getMaxGridPower(config: SiteSimulationConfig): number {
  return config.CONTRACT_LIMIT_KW * config.SAFETY_MARGIN;
}
