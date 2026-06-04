/**
 * Legacy / Backward-Compatible Functions
 *
 * These wrappers maintain backward compatibility for older code paths.
 * All are config-aware.
 */

import type { BESSState, EnergyStats } from "@/types/bess-type";
import {
  type SiteSimulationConfig,
  getMaxSOC,
  getMaxGridPower,
} from "./constants";

/**
 * 創建初始儲能狀態（向後兼容，Report 頁面用）
 */
export function createInitialBESSState(startTime: number): BESSState {
  return {
    soc: 0,
    timestamp: startTime,
  };
}

/**
 * 模擬空閒時段充電（向後兼容，Report 頁面用）
 */
export function simulateIdleCharging(
  state: BESSState,
  fromTime: number,
  toTime: number,
  config: SiteSimulationConfig,
): number {
  const maxSOC = getMaxSOC(fromTime, config);
  if (toTime <= fromTime || state.soc >= maxSOC) {
    return 0;
  }

  const durationHours = (toTime - fromTime) / (1000 * 60 * 60);
  const availableChargePower = Math.min(
    config.PCS_CAPACITY_KW,
    getMaxGridPower(config),
  );
  const canChargeKWh = Math.min(
    availableChargePower * durationHours,
    maxSOC - state.soc,
  );

  const gridChargeKWh = canChargeKWh / config.CHARGE_EFFICIENCY ;
  state.soc += canChargeKWh;
  state.timestamp = toTime;

  return gridChargeKWh;
}

/**
 * 處理單次用電事件（向後兼容，Report 頁面用）
 */
export function processLoadEvent(
  state: BESSState,
  loadKWh: number,
  startTime: number,
  endTime: number,
  isPeak: boolean,
  config: SiteSimulationConfig,
): EnergyStats {
  const stats: EnergyStats = {
    peakFromGrid: 0,
    offPeakFromGrid: 0,
    chargedEnergy: 0,
    dischargedEnergy: 0,
  };

  const durationHours = (endTime - startTime) / (1000 * 60 * 60);
  const loadPowerKW = loadKWh / durationHours;

  if (isPeak && state.soc > 0) {
    const canDischarge = Math.min(
      state.soc,
      loadKWh / config.DISCHARGE_EFFICIENCY ,
    );
    const dischargedToLoad = canDischarge * config.DISCHARGE_EFFICIENCY ;
    state.soc -= canDischarge;

    const gridSupply = Math.max(0, loadKWh - dischargedToLoad);
    stats.peakFromGrid = gridSupply;
    stats.dischargedEnergy = dischargedToLoad;
  } else if (!isPeak && state.soc < getMaxSOC(startTime, config)) {
    const availableChargePower = Math.min(
      config.PCS_CAPACITY_KW,
      getMaxGridPower(config) - loadPowerKW,
    );

    if (availableChargePower > 0) {
      const canChargeKWh = Math.min(
        availableChargePower * durationHours,
        getMaxSOC(startTime, config) - state.soc,
      );
      const gridChargeKWh = canChargeKWh / config.CHARGE_EFFICIENCY ;
      state.soc += canChargeKWh;

      stats.chargedEnergy = gridChargeKWh;
      stats.offPeakFromGrid = loadKWh + gridChargeKWh;
    } else {
      stats.offPeakFromGrid = loadKWh;
    }
  } else {
    if (isPeak) {
      stats.peakFromGrid = loadKWh;
    } else {
      stats.offPeakFromGrid = loadKWh;
    }
  }

  state.timestamp = endTime;
  return stats;
}

/**
 * 合併電量統計
 */
export function mergeEnergyStats(a: EnergyStats, b: EnergyStats): EnergyStats {
  return {
    peakFromGrid: a.peakFromGrid + b.peakFromGrid,
    offPeakFromGrid: a.offPeakFromGrid + b.offPeakFromGrid,
    chargedEnergy: a.chargedEnergy + b.chargedEnergy,
    dischargedEnergy: a.dischargedEnergy + b.dischargedEnergy,
  };
}
