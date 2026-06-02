/**
 * Mock BESS Simulation Utilities (Template Version)
 *
 * This is a simplified mock implementation for the template.
 * Replace with your real BESS simulation logic when integrating live data.
 *
 * Simulated strategy:
 *  - 00:00–05:00  Off-peak: charge at full PCS power until full
 *  - 16:00–21:00  Peak:     discharge at full PCS power (capped to load)
 *  - All other times: idle
 */
import type { PersistedBESSState } from "@/types/bess-type";
import type { SiteSimulationConfig } from "@/config/site-configs";

// Re-export PersistedBESSState for backward compatibility
export type { PersistedBESSState };

/** Create an initial persisted BESS state */
export function createPersistedState(
  timestamp: number,
  config: SiteSimulationConfig,
  initialSOCKWh: number = 0,
): PersistedBESSState {
  const d = new Date(timestamp + 8 * 3600 * 1000); // Taiwan time
  const dateStr = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
  return {
    socKWh: Math.min(initialSOCKWh, config.BESS_CAPACITY_KWH),
    lastTimestamp: timestamp,
    lastChargeSessionDateTW: dateStr,
    chargeSessionActive: false,
  };
}

/**
 * Process one time interval — returns updated BESS state and battery power.
 * This mock applies a simple charge-at-night / discharge-at-peak strategy.
 */
export function processIntervalCrossingMidnight(
  state: PersistedBESSState,
  startMs: number,
  endMs: number,
  loadKW: number,
  config: SiteSimulationConfig,
): {
  finalState: PersistedBESSState;
  steps: Array<{
    battery: { power: number; current: number; voltage: number; newSOCKWh: number };
    gridImportKW: number;
  }>;
} {
  const hour = new Date(startMs).getHours();
  const durationH = (endMs - startMs) / 3_600_000;
  const nominalV = 750; // V (fallback)
  const capacity = config.BESS_CAPACITY_KWH;
  const pcs = config.PCS_CAPACITY_KW;

  let batteryPowerW = 0;
  let newSOCKWh = state.socKWh;

  if (hour >= 0 && hour < 5 && newSOCKWh < capacity) {
    // Off-peak charging
    const chargePowerKW = Math.min(pcs, (capacity - newSOCKWh) / Math.max(durationH, 0.001));
    batteryPowerW = chargePowerKW * 1000;
    newSOCKWh = Math.min(capacity, newSOCKWh + chargePowerKW * durationH);
  } else if (hour >= 16 && hour < 21 && newSOCKWh > 0) {
    // Peak discharging
    const dischargePowerKW = Math.min(pcs, loadKW, newSOCKWh / Math.max(durationH, 0.001));
    batteryPowerW = -dischargePowerKW * 1000;
    newSOCKWh = Math.max(0, newSOCKWh - dischargePowerKW * durationH);
  }

  const finalState: PersistedBESSState = {
    ...state,
    socKWh: newSOCKWh,
    lastTimestamp: endMs,
    chargeSessionActive: batteryPowerW > 0,
  };

  return {
    finalState,
    steps: [
      {
        battery: {
          power: batteryPowerW,
          current: batteryPowerW / nominalV,
          voltage: nominalV,
          newSOCKWh,
        },
        gridImportKW: Math.max(0, loadKW - (batteryPowerW < 0 ? Math.abs(batteryPowerW) / 1000 : 0)) + (batteryPowerW > 0 ? batteryPowerW / 1000 : 0),
      },
    ],
  };
}

/** Mock electricity cost calculation — replace with real logic */
export function calculateElectricityCost(
  _data: unknown[],
  config: SiteSimulationConfig,
) {
  const peakUsageKWh = 248.5;
  const offPeakUsageKWh = 1000;
  const peakDischargeKWh = 320.5;
  const offPeakChargeKWh = 370;
  const costWithoutBESS = Math.round(
    peakUsageKWh * config.SUMMER_PEAK_RATE + offPeakUsageKWh * config.SUMMER_OFFPEAK_RATE,
  );
  const costWithBESS = Math.round(costWithoutBESS * 0.834);
  return {
    totalCost: costWithBESS,
    costWithBESS,
    costWithoutBESS,
    savings: costWithoutBESS - costWithBESS,
    peakUsageKWh,
    offPeakUsageKWh,
    peakDischargeKWh,
    offPeakChargeKWh,
  };
}

/** Return the effective max SOC capacity for a given timestamp */
export function getMaxSOC(_timestamp: number, config: SiteSimulationConfig): number {
  return config.BESS_CAPACITY_KWH;
}
