export type SystemStatus = "NORMAL" | "WARNING" | "FAULT" | "OFFLINE";
export type PCSStatus = "RUNNING" | "STANDBY" | "CHARGING" | "DISCHARGING" | "FAULT" | "OFFLINE";
export type BMSStatus = "NORMAL" | "WARNING" | "FAULT" | "OFFLINE";
export type OperationMode = "AUTO" | "MANUAL" | "EMERGENCY_STOP";
export type ControlOperation =
  | "STARTUP"
  | "SHUTDOWN"
  | "EMERGENCY_STOP"
  | "CLEAR_ERRORS"
  | "SET_MANUAL"
  | "SET_AUTO"
  | "FAULT_ISOLATE";

export interface BESSMetrics {
  soc: number;
  soh: number;
  capacityKWh: number;
  powerKW: number;
  voltageV: number;
  executionRate: number;
}

export interface SensorReadings {
  batteryRacks: { id: string; tempC: number }[];
  pcsCabinetTempC: number;
  bmsModuleTempC: number;
  ambientTempC: number;
  humidity: number;
}

export interface ErrorCode {
  id: string;
  code: string;
  description: string;
  severity: "INFO" | "WARNING" | "FAULT";
  timestamp: Date;
}

export interface OperationLog {
  operation: ControlOperation;
  timestamp: Date;
  result: "SUCCESS" | "FAILURE";
  message: string;
}

export interface ControllerSiteState {
  systemStatus: SystemStatus;
  pcsStatus: PCSStatus;
  bmsStatus: BMSStatus;
  operationMode: OperationMode;
  bessMetrics: BESSMetrics;
  sensors: SensorReadings;
  errorCodes: ErrorCode[];
  lastOperation: OperationLog | null;
}
