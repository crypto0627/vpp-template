/**
 * Mock battery data hook (Template Version)
 *
 * Returns static BESS status based on time of day.
 * Replace this with real telemetry data when integrating a live backend.
 */
"use client";

import { useSiteDataStore } from "@/stores/data-store";
import { getSiteConfig } from "@/config/site-configs";

export interface BatteryData {
  /** State of Charge in percent (0–100) */
  soc: number;
  /** State of Charge in kWh */
  socKWh: number;
  /**
   * Battery current in kW.
   * Positive = charging, negative = discharging, 0 = idle.
   */
  current: number;
}

export function useBatteryData(): BatteryData {
  const { currentSite } = useSiteDataStore();
  const config = getSiteConfig(currentSite);

  const hour = new Date().getHours();

  // Mock SOC: charges 00–05, discharges 16–21
  const socPercent = 74;
  const socKWh = Math.round(config.BESS_CAPACITY_KWH * (socPercent / 100));

  let current = 0;
  if (hour >= 0 && hour < 5) current = config.PCS_CAPACITY_KW;     // charging
  if (hour >= 16 && hour < 21) current = -config.PCS_CAPACITY_KW;  // discharging

  return { soc: socPercent, socKWh, current };
}
