/**
 * Real-time Data Simulation
 *
 * Adds simulated BESS state to real API telemetry data — config-aware.
 */

import type { PersistedBESSState } from "@/types/bess-type";
import { TelemetryData } from "@/types/data-type";
import {
  type SiteSimulationConfig,
  getMaxSOC,
  getSohPercentForTime,
} from "./constants";
import { crossesMidnightTW } from "./time-utils";
import { createPersistedState } from "./state";
import {
  stepBESSSimulation,
  processIntervalCrossingMidnight,
} from "./step-simulation";

/**
 * 為真實 API 數據添加模擬 BESS 狀態（嚴格跨日持續性）
 *
 * @param realData 真實 API 數據（按時間排序）
 * @param config 案場配置
 * @param initialState 初始持久化狀態（如無則從 0 開始）
 * @returns 添加了模擬 BESS 的數據 + 最終狀態
 */
export function simulateBESSForRealData(
  realData: TelemetryData[],
  config: SiteSimulationConfig,
  initialState?: PersistedBESSState,
): { updatedData: TelemetryData[]; finalState: PersistedBESSState } {
  if (realData.length === 0) {
    const defaultState = createPersistedState(Date.now(), config, 0);
    return {
      updatedData: [],
      finalState: initialState || defaultState,
    };
  }

  const firstDataPoint = realData[0];
  if (!firstDataPoint) {
    const defaultState = createPersistedState(Date.now(), config, 0);
    return {
      updatedData: [],
      finalState: initialState || defaultState,
    };
  }

  let currentState: PersistedBESSState =
    initialState ||
    createPersistedState(
      new Date(firstDataPoint.createAt).getTime(),
      config,
      0,
    );

  const updatedData: TelemetryData[] = [];

  // 在第一個數據點之前填充（從今天 00:00 開始）
  const firstDataTimeMs = new Date(firstDataPoint.createAt).getTime();

  const twDate = new Date(firstDataTimeMs + 8 * 60 * 60 * 1000);
  const todayMidnightTW =
    Date.UTC(
      twDate.getUTCFullYear(),
      twDate.getUTCMonth(),
      twDate.getUTCDate(),
      0,
      0,
      0,
      0,
    ) -
    8 * 60 * 60 * 1000;

  if (firstDataTimeMs > todayMidnightTW + 60 * 60 * 1000) {
    const fillIntervalMs = 15 * 60 * 1000;
    let fillTimeMs = todayMidnightTW;

    while (fillTimeMs < firstDataTimeMs) {
      if (fillTimeMs < todayMidnightTW) {
        fillTimeMs = todayMidnightTW;
        continue;
      }

      const fillIntervalHours =
        (fillTimeMs - currentState.lastTimestamp) / (1000 * 60 * 60);
      const fillLoadKW = 0;

      if (crossesMidnightTW(currentState.lastTimestamp, fillTimeMs)) {
        const { finalState, steps } = processIntervalCrossingMidnight(
          currentState,
          currentState.lastTimestamp,
          fillTimeMs,
          fillLoadKW,
          config,
        );
        currentState = finalState;

        const lastStep = steps[steps.length - 1];
        if (lastStep) {
          updatedData.push({
            ...firstDataPoint,
            createAt: new Date(fillTimeMs).toISOString(),
            TotalUsage: 0,
            BESS: {
              SOC:
                Math.round(
                  (lastStep.battery.newSOCKWh / getMaxSOC(fillTimeMs, config)) *
                    100 *
                    100,
                ) / 100,
              SOH: getSohPercentForTime(fillTimeMs, config),
              Voltage: Math.round(lastStep.battery.voltage * 10) / 10,
              Power: Math.round(lastStep.battery.power),
            },
          });
        }
      } else {
        const result = stepBESSSimulation(
          currentState,
          new Date(fillTimeMs),
          fillLoadKW,
          fillIntervalHours,
          config,
        );
        currentState = result.newState;

        updatedData.push({
          ...firstDataPoint,
          createAt: new Date(fillTimeMs).toISOString(),
          TotalUsage: 0,
          BESS: {
            SOC:
              Math.round(
                (result.battery.newSOCKWh / getMaxSOC(fillTimeMs, config)) *
                  100 *
                  100,
              ) / 100,
            SOH: getSohPercentForTime(fillTimeMs, config),
            Voltage: Math.round(result.battery.voltage * 10) / 10,
            Power: Math.round(result.battery.power),
          },
        });
      }

      fillTimeMs += fillIntervalMs;
    }
  }

  for (let i = 0; i < realData.length; i++) {
    const dataPoint = realData[i];
    if (!dataPoint) continue;

    const currentTimeMs = new Date(dataPoint.createAt).getTime();
    const siteLoadKW = (dataPoint.TotalUsage || 0) / 1000;

    const startTimeMs = currentState.lastTimestamp;
    const gapHours = (currentTimeMs - startTimeMs) / (1000 * 60 * 60);

    if (gapHours > 1.0) {
      const fillIntervalMs = 15 * 60 * 1000;
      let fillTimeMs = startTimeMs + fillIntervalMs;

      while (fillTimeMs < currentTimeMs) {
        const fillIntervalHours =
          (fillTimeMs - currentState.lastTimestamp) / (1000 * 60 * 60);
        const fillLoadKW = 0;

        if (crossesMidnightTW(currentState.lastTimestamp, fillTimeMs)) {
          const { finalState, steps } = processIntervalCrossingMidnight(
            currentState,
            currentState.lastTimestamp,
            fillTimeMs,
            fillLoadKW,
            config,
          );
          currentState = finalState;

          const lastStep = steps[steps.length - 1];
          if (lastStep) {
            updatedData.push({
              ...dataPoint,
              createAt: new Date(fillTimeMs).toISOString(),
              TotalUsage: 0,
              BESS: {
                SOC:
                  Math.round(
                    (lastStep.battery.newSOCKWh /
                      getMaxSOC(fillTimeMs, config)) *
                      100 *
                      100,
                  ) / 100,
                SOH: getSohPercentForTime(fillTimeMs, config),
                Voltage: Math.round(lastStep.battery.voltage * 10) / 10,
                Power: Math.round(lastStep.battery.power),
              },
            });
          }
        } else {
          const result = stepBESSSimulation(
            currentState,
            new Date(fillTimeMs),
            fillLoadKW,
            fillIntervalHours,
            config,
          );
          currentState = result.newState;

          updatedData.push({
            ...dataPoint,
            createAt: new Date(fillTimeMs).toISOString(),
            TotalUsage: 0,
            BESS: {
              SOC:
                Math.round(
                  (result.battery.newSOCKWh / getMaxSOC(fillTimeMs, config)) *
                    100 *
                    100,
                ) / 100,
              SOH: getSohPercentForTime(fillTimeMs, config),
              Voltage: Math.round(result.battery.voltage * 10) / 10,
              Power: Math.round(result.battery.power),
            },
          });
        }

        fillTimeMs += fillIntervalMs;
      }
    }

    const intervalHours =
      (currentTimeMs - currentState.lastTimestamp) / (1000 * 60 * 60);

    if (crossesMidnightTW(currentState.lastTimestamp, currentTimeMs)) {
      const { finalState, steps } = processIntervalCrossingMidnight(
        currentState,
        currentState.lastTimestamp,
        currentTimeMs,
        siteLoadKW,
        config,
      );
      currentState = finalState;

      const lastStep = steps[steps.length - 1];
      if (lastStep) {
        updatedData.push({
          ...dataPoint,
          BESS: {
            SOC:
              Math.round(
                (lastStep.battery.newSOCKWh /
                  getMaxSOC(currentTimeMs, config)) *
                  100 *
                  100,
              ) / 100,
            SOH: getSohPercentForTime(currentTimeMs, config),
            Voltage: Math.round(lastStep.battery.voltage * 10) / 10,
            Power: Math.round(lastStep.battery.power),
          },
        });
      }
    } else {
      const result = stepBESSSimulation(
        currentState,
        new Date(currentTimeMs),
        siteLoadKW,
        intervalHours,
        config,
      );
      currentState = result.newState;

      updatedData.push({
        ...dataPoint,
        BESS: {
          SOC:
            Math.round(
              (result.battery.newSOCKWh / getMaxSOC(currentTimeMs, config)) *
                100 *
                100,
            ) / 100,
          SOH: getSohPercentForTime(currentTimeMs, config),
          Voltage: Math.round(result.battery.voltage * 10) / 10,
          Power: Math.round(result.battery.power),
        },
      });
    }
  }

  return {
    updatedData,
    finalState: currentState,
  };
}
