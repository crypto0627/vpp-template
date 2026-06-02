"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ReactECharts from "echarts-for-react";
import * as echarts from "echarts";
import { useSiteDataStore } from "@/stores/data-store";
import { useMemo } from "react";
import {
  getSiteConfig,
  type SiteSimulationConfig,
} from "@/config/site-configs";
import {
  createPersistedState,
  processIntervalCrossingMidnight,
} from "@/utils/bess-unified";
import { CHART_COLORS } from "@/constants/chart-colors";
import { axisStyle, tooltipStyle } from "@/utils/echarts-helpers";

function isPeakHour(date: Date, siteConfig: SiteSimulationConfig): boolean {
  const hour = date.getHours();
  const minute = date.getMinutes();
  const dayOfWeek = date.getDay();

  if (dayOfWeek === 0 || dayOfWeek === 6) return false;

  const minutes = hour * 60 + minute;

  if (siteConfig.PRICING_MODEL === "ev-charging") {
    const month = date.getMonth() + 1;
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
}

export function PowerDemandChart() {
  const { data, currentSite } = useSiteDataStore();
  const siteData = data[currentSite];
  const siteConfig = getSiteConfig(currentSite);

  const chartData = useMemo(() => {
    if (!siteData || siteData.length === 0) {
      const timeSlots = [];
      for (let hour = 0; hour < 24; hour++) {
        for (let minute = 0; minute < 60; minute += 15) {
          timeSlots.push({
            time: `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`,
            load: 0,
            discharge: 0,
            grid: 0,
            charge: 0,
            netPower: 0,
            actualUsage: 0,
            isPeak: false,
            timestamp: hour * 60 + minute,
          });
        }
      }
      return timeSlots;
    }

    const timeSlots: Array<{
      time: string;
      hour: number;
      minute: number;
      avgLoadKW: number;
      slotDate: Date;
      isPeak: boolean;
    }> = [];

    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const slotData = siteData.filter((item) => {
          const date = new Date(item.createAt);
          const itemHour = date.getHours();
          const itemMinute = date.getMinutes();
          return (
            itemHour === hour &&
            itemMinute >= minute &&
            itemMinute < minute + 15
          );
        });

        const avgLoadKW =
          slotData.length > 0
            ? slotData.reduce(
                (sum, item) => sum + (item.TotalUsage || 0) / 1000,
                0,
              ) / slotData.length
            : 0;

        const slotDate =
          slotData.length > 0 && slotData[0]
            ? new Date(slotData[0].createAt)
            : new Date(new Date().setHours(hour, minute, 0, 0));

        timeSlots.push({
          time: `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`,
          hour,
          minute,
          avgLoadKW,
          slotDate,
          isPeak: isPeakHour(slotDate, siteConfig),
        });
      }
    }

    const today = siteData[0] ? new Date(siteData[0].createAt) : new Date();
    const todayMidnight = new Date(today);
    todayMidnight.setHours(0, 0, 0, 0);

    let bessState = createPersistedState(
      todayMidnight.getTime(),
      siteConfig,
      0,
    );

    const simulationResults: Array<{
      chargePowerKW: number;
      dischargePowerKW: number;
      socKWh: number;
    }> = [];

    for (let i = 0; i < timeSlots.length; i++) {
      const slot = timeSlots[i]!;
      const slotStartMs = new Date(slot.slotDate).setMinutes(slot.minute, 0, 0);
      const slotEndMs = slotStartMs + 15 * 60 * 1000;

      const simResult = processIntervalCrossingMidnight(
        bessState,
        slotStartMs,
        slotEndMs,
        slot.avgLoadKW,
        siteConfig,
      );

      bessState = simResult.finalState;

      const step = simResult.steps[simResult.steps.length - 1];
      const batteryPower = step?.battery.power || 0;

      let chargePowerKW = 0;
      let dischargePowerKW = 0;

      if (batteryPower > 0) {
        chargePowerKW = batteryPower / 1000;
      } else if (batteryPower < 0) {
        dischargePowerKW = Math.abs(batteryPower) / 1000;
      }

      simulationResults.push({
        chargePowerKW,
        dischargePowerKW,
        socKWh: bessState.socKWh,
      });
    }

    return timeSlots.map((slot, index) => {
      const simResult = simulationResults[index]!;
      const load = slot.avgLoadKW;
      const gridSupplyKW = Math.max(0, load - simResult.dischargePowerKW);
      const totalGridImportKW = gridSupplyKW + simResult.chargePowerKW;

      const actualUsageKW = load + simResult.chargePowerKW - simResult.dischargePowerKW;

      return {
        time: slot.time,
        load: Math.round(load * 100) / 100,
        discharge: Math.round(simResult.dischargePowerKW * 100) / 100,
        grid: Math.round(gridSupplyKW * 100) / 100,
        charge: Math.round(simResult.chargePowerKW * 100) / 100,
        netPower: Math.round(totalGridImportKW * 100) / 100,
        actualUsage: Math.round(actualUsageKW * 100) / 100,
        isPeak: slot.isPeak,
        timestamp: slot.hour * 60 + slot.minute,
        soc: Math.round(simResult.socKWh * 100) / 100,
      };
    });
  }, [siteData, siteConfig]);

  const latestData = siteData?.[siteData.length - 1];
  const currentPower = latestData
    ? Math.round(((latestData.TotalUsage || 0) / 1000) * 100) / 100
    : 0;

  const nonZeroData = chartData.filter((d) => d.netPower > 0);
  const avgPower =
    nonZeroData.length > 0
      ? Math.round(
          (nonZeroData.reduce((sum, d) => sum + d.netPower, 0) /
            nonZeroData.length) *
            100,
        ) / 100
      : 0;
  const maxPower =
    chartData.length > 0 ? Math.max(...chartData.map((d) => Math.max(d.netPower, d.actualUsage))) : 0;
  const contractLimit = siteConfig.CONTRACT_LIMIT_KW;

  const rawChargeKWh = chartData.reduce((sum, d) => sum + d.charge * 0.25, 0);
  const totalChargeKWh =
    Math.round(Math.min(rawChargeKWh, siteConfig.BESS_CAPACITY_KWH) * 100) /
    100;
  const rawDischargeKWh = chartData.reduce(
    (sum, d) => sum + d.discharge * 0.25,
    0,
  );
  const totalDischargeKWh =
    Math.round(Math.min(rawDischargeKWh, siteConfig.BESS_CAPACITY_KWH) * 100) /
    100;

  const yAxisMax = Math.ceil(Math.max(maxPower, contractLimit) * 1.1);

  const echartsOption = {
    tooltip: {
      ...tooltipStyle,
      trigger: "axis",
      formatter(
        params: Array<{ seriesName: string; value: number; marker: string }>,
      ) {
        let html = `<div style="font-weight:600;margin-bottom:4px">${(params[0] as unknown as { axisValue: string })?.axisValue ?? ""}</div>`;
        for (const p of params) {
          if (p.value !== undefined && p.value !== 0) {
            html += `<div>${p.marker} ${p.seriesName}: ${p.value} kW</div>`;
          }
        }
        return html;
      },
    },
    grid: { top: 20, right: 10, bottom: 10, left: 10, containLabel: true },
    xAxis: {
      type: "category",
      data: chartData.map((d) => d.time),
      boundaryGap: false,
      ...axisStyle,
      axisLabel: { ...axisStyle.axisLabel, fontSize: 11 },
    },
    yAxis: {
      type: "value",
      max: yAxisMax,
      min: 0,
      name: "kW",
      nameTextStyle: { color: "#8B8178", fontSize: 14 },
      ...axisStyle,
      axisLabel: { ...axisStyle.axisLabel, fontSize: 14 },
    },
    series: [
      // Off-peak stack: load + charge
      {
        name: "用電負載",
        type: "line",
        stack: "offpeak",
        data: chartData.map((d) => d.load),
        smooth: true,
        symbol: "none",
        lineStyle: { width: 2, color: CHART_COLORS.coral },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: CHART_COLORS.coral + "CC" },
            { offset: 1, color: CHART_COLORS.coral + "1A" },
          ]),
        },
        itemStyle: { color: CHART_COLORS.coral },
      },
      {
        name: "電池充電",
        type: "line",
        stack: "offpeak",
        data: chartData.map((d) => d.charge),
        smooth: true,
        symbol: "none",
        lineStyle: { width: 2, color: CHART_COLORS.amber, type: "dashed" },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: CHART_COLORS.amber + "CC" },
            { offset: 1, color: CHART_COLORS.amber + "1A" },
          ]),
        },
        itemStyle: { color: CHART_COLORS.amber },
      },
      // Actual usage line: load + charge
      {
        name: "實際用電",
        type: "line",
        data: chartData.map((d) => d.actualUsage),
        smooth: true,
        symbol: "none",
        lineStyle: { width: 2.5, color: CHART_COLORS.slate },
        itemStyle: { color: CHART_COLORS.slate },
        z: 10,
      },
      // Peak stack: discharge + grid
      {
        name: "儲能放電",
        type: "line",
        stack: "peak",
        data: chartData.map((d) => d.discharge),
        smooth: true,
        symbol: "none",
        lineStyle: { width: 2, color: CHART_COLORS.terracotta, type: "dashed" },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: CHART_COLORS.terracotta + "CC" },
            { offset: 1, color: CHART_COLORS.terracotta + "1A" },
          ]),
        },
        itemStyle: { color: CHART_COLORS.terracotta },
      },
    ],
  };

  // Add reference lines via markLine on the first series
  (echartsOption.series[0] as { markLine?: object }).markLine = {
    silent: true,
    symbol: "none",
    animation: false,
    data: [
      {
        yAxis: contractLimit,
        lineStyle: {
          color: CHART_COLORS.contractLimit,
          width: 2,
          type: "dashed",
        },
        label: { show: false },
      },
      {
        yAxis: siteConfig.PCS_CAPACITY_KW,
        lineStyle: {
          color: CHART_COLORS.pcsCapacity,
          width: 1,
          type: "dashed",
        },
        label: { show: false },
      },
    ],
  };

  return (
    <Card className="border-border bg-white backdrop-blur">
      <CardHeader className="px-3 sm:px-6 py-3 sm:py-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
          <CardTitle className="text-xl sm:text-2xl font-semibold text-foreground">
            案場用電負載
          </CardTitle>
          <div className="text-left sm:text-right">
            <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">
              {currentPower} kW
            </div>
            <div className="text-sm sm:text-base text-muted-foreground">
              當前功率
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
        <div className="h-48 sm:h-56 md:h-64">
          <ReactECharts
            option={echartsOption}
            style={{ width: "100%", height: "100%" }}
            lazyUpdate
          />
        </div>
        <div className="mt-3 sm:mt-4 space-y-2 sm:space-y-3">
          {/* Legend */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-sm sm:text-base">
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 sm:w-5 sm:h-5 rounded shrink-0"
                style={{ backgroundColor: CHART_COLORS.slate }}
              ></div>
              <span className="text-muted-foreground">實際用電 (負載+充電)</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 sm:w-5 sm:h-5 rounded shrink-0"
                style={{ backgroundColor: CHART_COLORS.coral }}
              ></div>
              <span className="text-muted-foreground">用電負載</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 sm:w-5 sm:h-5 rounded shrink-0"
                style={{ backgroundColor: CHART_COLORS.terracotta }}
              ></div>
              <span className="text-muted-foreground">
                儲能放電 (尖峰, ≤{siteConfig.PCS_CAPACITY_KW}kW)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 sm:w-5 sm:h-5 rounded shrink-0"
                style={{ backgroundColor: CHART_COLORS.amber }}
              ></div>
              <span className="text-muted-foreground">儲能充電 (離峰)</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-0 sm:w-7 border-t-2 border-dashed shrink-0"
                style={{ borderColor: CHART_COLORS.contractLimit }}
              ></div>
              <span className="text-muted-foreground text-sm sm:text-base">
                契約容量: {contractLimit} kW
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-0 sm:w-7 border-t-2 border-dashed shrink-0"
                style={{ borderColor: CHART_COLORS.pcsCapacity }}
              ></div>
              <span className="text-muted-foreground text-sm sm:text-base">
                最大充放電量: {siteConfig.PCS_CAPACITY_KW} kW
              </span>
            </div>
          </div>
          {/* Statistics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-sm sm:text-base pt-2 border-t border-border">
            <div className="text-muted-foreground flex justify-between sm:block">
              <span>平均功率:</span>
              <span className="text-foreground font-semibold ml-1">
                {avgPower} kW
              </span>
            </div>
            <div className="text-muted-foreground flex justify-between sm:block">
              <span>峰值:</span>
              <span className="text-foreground font-semibold ml-1">
                {maxPower} kW
              </span>
            </div>
            <div className="text-muted-foreground flex justify-between sm:block">
              <span>累計充電:</span>
              <span
                className="font-semibold ml-1"
                style={{
                  color: totalChargeKWh > 0 ? CHART_COLORS.amber : undefined,
                }}
              >
                {totalChargeKWh} kWh {totalChargeKWh > 0 ? "✓" : ""}
              </span>
            </div>
            <div className="text-muted-foreground flex justify-between sm:block">
              <span>累計放電:</span>
              <span
                className="font-semibold ml-1"
                style={{
                  color: totalDischargeKWh > 0 ? CHART_COLORS.sage : undefined,
                }}
              >
                {totalDischargeKWh} kWh {totalDischargeKWh > 0 ? "✓" : ""}
              </span>
            </div>
          </div>
          {/* Discharging Schedule & Rates */}
          <div className="pt-4 border-t border-border">
            <h3 className="text-base sm:text-lg font-semibold text-muted-foreground mb-3">
              放電時段與費率
            </h3>
            <div className="space-y-3">
              <div
                className="p-3 rounded-lg border"
                style={{
                  backgroundColor: CHART_COLORS.sage + "15",
                  borderColor: CHART_COLORS.sage + "40",
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: CHART_COLORS.sage }}
                    ></div>
                    <span className="text-sm font-semibold text-foreground">
                      放電時段
                    </span>
                  </div>
                  <span
                    className="text-sm font-semibold"
                    style={{ color: CHART_COLORS.sage }}
                  >
                    尖峰電價
                  </span>
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground space-y-1">
                  {siteConfig.PRICING_MODEL === "ev-charging" ? (
                    <>
                      <div>
                        夏月：{siteConfig.PEAK_START_HOUR}:
                        {String(siteConfig.PEAK_START_MINUTE).padStart(2, "0")}{" "}
                        - {siteConfig.PEAK_END_HOUR}:
                        {String(siteConfig.PEAK_END_MINUTE).padStart(2, "0")}
                      </div>
                      <div>
                        非夏月：{siteConfig.NON_SUMMER_PEAK_START_HOUR}:
                        {String(
                          siteConfig.NON_SUMMER_PEAK_START_MINUTE,
                        ).padStart(2, "0")}{" "}
                        - {siteConfig.NON_SUMMER_PEAK_END_HOUR}:
                        {String(siteConfig.NON_SUMMER_PEAK_END_MINUTE).padStart(
                          2,
                          "0",
                        )}
                      </div>
                    </>
                  ) : (
                    <div>
                      平日：{siteConfig.PEAK_START_HOUR}:
                      {String(siteConfig.PEAK_START_MINUTE).padStart(2, "0")} -{" "}
                      {siteConfig.PEAK_END_HOUR}:
                      {String(siteConfig.PEAK_END_MINUTE).padStart(2, "0")}
                    </div>
                  )}
                  <div>夏月費率：{siteConfig.SUMMER_PEAK_RATE} 元/度</div>
                  <div>非夏月費率：{siteConfig.NON_SUMMER_PEAK_RATE} 元/度</div>
                </div>
              </div>
              <div
                className="p-3 rounded-lg border"
                style={{
                  backgroundColor: CHART_COLORS.amber + "15",
                  borderColor: CHART_COLORS.amber + "40",
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: CHART_COLORS.amber }}
                    ></div>
                    <span className="text-sm font-semibold text-foreground">
                      充電時段
                    </span>
                  </div>
                  <span
                    className="text-sm font-semibold"
                    style={{ color: CHART_COLORS.amber }}
                  >
                    離峰電價
                  </span>
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground space-y-1">
                  <div>每日 00:00 開始充電（充滿即停）</div>
                  <div>僅限平日，週末/假日停止</div>
                  <div>夏月費率：{siteConfig.SUMMER_OFFPEAK_RATE} 元/度</div>
                  <div>
                    非夏月費率：{siteConfig.NON_SUMMER_OFFPEAK_RATE} 元/度
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
