export interface PersistedBESSState {
  socKWh: number;
  lastTimestamp: number;
  lastChargeSessionDateTW: string;
  chargeSessionActive: boolean;
}

export interface BESSState {
  soc: number;
  timestamp: number;
}

export interface EnergyStats {
  peakFromGrid: number;
  offPeakFromGrid: number;
  chargedEnergy: number;
  dischargedEnergy: number;
}

export interface BatteryBehavior {
  current: number;
  voltage: number;
  newSOCKWh: number;
  power: number;
}

export interface StepSimulationResult {
  newState: PersistedBESSState;
  battery: BatteryBehavior;
  gridImportKW: number;
}

export interface ChargingRecord {
  startTime: Date;
  endTime: Date;
  powerKWh: number;
}

export interface DailyBESSStats {
  date: string;
  chargedKWh: number;
  dischargedKWh: number;
  startSOC: number;
  endSOC: number;
  peakFromGrid: number;
  offPeakFromGrid: number;
}
