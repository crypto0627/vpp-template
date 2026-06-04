"use client";

import { useMemo } from "react";
import { useSiteDataStore } from "@/stores/data-store";
import { createPersistedState, processIntervalCrossingMidnight } from "@/utils/bess-unified";
import { getSiteConfig, getSohForYear, getDCCapacity } from "@/config/site-configs";

export interface BatteryData {
  id: string;
  soc: number;
  socKWh: number;
  current: number;
  voltage: number;
  soh: number;
}

export function useBatteryData(): BatteryData | null {
  const { data, currentSite } = useSiteDataStore();
  const siteData = data[currentSite];
  const siteConfig = getSiteConfig(currentSite);

  return useMemo(() => {
    if (!siteData || siteData.length === 0) {
      return {
        id: "BESS",
        soc: 0,
        socKWh: 0,
        current: 0,
        voltage: siteConfig.NOMINAL_VOLTAGE,
        soh: Math.round(getSohForYear(siteConfig, new Date().getFullYear()) * 10000) / 100,
      };
    }

    const timeSlots: Array<{ time: string; hour: number; minute: number; avgLoadKW: number; slotDate: Date }> = [];

    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const slotData = siteData.filter((item) => {
          const date = new Date(item.createAt);
          return date.getHours() === hour && date.getMinutes() >= minute && date.getMinutes() < minute + 30;
        });
        if (slotData.length === 0) continue;
        const avgLoadKW = slotData.reduce((sum, item) => sum + (item.TotalUsage || 0) / 1000, 0) / slotData.length;
        timeSlots.push({ time: `${hour}:${minute}`, hour, minute, avgLoadKW, slotDate: new Date(slotData[0]!.createAt) });
      }
    }

    if (timeSlots.length === 0) return null;

    const today = new Date(siteData[0]!.createAt);
    const todayMidnight = new Date(today);
    todayMidnight.setHours(0, 0, 0, 0);

    let bessState = createPersistedState(todayMidnight.getTime(), siteConfig, 0);
    let latestBatteryPower = 0;

    for (const slot of timeSlots) {
      const slotStartMs = new Date(slot.slotDate).setMinutes(slot.minute, 0, 0);
      const slotEndMs = slotStartMs + 30 * 60 * 1000;
      const simResult = processIntervalCrossingMidnight(bessState, slotStartMs, slotEndMs, slot.avgLoadKW, siteConfig);
      bessState = simResult.finalState;
      const step = simResult.steps[simResult.steps.length - 1];
      if (step) latestBatteryPower = step.battery.power;
    }

    const dcCap = getDCCapacity(siteConfig, new Date().getFullYear());
    const socPercentage = Math.round((bessState.socKWh / dcCap) * 10000) / 100;

    return {
      id: "BESS",
      soc: socPercentage,
      socKWh: Math.round(bessState.socKWh * 100) / 100,
      current: latestBatteryPower / 1000,
      voltage: siteConfig.NOMINAL_VOLTAGE,
      soh: Math.round(getSohForYear(siteConfig, new Date().getFullYear()) * 10000) / 100,
    };
  }, [siteData, siteConfig]);
}
