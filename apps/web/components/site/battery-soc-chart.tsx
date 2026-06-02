"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSiteDataStore } from "@/stores/data-store";
import { useBatteryData } from "@/hooks/use-battery-data";
import { getSiteConfig, getSohForYear } from "@/config/site-configs";

export function BatterySOCChart() {
  const { currentSite, summaryData } = useSiteDataStore();
  const summary = summaryData[currentSite];

  // Get site-specific configuration
  const siteConfig = getSiteConfig(currentSite);

  // Get battery data from shared hook (BESS simulation)
  const batteryData = useBatteryData();

  const getSOCGradient = (soc: number) => {
    if (soc >= 80) return "from-[#7D9B7E] to-[#8FAB90]";
    if (soc >= 50) return "from-[#D4A56A] to-[#E0BC8A]";
    return "from-[#DA7756] to-[#E09878]";
  };

  // Get battery status based on actual current direction
  const getBatteryStatus = (current: number | null | undefined) => {
    if (current === null || current === undefined) {
      return {
        label: "錯誤",
        color: "text-gray-600",
        bgColor: "bg-white",
        borderColor: "border-gray-200",
        isCharging: false,
        isDischarging: false,
      };
    }
    if (Math.abs(current) < 0.1) {
      // Nearly zero current
      return {
        label: "待機",
        color: "text-gray-600",
        bgColor: "bg-white",
        borderColor: "border-gray-200",
        isCharging: false,
        isDischarging: false,
      };
    }
    if (current > 0) {
      // Positive current = Charging
      return {
        label: "充電中",
        color: "text-gray-900",
        bgColor: "bg-white",
        borderColor: "border-gray-200",
        isCharging: true,
        isDischarging: false,
      };
    }
    // Negative current = Discharging
    return {
      label: "放電中",
      color: "text-gray-900",
      bgColor: "bg-white",
      borderColor: "border-gray-200",
      isCharging: false,
      isDischarging: true,
    };
  };

  const status = batteryData
    ? getBatteryStatus(batteryData.current)
    : getBatteryStatus(null);

  const currentYear = new Date().getFullYear();

  // Current year SOH from degradation table
  const currentSohRatio = getSohForYear(siteConfig, currentYear);
  const currentSohPercent = Math.round(currentSohRatio * 10000) / 100;
  // DC側可用容量 = 原始電池容量 × SOH
  const dcCapacityKWh =
    Math.round(siteConfig.BESS_CAPACITY_KWH * currentSohRatio * 10) / 10;
  // 經PCS轉換後容量（最大放電量）= DC側可用容量 × PCS效率
  const pcsCapacityKWh =
    Math.round(dcCapacityKWh * siteConfig.DISCHARGE_EFFICIENCY * 10) / 10;
  // RTE (AC-AC) = 充電效率 × 放電效率
  const rtePercent =
    Math.round(
      siteConfig.CHARGE_EFFICIENCY * siteConfig.DISCHARGE_EFFICIENCY * 10000,
    ) / 100;

  if (!batteryData) {
    return (
      <Card className="border-gray-200 bg-white backdrop-blur">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl sm:text-2xl font-semibold text-gray-900">
              電池儲能狀態 (SOC)
            </CardTitle>
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full border ${status.borderColor} ${status.bgColor}`}
            >
              <span
                className={`text-sm sm:text-base font-medium ${status.color}`}
              >
                {status.label}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-600 py-8">載入中...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-gray-200 bg-white backdrop-blur">
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="text-lg font-semibold text-gray-900">
            電池儲能狀態 (SOC)
          </CardTitle>
          <div
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 rounded-full border ${status.borderColor} ${status.bgColor}`}
          >
            <span
              className={`text-sm sm:text-base font-medium ${status.color}`}
            >
              {status.label}
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
            {batteryData.soc}%
          </div>
          <div className="text-lg sm:text-xl font-semibold text-[#7D9B7E]">
            {batteryData.socKWh} kWh
          </div>
          <div className="text-sm sm:text-base text-gray-600">當前 SOC</div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* SOC Progress Bar */}
          <div className="relative h-10 sm:h-12 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`absolute left-0 top-0 h-full bg-linear-to-r ${getSOCGradient(batteryData.soc)} transition-all duration-500 flex items-center justify-center`}
              style={{ width: `${batteryData.soc}%` }}
            >
              <span className="text-sm sm:text-base font-bold text-white drop-shadow-md">
                {batteryData.soc}%
              </span>
            </div>
          </div>

          {/* Simplified BESS Information */}
          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-base sm:text-lg font-semibold text-gray-600 mb-3">
              設備規格
            </h3>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {/* BESS Capacity */}
              <div className="space-y-1">
                <div className="text-xs sm:text-sm text-gray-600">
                  BESS 額定容量
                </div>
                <div className="text-lg sm:text-xl font-bold text-gray-900">
                  {siteConfig.BESS_CAPACITY_KWH} kWh
                </div>
              </div>

              {/* PCS Capacity */}
              <div className="space-y-1">
                <div className="text-xs sm:text-sm text-gray-600">PCS 功率</div>
                <div className="text-lg sm:text-xl font-bold text-gray-900">
                  {siteConfig.PCS_CAPACITY_KW} kW
                </div>
              </div>

              {/* Current SOC */}
              <div className="space-y-1">
                <div className="text-xs sm:text-sm text-gray-600">當前 SOC</div>
                <div className="text-lg sm:text-xl font-bold text-gray-900">
                  {batteryData.soc}%
                  <span className="text-sm sm:text-base font-semibold text-[#7D9B7E] ml-1">
                    ({batteryData.socKWh} kWh)
                  </span>
                </div>
              </div>

              {/* Battery Health (SOH) - current year from degradation table */}
              <div className="space-y-1">
                <div className="text-xs sm:text-sm text-gray-600">
                  電池健康 (SOH · {currentYear})
                </div>
                <div className="text-lg sm:text-xl font-bold text-gray-900">
                  {currentSohPercent}%
                </div>
              </div>

              {/* DC側可用容量 = 原始電池容量 × SOH */}
              <div className="space-y-1">
                <div className="text-xs sm:text-sm text-gray-600">
                  DC側可用容量
                </div>
                <div className="text-lg sm:text-xl font-bold text-gray-900">
                  {dcCapacityKWh} kWh
                </div>
              </div>

              {/* 經PCS轉換後容量 = DC側可用容量 × 90.3% */}
              <div className="space-y-1">
                <div className="text-xs sm:text-sm text-gray-600">
                  經PCS轉換後容量
                </div>
                <div className="text-lg sm:text-xl font-bold text-gray-900">
                  {pcsCapacityKWh} kWh
                </div>
              </div>

              {/* AC測輸出至一次測電量 (RTE) = 充電效率 × 放電效率 */}
              <div className="space-y-1">
                <div className="text-xs sm:text-sm text-gray-600">
                  AC測輸出至一次測電量 (RTE)
                </div>
                <div className="text-lg sm:text-xl font-bold text-gray-900">
                  {rtePercent}%
                </div>
              </div>
            </div>
          </div>

          {/* BESS Activity - Show data based on actual battery state */}
          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-base sm:text-lg font-semibold text-gray-600 mb-3">
              儲能運作
            </h3>
            <div className="space-y-2">
              {status.isDischarging ? (
                // Actually discharging: Show discharge data
                <div className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm text-gray-600">
                    尖峰放電
                  </span>
                  <div className="text-right">
                    <span className="text-sm sm:text-base font-semibold text-gray-900">
                      {(summary?.savings?.peakDischargeKWh || 0).toFixed(1)} kWh
                    </span>
                    <span className="text-xs sm:text-sm text-gray-600 ml-1">
                      (
                      {(
                        ((summary?.savings?.peakDischargeKWh || 0) /
                          dcCapacityKWh) *
                        100
                      ).toFixed(1)}
                      %)
                    </span>
                  </div>
                </div>
              ) : status.isCharging ? (
                // Actually charging: Show charge data
                <div className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm text-gray-600">
                    離峰充電
                  </span>
                  <div className="text-right">
                    <span className="text-sm sm:text-base font-semibold text-gray-900">
                      {(summary?.savings?.offPeakChargeKWh || 0).toFixed(1)} kWh
                    </span>
                    <span className="text-xs sm:text-sm text-gray-600 ml-1">
                      (
                      {(
                        ((summary?.savings?.offPeakChargeKWh || 0) /
                          dcCapacityKWh) *
                        100
                      ).toFixed(1)}
                      %)
                    </span>
                  </div>
                </div>
              ) : (
                // Idle state
                <div className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm text-gray-600">
                    待機中
                  </span>
                  <div className="text-right">
                    <span className="text-sm sm:text-base font-semibold text-gray-900">
                      0 kWh
                    </span>
                  </div>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <span className="text-xs sm:text-sm text-gray-600">
                  運作狀態
                </span>
                <span className="text-sm sm:text-base font-semibold text-gray-900">
                  {status.label}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
