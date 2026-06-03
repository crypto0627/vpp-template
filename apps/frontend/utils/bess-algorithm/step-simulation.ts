/**
 * Core Step Simulation Engine
 *
 * Single-step BESS simulation and midnight crossing handler —
 * every function takes an explicit SiteSimulationConfig so the
 * same engine can drive neihu, huacheng, etai, etc.
 */

import type {
  PersistedBESSState,
  BatteryBehavior,
  StepSimulationResult,
} from "@/types/bess-type";
import { type SiteSimulationConfig, getMaxSOC } from "./constants";
import { isDRSeasonDate } from "@/config/site-configs";
import {
  isPeakTimeTW,
  getTaiwanDateString,
  getTaiwanTime,
  shouldDisableBESS,
  isWeekendOrHoliday,
  crossesMidnightTW,
  getNextMidnightTW,
} from "./time-utils";
import { calculateVoltage } from "./state";

/**
 * 單步 BESS 模擬（嚴格跨日持續性）
 *
 * 這是系統的核心函數，實現嚴格的業務規則：
 * 1. SOC 基於前一狀態計算，永不猜測
 * 2. 充電僅在 00:00 TW 啟動
 * 3. 充滿後 chargeSessionActive = false
 * 4. 尖峰放電跟隨負載
 * 5. 契約容量限制
 *
 * @param state 持久化狀態
 * @param currentTime 當前時間點（UTC）
 * @param siteLoadKW 站場負載（kW）
 * @param intervalHours 時間間隔（小時）
 * @param config 案場配置
 * @returns 新狀態、電池行為、電網取電
 */
export function stepBESSSimulation(
  state: PersistedBESSState,
  currentTime: Date,
  siteLoadKW: number,
  intervalHours: number,
  config: SiteSimulationConfig,
): StepSimulationResult {
  const currentTimeMs = currentTime.getTime();
  const maxSOC = getMaxSOC(currentTimeMs, config);
  const pcsMaxPower = config.PCS_CAPACITY_KW;
  const chargeEfficiency = config.CHARGE_EFFICIENCY;
  const dischargeEfficiency = config.DISCHARGE_EFFICIENCY;

  // 確保參數有效
  if (intervalHours <= 0 || siteLoadKW < 0) {
    const voltage = calculateVoltage(state.socKWh, config);
    return {
      newState: { ...state, lastTimestamp: currentTime.getTime() },
      battery: {
        current: 0,
        voltage,
        newSOCKWh: state.socKWh,
        power: 0,
      },
      gridImportKW: siteLoadKW,
    };
  }

  // 國定假日：儲能系統完全停用，所有負載由電網供應
  // SOC 保持不變（不充電、不放電），使用離峰電價計算成本
  if (shouldDisableBESS(currentTime)) {
    const voltage = calculateVoltage(state.socKWh, config);
    return {
      newState: {
        ...state,
        lastTimestamp: currentTimeMs,
      },
      battery: {
        current: 0,
        voltage,
        newSOCKWh: state.socKWh,
        power: 0,
      },
      gridImportKW: siteLoadKW,
    };
  }

  // 使用區間開始時間來判斷尖離峰和充電會話啟動
  const intervalStartTime = new Date(state.lastTimestamp);
  const isPeak = isPeakTimeTW(intervalStartTime, config);
  const intervalStartDateTW = getTaiwanDateString(intervalStartTime);
  const startHour = getTaiwanTime(intervalStartTime).hour;

  // 檢查充電會話啟動條件
  const isIntervalStartsAtMidnight =
    startHour === 0 && intervalStartDateTW !== state.lastChargeSessionDateTW;
  const isWorkingDay = !isWeekendOrHoliday(intervalStartTime);
  const shouldStartChargeSession =
    isIntervalStartsAtMidnight &&
    isWorkingDay &&
    !state.chargeSessionActive &&
    state.socKWh < maxSOC;

  let updatedState = state;
  if (shouldStartChargeSession) {
    updatedState = {
      ...updatedState,
      chargeSessionActive: true,
      lastChargeSessionDateTW: intervalStartDateTW,
    };
  }

  const voltage = calculateVoltage(updatedState.socKWh, config);

  // === 尖峰時段：放電（同時終止充電會話，避免尖峰後繼續充電）===
  if (isPeak) {
    updatedState = { ...updatedState, chargeSessionActive: false };

    if (updatedState.socKWh <= 0) {
      return {
        newState: {
          ...updatedState,
          socKWh: 0,
          lastTimestamp: currentTimeMs,
        },
        battery: {
          current: 0,
          voltage: calculateVoltage(0, config),
          newSOCKWh: 0,
          power: 0,
        },
        gridImportKW: siteLoadKW,
      };
    }

    const targetDischargeKW = Math.min(siteLoadKW, pcsMaxPower);
    const targetEnergyKWh = targetDischargeKW * intervalHours;

    const energyNeededFromBattery = targetEnergyKWh / dischargeEfficiency;
    const canDischarge = Math.min(energyNeededFromBattery, updatedState.socKWh);
    const actualDischargeToLoad = canDischarge * dischargeEfficiency;

    const newSOCKWh = Math.max(0, updatedState.socKWh - canDischarge);
    const dischargePowerKW = canDischarge / intervalHours;
    const dischargePowerW = dischargePowerKW * 1000;
    const current = -(dischargePowerW / voltage);
    const effectiveDischargePowerW =
      (actualDischargeToLoad / intervalHours) * 1000;

    const loadEnergyKWh = siteLoadKW * intervalHours;
    const gridSupplyKWh = Math.max(0, loadEnergyKWh - actualDischargeToLoad);
    const gridImportKW = gridSupplyKWh / intervalHours;

    return {
      newState: {
        ...updatedState,
        socKWh: newSOCKWh,
        lastTimestamp: currentTimeMs,
      },
      battery: {
        current,
        voltage,
        newSOCKWh,
        power: -effectiveDischargePowerW,
      },
      gridImportKW,
    };
  }

  // === 離峰時段：充電（僅當會話活躍） ===
  // DR 夜間充電：22:00~24:00 DR期間工作日，即使充電會話已結束也充電
  const twTime = getTaiwanTime(intervalStartTime);
  const isDRNightCharge =
    !updatedState.chargeSessionActive &&
    config.DR?.ENABLED &&
    twTime.hour >= 22 &&
    isWorkingDay &&
    updatedState.socKWh < maxSOC &&
    isDRSeasonDate(
      new Date(intervalStartTime.getTime() + 8 * 60 * 60 * 1000).getUTCMonth() + 1,
      new Date(intervalStartTime.getTime() + 8 * 60 * 60 * 1000).getUTCDate(),
      config,
    );

  if (isDRNightCharge) {
    // DR 夜間充電使用指定功率
    const drChargeKW = Math.min(config.DR!.NIGHT_CHARGE_KW, pcsMaxPower);
    const chargeCapKW = config.CONTRACT_LIMIT_KW * 0.9;
    const availableDRCharge = Math.min(
      drChargeKW,
      Math.max(0, chargeCapKW - siteLoadKW),
    );
    const canChargeKWh = Math.min(
      availableDRCharge * intervalHours,
      maxSOC - updatedState.socKWh,
    );
    const gridChargeKWh = canChargeKWh / chargeEfficiency;
    const gridChargePowerKW = gridChargeKWh / intervalHours;
    const newSOCKWh = Math.min(maxSOC, updatedState.socKWh + canChargeKWh);
    const chargePowerKW = canChargeKWh / intervalHours;
    const chargePowerW = chargePowerKW * 1000;
    const current = chargePowerW / voltage;

    return {
      newState: {
        ...updatedState,
        socKWh: newSOCKWh,
        lastTimestamp: currentTimeMs,
      },
      battery: { current, voltage, newSOCKWh, power: chargePowerW },
      gridImportKW: siteLoadKW + gridChargePowerKW,
    };
  }

  if (!updatedState.chargeSessionActive || updatedState.socKWh >= maxSOC) {
    if (updatedState.socKWh >= maxSOC) {
      updatedState = {
        ...updatedState,
        chargeSessionActive: false,
      };
    }

    return {
      newState: {
        ...updatedState,
        lastTimestamp: currentTimeMs,
      },
      battery: {
        current: 0,
        voltage: calculateVoltage(updatedState.socKWh, config),
        newSOCKWh: updatedState.socKWh,
        power: 0,
      },
      gridImportKW: siteLoadKW,
    };
  }

  // 充電會話活躍且 SOC < maxSOC：充電
  // 用電負載＋充電不能超過契約容量的 90%
  const chargeCapKW = config.CONTRACT_LIMIT_KW * 0.9;
  const availableChargePowerKW = Math.min(
    pcsMaxPower,
    Math.max(0, chargeCapKW - siteLoadKW),
  );

  const canChargeKWh = Math.min(
    availableChargePowerKW * intervalHours,
    maxSOC - updatedState.socKWh,
  );

  const gridChargeKWh = canChargeKWh / chargeEfficiency;
  const gridChargePowerKW = gridChargeKWh / intervalHours;

  const actualGridImportKW = siteLoadKW + gridChargePowerKW;

  const newSOCKWh = Math.min(maxSOC, updatedState.socKWh + canChargeKWh);
  const chargePowerKW = canChargeKWh / intervalHours;
  const chargePowerW = chargePowerKW * 1000;
  const current = chargePowerW / voltage;

  const sessionActive = newSOCKWh < maxSOC;

  return {
    newState: {
      ...updatedState,
      socKWh: newSOCKWh,
      lastTimestamp: currentTimeMs,
      chargeSessionActive: sessionActive,
    },
    battery: {
      current,
      voltage,
      newSOCKWh,
      power: chargePowerW,
    },
    gridImportKW: actualGridImportKW,
  };
}

/**
 * 處理跨午夜的時間間隔（分割成兩段）
 */
export function processIntervalCrossingMidnight(
  state: PersistedBESSState,
  startTimeMs: number,
  endTimeMs: number,
  siteLoadKW: number,
  config: SiteSimulationConfig,
): {
  finalState: PersistedBESSState;
  steps: Array<{ time: Date; battery: BatteryBehavior; gridImportKW: number }>;
} {
  const steps: Array<{
    time: Date;
    battery: BatteryBehavior;
    gridImportKW: number;
  }> = [];

  if (!crossesMidnightTW(startTimeMs, endTimeMs)) {
    const intervalHours = (endTimeMs - startTimeMs) / (1000 * 60 * 60);
    const result = stepBESSSimulation(
      state,
      new Date(endTimeMs),
      siteLoadKW,
      intervalHours,
      config,
    );
    steps.push({
      time: new Date(endTimeMs),
      battery: result.battery,
      gridImportKW: result.gridImportKW,
    });
    return { finalState: result.newState, steps };
  }

  const midnightMs = getNextMidnightTW(startTimeMs);

  const interval1Hours = (midnightMs - startTimeMs) / (1000 * 60 * 60);
  const result1 = stepBESSSimulation(
    state,
    new Date(midnightMs),
    siteLoadKW,
    interval1Hours,
    config,
  );
  steps.push({
    time: new Date(midnightMs),
    battery: result1.battery,
    gridImportKW: result1.gridImportKW,
  });

  const interval2Hours = (endTimeMs - midnightMs) / (1000 * 60 * 60);
  const result2 = stepBESSSimulation(
    result1.newState,
    new Date(endTimeMs),
    siteLoadKW,
    interval2Hours,
    config,
  );
  steps.push({
    time: new Date(endTimeMs),
    battery: result2.battery,
    gridImportKW: result2.gridImportKW,
  });

  return { finalState: result2.newState, steps };
}
