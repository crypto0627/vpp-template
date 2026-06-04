/**
 * Electricity Cost Calculation
 *
 * Computes costs with/without BESS and savings — config-aware.
 * Supports 3-tier pricing: peak / semi-peak / off-peak.
 */

import { TelemetryData } from "@/types/data-type";
import type { SiteSimulationConfig } from "./constants";
import { isPeakTimeTW, isSemiPeakTimeTW } from "./time-utils";
import { getElectricityRate, getCurrentRate } from "./electricity-rate";

/**
 * 計算總電費（包含 WITH/WITHOUT BESS 比較）
 */
export function calculateElectricityCost(
  data: TelemetryData[],
  config: SiteSimulationConfig,
): {
  totalCost: number;
  peakCost: number;
  offPeakCost: number;
  peakUsageKWh: number;
  offPeakUsageKWh: number;
  fixedCost: number;
  currentRate: number;
  costWithoutBESS: number;
  costWithBESS: number;
  savings: number;
  peakDischargeKWh: number;
  offPeakChargeKWh: number;
} {
  const now = new Date();
  const { peakRate, semiPeakRate, offRate } = getElectricityRate(now, config);

  let peakUsageKWh = 0;
  let semiPeakUsageKWh = 0;
  let offPeakUsageKWh = 0;
  let peakDischargeKWh = 0;
  let offPeakChargeKWh = 0;

  // Calculate average interval from actual data for the last point fallback
  // (avoids the 15-minute fixed fallback that causes kWh rollback)
  let avgIntervalHours = 5 / 3600; // Default: 5 seconds
  if (data.length >= 2) {
    const first = new Date(data[0]!.createAt).getTime();
    const last = new Date(data[data.length - 1]!.createAt).getTime();
    avgIntervalHours = (last - first) / (1000 * 60 * 60) / (data.length - 1);
    avgIntervalHours = Math.max(0, Math.min(avgIntervalHours, 1));
  }

  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    if (!item) continue;

    const date = new Date(item.createAt);
    const isPeak = isPeakTimeTW(date, config);
    const isSemiPeak = !isPeak && isSemiPeakTimeTW(date, config);

    let intervalHours: number;
    const nextItem = i < data.length - 1 ? data[i + 1] : null;
    if (nextItem?.createAt) {
      const nextDate = new Date(nextItem.createAt);
      intervalHours = (nextDate.getTime() - date.getTime()) / (1000 * 60 * 60);
      intervalHours = Math.max(0, Math.min(intervalHours, 1));
    } else {
      // Last data point: use average interval instead of fixed 15 minutes
      intervalHours = avgIntervalHours;
    }

    if (intervalHours <= 0) continue;

    const baseLoadKW = (item.TotalUsage || 0) / 1000;

    const bessPowerW = item.BESS?.Power || 0;
    const bessPowerKW = bessPowerW / 1000;
    const bessEnergyKWh = bessPowerKW * intervalHours;

    if (isPeak) {
      peakUsageKWh += baseLoadKW * intervalHours;
      if (bessPowerKW < 0) {
        peakDischargeKWh += Math.abs(bessEnergyKWh);
      }
    } else if (isSemiPeak) {
      semiPeakUsageKWh += baseLoadKW * intervalHours;
    } else {
      offPeakUsageKWh += baseLoadKW * intervalHours;
      if (bessPowerKW > 0) {
        offPeakChargeKWh += bessEnergyKWh;
      }
    }
  }

  const costWithoutBESS =
    peakUsageKWh * peakRate +
    semiPeakUsageKWh * semiPeakRate +
    offPeakUsageKWh * offRate;

  const effectivePeakUsageKWh = Math.max(0, peakUsageKWh - peakDischargeKWh);
  const effectiveOffPeakUsageKWh = offPeakUsageKWh + offPeakChargeKWh;

  const costWithBESS_Peak = effectivePeakUsageKWh * peakRate;
  const costWithBESS_SemiPeak = semiPeakUsageKWh * semiPeakRate;
  const costWithBESS_OffPeak = effectiveOffPeakUsageKWh * offRate;
  const costWithBESS =
    costWithBESS_Peak + costWithBESS_SemiPeak + costWithBESS_OffPeak;
  const savings = costWithoutBESS - costWithBESS;

  return {
    totalCost: Math.round(costWithBESS * 100) / 100,
    peakCost: Math.round(costWithBESS_Peak * 100) / 100,
    offPeakCost:
      Math.round((costWithBESS_SemiPeak + costWithBESS_OffPeak) * 100) / 100,
    peakUsageKWh: Math.round(peakUsageKWh * 100) / 100,
    offPeakUsageKWh:
      Math.round((semiPeakUsageKWh + offPeakUsageKWh) * 100) / 100,
    fixedCost: 0,
    currentRate: getCurrentRate(now, config),
    costWithoutBESS: Math.round(costWithoutBESS * 100) / 100,
    costWithBESS: Math.round(costWithBESS * 100) / 100,
    savings: Math.round(savings * 100) / 100,
    peakDischargeKWh: Math.round(peakDischargeKWh * 100) / 100,
    offPeakChargeKWh: Math.round(offPeakChargeKWh * 100) / 100,
  };
}
