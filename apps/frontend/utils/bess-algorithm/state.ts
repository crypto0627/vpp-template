/**
 * BESS State Management
 */

import type { PersistedBESSState } from "@/types/bess-type";
import { type SiteSimulationConfig, getMaxSOC } from "./constants";
import { getTaiwanDateString } from "./time-utils";

export function createPersistedState(
  startTimeMs: number,
  config: SiteSimulationConfig,
  initialSOC: number = 0,
): PersistedBESSState {
  if (isNaN(startTimeMs)) startTimeMs = Date.now();

  const startDateObj = new Date(startTimeMs + 8 * 60 * 60 * 1000);
  const yesterdayObj = new Date(startDateObj);
  yesterdayObj.setUTCDate(yesterdayObj.getUTCDate() - 1);
  const yesterdayTW = getTaiwanDateString(
    new Date(yesterdayObj.getTime() - 8 * 60 * 60 * 1000),
  );

  return {
    socKWh: Math.max(0, Math.min(getMaxSOC(startTimeMs, config), initialSOC)),
    lastTimestamp: startTimeMs,
    lastChargeSessionDateTW: yesterdayTW,
    chargeSessionActive: false,
  };
}

export function calculateVoltage(socKWh: number, config: SiteSimulationConfig): number {
  const socPercent = (socKWh / config.BESS_CAPACITY_KWH) * 100;
  return (
    config.MIN_VOLTAGE +
    (socPercent / 100) * (config.MAX_VOLTAGE - config.MIN_VOLTAGE)
  );
}
