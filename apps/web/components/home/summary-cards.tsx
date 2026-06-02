"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSiteDataStore } from "@/stores/data-store";
import { useEffect, useMemo } from "react";
import { getSiteConfig } from "@/config/site-configs";
import {
  createPersistedState,
  processIntervalCrossingMidnight,
} from "@/utils/bess-unified";

export function SummaryCards() {
  const { currentSite, currentSiteType, summaryData, data, lastUpdated } =
    useSiteDataStore();
  const currentSummary = summaryData[currentSite];

  // Get site-specific configuration
  const siteConfig = getSiteConfig(currentSite);

  // Memoize currentData to avoid creating new array on every render
  const currentData = useMemo(
    () => data[currentSite] || [],
    [data, currentSite],
  );

  // Force re-render when data changes
  useEffect(() => {
    // This effect will trigger when data changes, causing component to re-render
    // The dependency on currentData.length and lastUpdated ensures updates
  }, [currentSite, currentData.length, lastUpdated]);

  // No need for manual fetchSummaryData since fetchData now handles both data and summary

  // Get battery status based on actual current (same logic as site-summary-cards)
  const getBatteryStatus = (current: number | null) => {
    if (current === null || current === undefined) {
      return {
        label: "待機",
        isCharging: false,
        isDischarging: false,
        isIdle: true,
      };
    }
    if (Math.abs(current) < 0.1) {
      // Nearly zero current = Idle
      return {
        label: "待機",
        isCharging: false,
        isDischarging: false,
        isIdle: true,
      };
    }
    if (current > 0) {
      // Positive current = Charging
      return {
        label: "充電中",
        isCharging: true,
        isDischarging: false,
        isIdle: false,
      };
    }
    // Negative current = Discharging
    return {
      label: "放電中",
      isCharging: false,
      isDischarging: true,
      isIdle: false,
    };
  };

  // Run BESS simulation to get actual battery power (same as battery-soc-chart)
  const bessCurrent = useMemo(() => {
    if (!currentData || currentData.length === 0) {
      return null;
    }

    // Step 1: Collect 30-minute time slots with average load
    const timeSlots: Array<{
      hour: number;
      minute: number;
      avgLoadKW: number;
      slotDate: Date;
    }> = [];

    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const slotData = currentData.filter((item) => {
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
          hour,
          minute,
          avgLoadKW,
          slotDate,
        });
      }
    }

    if (timeSlots.length === 0) {
      return null;
    }

    // Step 2: Run BESS simulation from midnight to latest data point
    const today = new Date(currentData[0]!.createAt);
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

    // Convert to kW for status detection
    return latestBatteryPower / 1000; // kW
  }, [currentData, siteConfig]);

  const batteryStatus = getBatteryStatus(bessCurrent);

  // Check if current time is during peak hours
  const isPeakHours = useMemo(() => {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const dayOfWeek = now.getDay();

    if (dayOfWeek === 0 || dayOfWeek === 6) return false;

    const minutes = hour * 60 + minute;

    if (siteConfig.PRICING_MODEL === "ev-charging") {
      const month = now.getMonth() + 1;
      const isSummer = siteConfig.SUMMER_MONTHS.includes(month);
      if (isSummer) {
        const start =
          siteConfig.PEAK_START_HOUR * 60 + siteConfig.PEAK_START_MINUTE;
        const end = siteConfig.PEAK_END_HOUR * 60 + siteConfig.PEAK_END_MINUTE;
        return minutes >= start && minutes < end;
      } else {
        const start =
          siteConfig.NON_SUMMER_PEAK_START_HOUR * 60 +
          siteConfig.NON_SUMMER_PEAK_START_MINUTE;
        const end =
          siteConfig.NON_SUMMER_PEAK_END_HOUR * 60 +
          siteConfig.NON_SUMMER_PEAK_END_MINUTE;
        return minutes >= start && minutes < end;
      }
    }

    const peakStart =
      siteConfig.PEAK_START_HOUR * 60 + siteConfig.PEAK_START_MINUTE;
    const peakEnd = siteConfig.PEAK_END_HOUR * 60 + siteConfig.PEAK_END_MINUTE;
    return minutes >= peakStart && minutes < peakEnd;
  }, [siteConfig]);

  const cardCount = currentSiteType === "charging" ? 5 : 4;

  if (!currentSummary) {
    return (
      <div
        className={`grid grid-cols-2 md:grid-cols-2 gap-2 md:gap-4 ${currentSiteType === "charging" ? "lg:grid-cols-5" : "lg:grid-cols-4"}`}
      >
        {Array.from({ length: cardCount }).map((_, i) => (
          <Card key={i} className="animate-pulse bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-16"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-20 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-12"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div
      className={`grid grid-cols-2 gap-2 md:gap-3 lg:gap-4 ${currentSiteType === "charging" ? "lg:grid-cols-5" : "lg:grid-cols-4"}`}
    >
      {/* Electricity Usage */}
      <Card className="border border-gray-200 bg-white/90 hover:bg-white transition-colors">
        <CardHeader className="p-3 pb-2 md:p-4 md:pb-2">
          <CardTitle className="text-sm md:text-base lg:text-lg font-medium text-gray-600">
            今日總用電量
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 pt-0 pb-3 md:px-4 md:pb-4">
          {currentSummary.electricityUsage.withBESS !== undefined ? (
            // Show comparison when BESS data is available
            <>
              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <div className="text-xl md:text-2xl lg:text-3xl font-bold text-[#7D9B7E]">
                    {currentSummary.electricityUsage.withBESS.toFixed(2)}
                  </div>
                  <span className="text-xs md:text-sm text-gray-500">
                    有儲能
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <div className="text-lg md:text-xl lg:text-2xl font-semibold text-gray-500">
                    {currentSummary.electricityUsage.value.toFixed(2)}
                  </div>
                  <span className="text-xs md:text-sm text-gray-400">
                    無儲能
                  </span>
                </div>
              </div>
              <p className="text-sm md:text-base text-gray-500 mt-1">
                {currentSummary.electricityUsage.unit}
              </p>
            </>
          ) : (
            // Fallback when BESS data is not available
            <>
              <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">
                {currentSummary.electricityUsage.value.toFixed(2)}
              </div>
              <p className="text-sm md:text-base text-gray-500">
                {currentSummary.electricityUsage.unit}
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Costs */}
      <Card className="border border-gray-200 bg-white/90 hover:bg-white transition-colors">
        <CardHeader className="p-3 pb-2 md:p-4 md:pb-2">
          <CardTitle className="text-sm md:text-base lg:text-lg font-medium text-gray-600">
            今日電費成本
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 pt-0 pb-3 md:px-4 md:pb-4">
          {currentSummary.savings &&
          currentSummary.savings.costWithBESS !== undefined ? (
            // Show comparison when BESS data is available
            <>
              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <div className="text-xl md:text-2xl lg:text-3xl font-bold text-[#7D9B7E]">
                    ${currentSummary.savings.costWithBESS.toFixed(0)}
                  </div>
                  <span className="text-xs md:text-sm text-gray-500">
                    有儲能
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <div className="text-lg md:text-xl lg:text-2xl font-semibold text-gray-500">
                    ${currentSummary.savings.costWithoutBESS.toFixed(0)}
                  </div>
                  <span className="text-xs md:text-sm text-gray-400">
                    無儲能
                  </span>
                </div>
              </div>
              <p className="text-sm md:text-base text-gray-500 mt-1">
                {currentSummary.costs.unit}
              </p>
              <p className="text-xs md:text-sm text-gray-500 mt-1">
                僅流動電費
              </p>
            </>
          ) : (
            // Fallback when BESS data is not available
            <>
              <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">
                {currentSummary.costs.value.toFixed(0)}
              </div>
              <p className="text-sm md:text-base text-gray-500">
                {currentSummary.costs.unit}
              </p>
              <p className="text-xs md:text-sm text-gray-500 mt-1">
                僅流動電費
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Energy Storage - Dynamic based on actual battery state */}
      <Card
        className={`border transition-colors ${batteryStatus.isDischarging ? "border-[#1A1915] bg-[#1A1915] text-white" : "border-gray-200 bg-white/90 hover:bg-white"}`}
      >
        <CardHeader className="p-3 pb-2 md:p-4 md:pb-2">
          <CardTitle
            className={`text-sm md:text-base lg:text-lg font-medium ${batteryStatus.isDischarging ? "text-gray-300" : "text-gray-600"}`}
          >
            {batteryStatus.isDischarging ? "儲能省電費" : "儲能狀態"}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 pt-0 pb-3 md:px-4 md:pb-4">
          {batteryStatus.isDischarging ? (
            // Actually discharging: Show savings and discharge data
            <>
              {(currentSummary.savings?.value || 0) < 0 ? (
                <>
                  <div className="text-xl md:text-2xl lg:text-3xl font-bold text-white">
                    儲能尚未節省費用
                  </div>
                  <p className="text-sm md:text-base text-gray-300">
                    持續運轉累積中
                  </p>
                </>
              ) : (
                <>
                  <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-white">
                    ${(currentSummary.savings?.value || 0).toLocaleString()}
                  </div>
                  <p className="text-sm md:text-base text-gray-300">
                    {currentSummary.savings?.unit || "NT$"}
                  </p>
                </>
              )}
              <p className="text-xs md:text-sm text-gray-400 mt-1">
                流動電費節省
              </p>
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-xs md:text-sm">
                  <span className="text-gray-400">尖峰放電</span>
                  <span className="text-gray-200">
                    {(currentSummary.savings?.peakDischargeKWh || 0).toFixed(1)}{" "}
                    kWh
                  </span>
                </div>
                <div className="flex justify-between text-xs md:text-sm">
                  <span className="text-gray-400">離峰充電</span>
                  <span className="text-gray-200">
                    {(currentSummary.savings?.offPeakChargeKWh || 0).toFixed(1)}{" "}
                    kWh
                  </span>
                </div>
                <div className="flex justify-between text-xs md:text-sm">
                  <span className="text-gray-400">運作狀態</span>
                  <span className="text-gray-200">{batteryStatus.label}</span>
                </div>
              </div>
            </>
          ) : batteryStatus.isCharging ? (
            // Actually charging: Show charging status with charge data
            <>
              <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">
                {batteryStatus.label}
              </div>
              <p className="text-sm md:text-base text-gray-600">離峰時段儲能</p>
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-xs md:text-sm">
                  <span className="text-gray-500">離峰充電</span>
                  <span className="text-gray-900">
                    {(currentSummary.savings?.offPeakChargeKWh || 0).toFixed(1)}{" "}
                    kWh
                  </span>
                </div>
                <div className="flex justify-between text-xs md:text-sm">
                  <span className="text-gray-500">運作狀態</span>
                  <span className="text-gray-900">{batteryStatus.label}</span>
                </div>
              </div>
            </>
          ) : (
            // Idle state: Show idle status
            <>
              <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">
                {batteryStatus.label}
              </div>
              <p className="text-sm md:text-base text-gray-600">
                {isPeakHours ? "尖峰時段" : "離峰時段"}
              </p>
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-xs md:text-sm">
                  <span className="text-gray-500">運作狀態</span>
                  <span className="text-gray-900">{batteryStatus.label}</span>
                </div>
                {currentSummary.savings && (
                  <div className="flex justify-between text-xs md:text-sm pt-1 border-t border-gray-200">
                    <span className="text-gray-500">今日節費</span>
                    <span className="text-gray-900">
                      {(currentSummary.savings.value || 0) < 0
                        ? "尚未節省費用"
                        : `$${(currentSummary.savings.value || 0).toLocaleString()}`}
                    </span>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Charging Piles - Only show for charging sites */}
      {currentSiteType === "charging" && (
        <Card className="border border-gray-200 bg-white/90 hover:bg-white transition-colors">
          <CardHeader className="p-3 pb-2 md:p-4 md:pb-2">
            <CardTitle className="text-sm md:text-base lg:text-lg font-medium text-gray-600">
              充電樁使用
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pt-0 pb-3 md:px-4 md:pb-4">
            <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">
              {currentSummary.chargingPiles.active}/
              {currentSummary.chargingPiles.total}
            </div>
            <p className="text-sm md:text-base text-gray-500">使用中/總數</p>
            <div className="flex items-center mt-2">
              <span className="text-sm md:text-base text-gray-600">
                使用率 {currentSummary.chargingPiles.usage.toFixed(2)}%
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
