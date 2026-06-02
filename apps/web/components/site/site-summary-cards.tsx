"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSiteDataStore } from "@/stores/data-store";
import { useMemo, useState, useEffect, useCallback } from "react";
import { getSiteConfig } from "@/config/site-configs";
import { useBatteryData } from "@/hooks/use-battery-data";

interface PeriodSavings {
  period: string;
  savings: number;
  costWithoutBESS: number;
  costWithBESS: number;
  loading: boolean;
}

export function SiteSummaryCards() {
  const { currentSite, summaryData, calculatePeriodSavings } =
    useSiteDataStore();
  const [monthlySavings, setMonthlySavings] = useState<PeriodSavings>({
    period: "month",
    savings: 0,
    costWithoutBESS: 0,
    costWithBESS: 0,
    loading: true,
  });
  const [yearlySavings, setYearlySavings] = useState<PeriodSavings>({
    period: "year",
    savings: 0,
    costWithoutBESS: 0,
    costWithBESS: 0,
    loading: true,
  });

  // Get site-specific configuration
  const siteConfig = getSiteConfig(currentSite);

  // Get summary data from store (already calculated with time-of-use rates)
  const summary = summaryData[currentSite];

  // Fetch historical period savings from report API
  const fetchSavings = useCallback(
    async (period: "month" | "year") => {
      try {
        const result = await calculatePeriodSavings(period);
        const setter =
          period === "month" ? setMonthlySavings : setYearlySavings;
        setter({
          period,
          savings: result.savings || 0,
          costWithoutBESS: result.costWithoutBESS || 0,
          costWithBESS: result.costWithBESS || 0,
          loading: false,
        });
      } catch (error) {
        console.error(`Failed to calculate ${period} savings:`, error);
        const setter =
          period === "month" ? setMonthlySavings : setYearlySavings;
        setter((prev) => ({ ...prev, loading: false }));
      }
    },
    [calculatePeriodSavings],
  );

  // Fetch on mount + refresh every 5 minutes
  useEffect(() => {
    if (currentSite !== "neihu") return;

    fetchSavings("month");
    fetchSavings("year");

    const interval = setInterval(
      () => {
        fetchSavings("month");
        fetchSavings("year");
      },
      5 * 60 * 1000,
    );

    return () => clearInterval(interval);
  }, [currentSite, fetchSavings]);

  // Combine historical savings (report API) + today's real-time savings (store)
  // Historical = month start ~ yesterday, Today = from real-time telemetry
  const todaySavings = summary?.savings?.value || 0;

  const monthlyTotal = useMemo(
    () => Math.round(monthlySavings.savings + Math.max(0, todaySavings)),
    [monthlySavings.savings, todaySavings],
  );

  const yearlyTotal = useMemo(
    () => Math.round(yearlySavings.savings + Math.max(0, todaySavings)),
    [yearlySavings.savings, todaySavings],
  );

  // Get real-time battery data from BESS simulation
  const batteryData = useBatteryData();
  const bessCurrent = batteryData?.current ?? null;

  const savings = summary?.savings;

  // Get battery status based on actual current (same logic as battery-soc-chart)
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

  const batteryStatus = getBatteryStatus(bessCurrent);

  // Check if current time is during peak hours (for card styling)
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total Electricity Usage */}
      <Card className="border border-gray-200 bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-base sm:text-lg font-medium text-gray-600">
            今日總用電量
          </CardTitle>
        </CardHeader>
        <CardContent>
          {summary?.electricityUsage?.withBESS !== undefined ? (
            // Show comparison when BESS data is available
            <>
              <div className="space-y-2">
                <div>
                  <div className="flex items-baseline gap-2 mb-1">
                    <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#7D9B7E]">
                      {summary.electricityUsage.withBESS.toLocaleString()}
                    </div>
                    <span className="text-xs sm:text-sm text-gray-500">
                      有儲能
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <div className="text-xl sm:text-2xl lg:text-3xl font-semibold text-gray-500">
                      {summary.electricityUsage.value.toLocaleString()}
                    </div>
                    <span className="text-xs sm:text-sm text-gray-400">
                      無儲能
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-sm sm:text-base text-gray-500 mt-2">
                {summary.electricityUsage.unit}
              </p>
            </>
          ) : (
            // Fallback when BESS data is not available
            <>
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-1">
                {(summary?.electricityUsage?.value || 0).toLocaleString()}
              </div>
              <p className="text-sm sm:text-base text-gray-500">
                {summary?.electricityUsage?.unit || "kWh"}
              </p>
              <div className="mt-3 text-xs sm:text-sm text-gray-500">
                今日累計用電量
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Total Cost (With BESS) */}
      <Card className="border border-gray-200 bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-base sm:text-lg font-medium text-gray-600">
            今日電費成本
          </CardTitle>
        </CardHeader>
        <CardContent>
          {savings && savings.costWithBESS !== undefined ? (
            // Show comparison when BESS data is available
            <>
              <div className="space-y-2">
                <div>
                  <div className="flex items-baseline gap-2 mb-1">
                    <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#7D9B7E]">
                      ${savings.costWithBESS.toFixed(0).toLocaleString()}
                    </div>
                    <span className="text-xs sm:text-sm text-gray-500">
                      有儲能
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <div className="text-xl sm:text-2xl lg:text-3xl font-semibold text-gray-500">
                      ${savings.costWithoutBESS.toFixed(0).toLocaleString()}
                    </div>
                    <span className="text-xs sm:text-sm text-gray-400">
                      無儲能
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-sm sm:text-base text-gray-500 mt-2">
                {summary?.costs?.unit || "NT$"}
              </p>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                僅流動電費
              </p>
            </>
          ) : (
            // Fallback when BESS data is not available
            <>
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-1">
                ${(summary?.costs?.value.toFixed(0) || 0).toLocaleString()}
              </div>
              <p className="text-sm sm:text-base text-gray-500">
                {summary?.costs?.unit || "NT$"}
              </p>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                僅流動電費
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* BESS Status - Dynamic based on actual battery state */}
      <Card
        className={`border ${batteryStatus.isDischarging ? "border-[#1A1915] bg-[#1A1915] text-white" : "border-gray-200 bg-white"}`}
      >
        <CardHeader className="pb-2">
          <CardTitle
            className={`text-base sm:text-lg font-medium ${batteryStatus.isDischarging ? "text-gray-300" : "text-gray-600"}`}
          >
            {batteryStatus.isDischarging ? "儲能省電費" : "儲能狀態"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {batteryStatus.isDischarging ? (
            // Actually discharging: Show savings and discharge data
            <>
              {(savings?.value || 0) < 0 ? (
                <>
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1">
                    儲能尚未節省費用
                  </div>
                  <p className="text-sm sm:text-base text-gray-300">
                    持續運轉累積中
                  </p>
                </>
              ) : (
                <>
                  <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-1">
                    ${(savings?.value || 0).toLocaleString()}
                  </div>
                  <p className="text-sm sm:text-base text-gray-300">
                    {savings?.unit || "NT$"}
                  </p>
                </>
              )}
              <p className="text-xs sm:text-sm text-gray-400 mt-1">
                流動電費節省
              </p>
              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-400">尖峰放電</span>
                  <span className="text-gray-200">
                    {(savings?.peakDischargeKWh || 0).toFixed(1)} kWh
                  </span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-400">運作狀態</span>
                  <span className="text-gray-200">{batteryStatus.label}</span>
                </div>
              </div>
            </>
          ) : batteryStatus.isCharging ? (
            // Actually charging: Show charging status with charge data
            <>
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-1">
                {batteryStatus.label}
              </div>
              <p className="text-sm sm:text-base text-gray-600">離峰時段儲能</p>
              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-500">離峰充電</span>
                  <span className="text-gray-900">
                    {(savings?.offPeakChargeKWh || 0).toFixed(1)} kWh
                  </span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-500">運作狀態</span>
                  <span className="text-gray-900">{batteryStatus.label}</span>
                </div>
              </div>
            </>
          ) : (
            // Idle state: Show idle status
            <>
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-1">
                {batteryStatus.label}
              </div>
              <p className="text-sm sm:text-base text-gray-600">
                {isPeakHours ? "尖峰時段" : "離峰時段"}
              </p>
              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-500">運作狀態</span>
                  <span className="text-gray-900">{batteryStatus.label}</span>
                </div>
                {savings && (
                  <div className="flex justify-between text-xs sm:text-sm pt-2 border-t border-gray-200">
                    <span className="text-gray-500">今日節費</span>
                    <span className="text-gray-900">
                      {(savings.value || 0) < 0
                        ? "尚未節省費用"
                        : `$${(savings.value || 0).toLocaleString()}`}
                    </span>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Period Savings - Monthly & Yearly */}
      <Card className="border border-gray-200 bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-base sm:text-lg font-medium text-gray-600">
            累積節費
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Monthly Savings */}
            <div className="space-y-1">
              <span className="text-xs sm:text-sm text-gray-600 font-medium">
                當月節費
              </span>
              {monthlySavings.loading ? (
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-400">
                  載入中...
                </div>
              ) : monthlyTotal <= 0 ? (
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-500">
                  尚未節省
                </div>
              ) : (
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#7D9B7E]">
                  ${monthlyTotal.toLocaleString()}
                </div>
              )}
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                本月累積至今日
              </p>
            </div>
            {/* Yearly Savings */}
            <div className="space-y-1 pt-2 border-t border-gray-200">
              <span className="text-xs sm:text-sm text-gray-600 font-medium">
                當年節費
              </span>
              {yearlySavings.loading ? (
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-400">
                  載入中...
                </div>
              ) : yearlyTotal <= 0 ? (
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-500">
                  尚未節省
                </div>
              ) : (
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#7D9B7E]">
                  ${yearlyTotal.toLocaleString()}
                </div>
              )}
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                本年累積至今日
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
