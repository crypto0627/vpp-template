/**
 * BESS (Battery Energy Storage System) Type Definitions
 *
 * Type definitions for battery energy storage system state management,
 * simulation, and statistical analysis.
 */

/**
 * 持久化 BESS 狀態（跨日保持）
 * 這是系統的核心狀態，必須持久化到存儲
 */
export interface PersistedBESSState {
  /** SOC in kWh (0-370) */
  socKWh: number;
  /** 最後更新時間 (ms UTC) */
  lastTimestamp: number;
  /** 最後充電會話的日期（台灣時間 "YYYY-MM-DD"） */
  lastChargeSessionDateTW: string;
  /** 當前充電會話是否活躍（充滿後變 false） */
  chargeSessionActive: boolean;
}

/**
 * BESS 狀態（用於時間序列模擬，向後兼容）
 */
export interface BESSState {
  soc: number; // 當前 SOC (kWh)
  timestamp: number; // 上次更新時間 (ms)
}

/**
 * 時間段電量統計
 */
export interface EnergyStats {
  peakFromGrid: number; // 尖峰從電網取電 (kWh)
  offPeakFromGrid: number; // 離峰從電網取電 (kWh)
  chargedEnergy: number; // 充電用電 (kWh)
  dischargedEnergy: number; // 放電供給 (kWh)
}

/**
 * 電池行為計算結果
 */
export interface BatteryBehavior {
  current: number; // A (positive=charging, negative=discharging)
  voltage: number; // V
  newSOCKWh: number; // kWh (0-370)
  power: number; // W (positive=charging, negative=discharging)
}

/**
 * 單步模擬結果
 */
export interface StepSimulationResult {
  /** 更新後的狀態 */
  newState: PersistedBESSState;
  /** 電池行為 */
  battery: BatteryBehavior;
  /** 電網取電功率 (kW) */
  gridImportKW: number;
}

/**
 * 充電記錄
 */
export interface ChargingRecord {
  startTime: Date;
  endTime: Date;
  powerKWh: number;
}

/**
 * 每日 BESS 統計數據
 */
export interface DailyBESSStats {
  date: string; // YYYY-MM-DD (Taiwan Time)
  chargedKWh: number; // 當日充電總量（儲能實際增加的電量）
  dischargedKWh: number; // 當日放電總量（儲能實際減少的電量）
  startSOC: number; // 當日開始 SOC (kWh)
  endSOC: number; // 當日結束 SOC (kWh)
  peakFromGrid: number; // 尖峰從電網取電 (kWh)
  offPeakFromGrid: number; // 離峰從電網取電 (kWh)
}
