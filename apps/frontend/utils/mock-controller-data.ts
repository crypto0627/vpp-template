import type { ControllerSiteState, SensorReadings } from "@/types/controller-types";
import type { SiteId } from "@/types/data-type";

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function vary(value: number, delta: number): number {
  return value + (Math.random() * 2 - 1) * delta;
}

export function createMockNeihuState(): ControllerSiteState {
  return {
    systemStatus: "WARNING",
    pcsStatus: "RUNNING",
    bmsStatus: "NORMAL",
    operationMode: "AUTO",
    bessMetrics: {
      soc: 65,
      soh: 92,
      capacityKWh: 240.5,
      powerKW: -150,
      voltageV: 748.2,
      executionRate: 98,
    },
    sensors: {
      batteryRacks: [
        { id: "Rack-1", tempC: 28.4 },
        { id: "Rack-2", tempC: 38.2 },
        { id: "Rack-3", tempC: 27.9 },
        { id: "Rack-4", tempC: 29.1 },
      ],
      pcsCabinetTempC: 32.5,
      bmsModuleTempC: 31.0,
      ambientTempC: 25.3,
      humidity: 58,
    },
    errorCodes: [
      {
        id: "neihu-err-001",
        code: "BMS-W002",
        description: "電池架 2 溫度偏高（38.2°C），建議檢查散熱",
        severity: "WARNING",
        timestamp: new Date(Date.now() - 12 * 60 * 1000),
      },
    ],
    lastOperation: null,
  };
}

export function createMockEtaiState(): ControllerSiteState {
  return {
    systemStatus: "FAULT",
    pcsStatus: "FAULT",
    bmsStatus: "WARNING",
    operationMode: "MANUAL",
    bessMetrics: {
      soc: 45,
      soh: 88,
      capacityKWh: 4_400,
      powerKW: 0,
      voltageV: 1_024.0,
      executionRate: 72,
    },
    sensors: {
      batteryRacks: [
        { id: "Rack-01", tempC: 29.1 },
        { id: "Rack-02", tempC: 30.5 },
        { id: "Rack-03", tempC: 31.2 },
        { id: "Rack-04", tempC: 28.8 },
        { id: "Rack-05", tempC: 29.6 },
        { id: "Rack-06", tempC: 30.0 },
        { id: "Rack-07", tempC: 27.4 },
        { id: "Rack-08", tempC: 28.2 },
      ],
      pcsCabinetTempC: 47.8,
      bmsModuleTempC: 35.2,
      ambientTempC: 27.1,
      humidity: 62,
    },
    errorCodes: [
      {
        id: "etai-err-001",
        code: "PCS-F001",
        description: "PCS 過溫故障，機箱溫度超過上限（47.8°C）",
        severity: "FAULT",
        timestamp: new Date(Date.now() - 3 * 60 * 1000),
      },
      {
        id: "etai-err-002",
        code: "BMS-W007",
        description: "BMS 通訊超時，已重試 3 次仍未恢復",
        severity: "WARNING",
        timestamp: new Date(Date.now() - 18 * 60 * 1000),
      },
      {
        id: "etai-err-003",
        code: "DC-W003",
        description: "DC Bus 電壓偏高（1,024V），超出正常範圍上限 5%",
        severity: "WARNING",
        timestamp: new Date(Date.now() - 35 * 60 * 1000),
      },
    ],
    lastOperation: null,
  };
}

export function createInitialControllerState(): Record<SiteId, ControllerSiteState> {
  return {
    neihu: createMockNeihuState(),
    etai: createMockEtaiState(),
  };
}

function varySensors(sensors: SensorReadings): SensorReadings {
  return {
    ...sensors,
    batteryRacks: sensors.batteryRacks.map((r) => ({
      ...r,
      tempC: Math.round(clamp(vary(r.tempC, 1), 15, 60) * 10) / 10,
    })),
    pcsCabinetTempC: Math.round(clamp(vary(sensors.pcsCabinetTempC, 1), 20, 70) * 10) / 10,
    bmsModuleTempC: Math.round(clamp(vary(sensors.bmsModuleTempC, 1), 20, 60) * 10) / 10,
    ambientTempC: Math.round(clamp(vary(sensors.ambientTempC, 0.5), 10, 45) * 10) / 10,
    humidity: Math.round(clamp(vary(sensors.humidity, 0.5), 20, 95) * 10) / 10,
  };
}

export function applyRandomVariation(state: ControllerSiteState): ControllerSiteState {
  const newSoc = clamp(vary(state.bessMetrics.soc, 0.5), 0, 100);
  const newCapacity =
    (newSoc / 100) *
    (state.bessMetrics.soh / 100) *
    (state.bessMetrics.capacityKWh / (state.bessMetrics.soc / 100));

  return {
    ...state,
    bessMetrics: {
      ...state.bessMetrics,
      soc: Math.round(newSoc * 10) / 10,
      capacityKWh: Math.round(newCapacity * 10) / 10,
      powerKW:
        state.bessMetrics.powerKW !== 0
          ? Math.round(vary(state.bessMetrics.powerKW, 5) * 10) / 10
          : 0,
      voltageV: Math.round(clamp(vary(state.bessMetrics.voltageV, 2), 600, 1200) * 10) / 10,
    },
    sensors: varySensors(state.sensors),
  };
}
