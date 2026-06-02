"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSiteDataStore } from "@/stores/data-store";
import { useMemo } from "react";
import {
  createPersistedState,
  processIntervalCrossingMidnight,
} from "@/utils/bess-unified";
import { getSiteConfig } from "@/config/site-configs";

export function EnergyFlowDiagram() {
  const { data, currentSite } = useSiteDataStore();
  const siteData = data[currentSite];
  const siteConfig = getSiteConfig(currentSite);

  // Calculate energy flow using BESS simulation
  const energyFlow = useMemo(() => {
    if (!siteData || siteData.length === 0) {
      return {
        gridPower: 0,
        chargingStationLoad: 0,
        bessPower: 0,
        bessStatus: "idle" as "charging" | "discharging" | "idle",
      };
    }

    const latestData = siteData[siteData.length - 1];

    // Charging station load from TotalUsage (W → kW)
    const chargingStationLoad =
      Math.round(((latestData?.TotalUsage || 0) / 1000) * 100) / 100;

    // Run BESS simulation to get current battery power
    // Collect time slots up to current time
    const timeSlots: Array<{
      avgLoadKW: number;
      slotDate: Date;
      minute: number;
    }> = [];

    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const slotData = siteData.filter((item) => {
          const date = new Date(item.createAt);
          const itemHour = date.getHours();
          const itemMinute = date.getMinutes();
          return (
            itemHour === hour &&
            itemMinute >= minute &&
            itemMinute < minute + 30
          );
        });

        if (slotData.length === 0) continue;

        const avgLoadKW =
          slotData.reduce(
            (sum, item) => sum + (item.TotalUsage || 0) / 1000,
            0,
          ) / slotData.length;
        const slotDate = new Date(slotData[0]!.createAt);

        timeSlots.push({
          avgLoadKW,
          slotDate,
          minute,
        });
      }
    }

    // Run simulation from midnight to now
    const today = new Date(siteData[0]!.createAt);
    const todayMidnight = new Date(today);
    todayMidnight.setHours(0, 0, 0, 0);

    let bessState = createPersistedState(
      todayMidnight.getTime(),
      siteConfig,
      0,
    );
    let latestBatteryPower = 0; // W

    for (const slot of timeSlots) {
      const slotStartMs = new Date(slot.slotDate).setMinutes(slot.minute, 0, 0);
      const slotEndMs = slotStartMs + 30 * 60 * 1000;

      const simResult = processIntervalCrossingMidnight(
        bessState,
        slotStartMs,
        slotEndMs,
        slot.avgLoadKW,
        siteConfig,
      );

      bessState = simResult.finalState;

      const step = simResult.steps[simResult.steps.length - 1];
      if (step) {
        latestBatteryPower = step.battery.power; // W
      }
    }

    // Calculate BESS power and status from simulation
    let bessPowerKW =
      Math.round(Math.abs(latestBatteryPower / 1000) * 100) / 100;

    // BESS status based on simulated power
    let bessStatus: "charging" | "discharging" | "idle";
    if (Math.abs(latestBatteryPower) < 100) {
      // < 0.1 kW
      bessStatus = "idle";
    } else if (latestBatteryPower > 0) {
      bessStatus = "charging";
    } else {
      bessStatus = "discharging";
    }

    // Grid power calculation:
    // - During charging: Grid supplies both charging station AND battery charging
    // - During discharging: Battery supplies as much as possible (up to PCS capacity or load)
    //   Grid only supplements if load exceeds battery capacity
    let gridPower: number;
    if (bessStatus === "charging") {
      // Off-peak: Grid = Charging Station Load + Battery Charging Power
      // Cap battery charging at PCS capacity
      bessPowerKW = Math.min(bessPowerKW, siteConfig.PCS_CAPACITY_KW);
      gridPower = Math.round((chargingStationLoad + bessPowerKW) * 100) / 100;
    } else if (bessStatus === "discharging") {
      // Peak: Battery supplies min(load, PCS capacity)
      // This ensures battery fully covers load up to its capacity limit
      bessPowerKW = Math.min(chargingStationLoad, siteConfig.PCS_CAPACITY_KW);
      // Grid only supplements if load > PCS capacity
      gridPower =
        Math.round(Math.max(0, chargingStationLoad - bessPowerKW) * 100) / 100;
    } else {
      // Idle: Grid = Charging Station Load
      gridPower = chargingStationLoad;
    }

    return {
      gridPower,
      chargingStationLoad,
      bessPower: bessPowerKW,
      bessStatus,
    };
  }, [siteData, siteConfig]);

  const isCharging = energyFlow.bessStatus === "charging";
  const isDischarging = energyFlow.bessStatus === "discharging";

  return (
    <Card className="border-gray-200 bg-white backdrop-blur">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-gray-900">
          能源流向圖
        </CardTitle>
        <p className="text-base text-gray-600">
          {isCharging
            ? "離峰時段 - 儲能充電中"
            : isDischarging
              ? "尖峰時段 - 儲能放電中"
              : "儲能待機中"}
        </p>
      </CardHeader>
      <CardContent>
        <div className="py-4 sm:py-6">
          {/* Triangle Flow Diagram */}
          <div
            className="relative w-full mx-auto max-w-2xl"
            style={{ minHeight: "360px" }}
          >
            {/* Grid (電網) - Top Center */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3">
              <div className="relative group">
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-[#DA7756]/10 border-3 border-[#DA7756] flex flex-col items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
                  <span className="text-base sm:text-lg font-semibold text-[#DA7756]">
                    電網
                  </span>
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-[#DA7756]">
                  {energyFlow.gridPower}
                </div>
                <div className="text-sm text-gray-600">kW</div>
              </div>
            </div>

            {/* Battery (儲能) - Bottom Left */}
            <div className="absolute bottom-0 left-[8%] flex flex-col items-center gap-3">
              <div className="relative group">
                <div
                  className={`relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-3 flex flex-col items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300 ${
                    isCharging
                      ? "bg-[#D4A56A]/10 border-[#D4A56A]"
                      : isDischarging
                        ? "bg-[#7D9B7E]/10 border-[#7D9B7E]"
                        : "bg-gray-50 border-gray-400"
                  }`}
                >
                  <span
                    className={`text-base sm:text-lg font-semibold ${
                      isCharging
                        ? "text-[#D4A56A]"
                        : isDischarging
                          ? "text-[#7D9B7E]"
                          : "text-gray-700"
                    }`}
                  >
                    儲能
                  </span>
                </div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <span
                    className={`text-2xl sm:text-3xl font-bold ${
                      isCharging
                        ? "text-[#D4A56A]"
                        : isDischarging
                          ? "text-[#7D9B7E]"
                          : "text-gray-600"
                    }`}
                  >
                    {energyFlow.bessPower}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  kW{" "}
                  {isCharging ? "(充電)" : isDischarging ? "(放電)" : "(待機)"}
                </div>
              </div>
            </div>

            {/* Charging Station (充電樁) - Bottom Right */}
            <div className="absolute bottom-0 right-[8%] flex flex-col items-center gap-3">
              <div className="relative group">
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gray-100 border-3 border-gray-400 flex flex-col items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
                  <span className="text-base sm:text-lg font-semibold text-gray-700">
                    充電樁
                  </span>
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {energyFlow.chargingStationLoad}
                </div>
                <div className="text-sm text-gray-600">kW</div>
              </div>
            </div>

            {/* Flow Arrows */}
            {/* Arrow: Grid → Charging Station (shown when grid supplies power) */}
            {energyFlow.gridPower > 0 && (
              <div className="absolute top-28 right-[22%] sm:top-32 sm:right-[24%]">
                <div className="flex items-center gap-0.5 rotate-45">
                  <span className="text-[#DA7756] text-2xl sm:text-3xl font-bold">
                    →
                  </span>
                  <span className="text-[#DA7756] text-2xl sm:text-3xl font-bold">
                    →
                  </span>
                </div>
              </div>
            )}

            {/* Arrow: Grid → Battery (only during charging) */}
            {isCharging && (
              <div className="absolute top-28 left-[22%] sm:top-32 sm:left-[24%]">
                <div className="flex items-center gap-0.5 -rotate-45">
                  <span className="text-[#D4A56A] text-2xl sm:text-3xl font-bold">
                    ←
                  </span>
                  <span className="text-[#D4A56A] text-2xl sm:text-3xl font-bold">
                    ←
                  </span>
                </div>
              </div>
            )}

            {/* Arrow: Battery → Charging Station (only during discharging) */}
            {isDischarging && (
              <div className="absolute bottom-24 left-1/2 -translate-x-1/2 sm:bottom-28">
                <div className="flex items-center gap-0.5">
                  <span className="text-[#7D9B7E] text-2xl sm:text-3xl font-bold">
                    →
                  </span>
                  <span className="text-[#7D9B7E] text-2xl sm:text-3xl font-bold">
                    →
                  </span>
                  <span className="text-[#7D9B7E] text-2xl sm:text-3xl font-bold">
                    →
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Flow Explanation */}
          <div className="mt-6 sm:mt-8 pt-4 sm:pt-5 border-t border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 text-sm sm:text-base">
              <div className="space-y-3">
                <div className="text-sm sm:text-base text-gray-600 font-semibold">
                  能源供應
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-[#DA7756]"></div>
                  <span className="text-gray-600">電網供電</span>
                  <span className="text-gray-900 font-bold ml-auto text-base">
                    {energyFlow.gridPower} kW
                  </span>
                </div>
                {isDischarging && (
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-[#7D9B7E]"></div>
                    <span className="text-gray-600">儲能放電</span>
                    <span className="text-gray-900 font-bold ml-auto text-base">
                      {energyFlow.bessPower} kW
                    </span>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <div className="text-sm sm:text-base text-gray-600 font-semibold">
                  能源消耗
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-gray-400"></div>
                  <span className="text-gray-600">充電樁負載</span>
                  <span className="text-gray-900 font-bold ml-auto text-base">
                    {energyFlow.chargingStationLoad} kW
                  </span>
                </div>
                {isCharging && (
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-[#D4A56A]"></div>
                    <span className="text-gray-600">儲能充電</span>
                    <span className="text-gray-900 font-bold ml-auto text-base">
                      {energyFlow.bessPower} kW
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Status Indicator */}
          <div className="mt-4 sm:mt-5 p-3 sm:p-4 rounded-lg bg-gray-50 border border-gray-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-2 sm:gap-0">
              <div className="flex items-center gap-3">
                <div
                  className={`w-3 h-3 rounded-full ${isCharging ? "bg-[#D4A56A]" : isDischarging ? "bg-[#7D9B7E]" : "bg-gray-400"}`}
                ></div>
                <span className="text-sm sm:text-base text-gray-600">
                  {isCharging
                    ? "離峰時段：電池充電以儲存便宜電力"
                    : isDischarging
                      ? "尖峰時段：電池放電減少電網用電"
                      : "電池待機：無充放電活動"}
                </span>
              </div>
              <span
                className={`text-sm sm:text-base font-bold ml-8 sm:ml-0 ${
                  isCharging
                    ? "text-[#D4A56A]"
                    : isDischarging
                      ? "text-[#7D9B7E]"
                      : "text-gray-600"
                }`}
              >
                {isCharging ? "充電" : isDischarging ? "放電" : "待機"}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
