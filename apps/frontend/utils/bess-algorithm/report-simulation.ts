/**
 * Report BESS Simulation
 *
 * Simulates BESS for charging records (used by report pages).
 */

import type {
  PersistedBESSState,
  ChargingRecord,
  DailyBESSStats,
} from "@/types/bess-type";
import type { SiteSimulationConfig } from "./constants";
import {
  getTaiwanDateString,
  isPeakTimeTW,
  getNextMidnightTW,
} from "./time-utils";
import { createPersistedState } from "./state";
import { stepBESSSimulation } from "./step-simulation";

/**
 * 為充電記錄模擬 BESS（統一算法）
 *
 * 核心規則：
 * 1. 每日 00:00 開始充電，最大功率 100kW
 * 2. 充電時考慮契約容量限制（432kW - 當前負載）
 * 3. 平日尖峰時段放電（最大 100kW）
 * 4. 週末不放電，充滿後閒置
 * 5. 0-100% 全充全放
 *
 * @param records 充電記錄列表（需已排序）
 * @param startTimeMs 模擬開始時間（UTC ms）
 * @param endTimeMs 模擬結束時間（UTC ms）
 * @returns 每日統計數據和最終狀態
 */
export function simulateBESSForChargingRecords(
  records: ChargingRecord[],
  startTimeMs: number,
  endTimeMs: number,
  config: SiteSimulationConfig,
): {
  dailyStats: Map<string, DailyBESSStats>;
  finalState: PersistedBESSState;
} {
  if (isNaN(startTimeMs) || isNaN(endTimeMs)) {
    console.error("Invalid time range in simulateBESSForChargingRecords:", {
      startTimeMs,
      endTimeMs,
    });
    return {
      dailyStats: new Map(),
      finalState: createPersistedState(Date.now(), config, 0),
    };
  }

  if (endTimeMs < startTimeMs) {
    console.error("End time is before start time:", {
      startTimeMs: new Date(startTimeMs).toISOString(),
      endTimeMs: new Date(endTimeMs).toISOString(),
    });
    return {
      dailyStats: new Map(),
      finalState: createPersistedState(startTimeMs, config, 0),
    };
  }

  let state = createPersistedState(startTimeMs, config, 0);
  const dailyStats = new Map<string, DailyBESSStats>();

  const getDayStats = (dateKey: string): DailyBESSStats => {
    if (!dailyStats.has(dateKey)) {
      dailyStats.set(dateKey, {
        date: dateKey,
        chargedKWh: 0,
        dischargedKWh: 0,
        startSOC: state.socKWh,
        endSOC: state.socKWh,
        peakFromGrid: 0,
        offPeakFromGrid: 0,
      });
    }
    return dailyStats.get(dateKey)!;
  };

  const processInterval = (
    fromMs: number,
    toMs: number,
    loadKW: number,
  ): void => {
    if (isNaN(fromMs) || isNaN(toMs) || toMs <= fromMs) {
      if (isNaN(fromMs) || isNaN(toMs)) {
        console.error("Invalid time in processInterval:", {
          fromMs,
          toMs,
          loadKW,
        });
      }
      return;
    }

    const fromDate = getTaiwanDateString(new Date(fromMs));
    const toDate = getTaiwanDateString(new Date(toMs));

    const startSOC = state.socKWh;

    if (fromDate !== toDate) {
      const midnightMs = getNextMidnightTW(fromMs);

      if (midnightMs <= fromMs) {
        console.error("Invalid midnight calculation:", {
          fromMs: new Date(fromMs).toISOString(),
          midnightMs: new Date(midnightMs).toISOString(),
          fromDate,
          toDate,
        });
        return;
      }

      if (midnightMs >= toMs) {
        console.warn("Midnight outside interval, treating as single day:", {
          fromMs: new Date(fromMs).toISOString(),
          toMs: new Date(toMs).toISOString(),
          midnightMs: new Date(midnightMs).toISOString(),
        });
      } else {
        processInterval(fromMs, midnightMs, loadKW);
        processInterval(midnightMs, toMs, loadKW);
        return;
      }
    }

    const intervalHours = (toMs - fromMs) / (1000 * 60 * 60);
    const result = stepBESSSimulation(
      state,
      new Date(toMs),
      loadKW,
      intervalHours,
      config,
    );

    const dayStats = getDayStats(fromDate);
    const deltaSOC = result.newState.socKWh - startSOC;

    if (deltaSOC > 0) {
      dayStats.chargedKWh += deltaSOC;
    } else if (deltaSOC < 0) {
      dayStats.dischargedKWh += Math.abs(deltaSOC);
    }

    const isPeak = isPeakTimeTW(new Date(fromMs), config);
    const gridEnergyKWh = result.gridImportKW * intervalHours;

    if (isPeak) {
      dayStats.peakFromGrid += gridEnergyKWh;
    } else {
      dayStats.offPeakFromGrid += gridEnergyKWh;
    }

    dayStats.endSOC = result.newState.socKWh;
    state = result.newState;
  };

  let lastProcessedTime = startTimeMs;

  for (const record of records) {
    const recStartMs = record.startTime.getTime();
    const recEndMs = record.endTime.getTime();

    if (isNaN(recStartMs) || isNaN(recEndMs)) {
      console.warn("Invalid record time:", {
        startTime: record.startTime,
        endTime: record.endTime,
      });
      continue;
    }

    if (recEndMs < startTimeMs || recStartMs > endTimeMs) continue;

    if (recEndMs <= recStartMs) {
      console.warn("Invalid record duration:", {
        startTime: new Date(recStartMs).toISOString(),
        endTime: new Date(recEndMs).toISOString(),
      });
      continue;
    }

    const effectiveStartMs = Math.max(recStartMs, startTimeMs);
    const effectiveEndMs = Math.min(recEndMs, endTimeMs);

    if (effectiveStartMs >= effectiveEndMs) {
      continue;
    }

    if (effectiveStartMs > lastProcessedTime) {
      processInterval(lastProcessedTime, effectiveStartMs, 0);
    }

    const actualStartMs = Math.max(effectiveStartMs, lastProcessedTime);
    if (actualStartMs >= effectiveEndMs) {
      continue;
    }

    const effectiveDuration =
      (effectiveEndMs - actualStartMs) / (1000 * 60 * 60);
    const originalDuration = (recEndMs - recStartMs) / (1000 * 60 * 60);
    const loadKW = record.powerKWh / originalDuration;

    if (isNaN(loadKW) || loadKW < 0 || effectiveDuration <= 0) {
      console.warn("Invalid load power or duration:", {
        powerKWh: record.powerKWh,
        originalDuration,
        effectiveDuration,
        loadKW,
      });
      continue;
    }

    processInterval(actualStartMs, effectiveEndMs, loadKW);

    lastProcessedTime = effectiveEndMs;
  }

  if (lastProcessedTime < endTimeMs) {
    processInterval(lastProcessedTime, endTimeMs, 0);
  }

  return {
    dailyStats,
    finalState: state,
  };
}
