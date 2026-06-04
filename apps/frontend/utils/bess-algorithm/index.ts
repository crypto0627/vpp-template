/**
 * BESS Algorithm - Public API
 */

export type {
  PersistedBESSState,
  BESSState,
  EnergyStats,
  BatteryBehavior,
  StepSimulationResult,
  ChargingRecord,
  DailyBESSStats,
} from "@/types/bess-type";

export {
  type SiteSimulationConfig,
  getMaxSOC,
  getSohPercentForTime,
  getMaxGridPower,
} from "./constants";

export {
  getTaiwanDateString,
  getTaiwanTime,
  isPeakTimeTW,
  isSemiPeakTimeTW,
  crossesMidnightTW,
  shouldDisableBESS,
  isWeekendOrHoliday,
  getNextMidnightTW,
} from "./time-utils";

export { getElectricityRate, getCurrentRate } from "./electricity-rate";

export { createPersistedState, calculateVoltage } from "./state";

export {
  stepBESSSimulation,
  processIntervalCrossingMidnight,
} from "./step-simulation";

export { simulateBESSForRealData } from "./realtime-simulation";

export { calculateElectricityCost } from "./cost-calculation";

export { simulateBESSForChargingRecords } from "./report-simulation";

export {
  createInitialBESSState,
  simulateIdleCharging,
  processLoadEvent,
  mergeEnergyStats,
} from "./legacy";
