"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ReactECharts from "echarts-for-react";
import * as echarts from "echarts";
import type { SiteSimulationConfig } from "@/config/site-configs";
import type { HourlyPowerRecord } from "@/utils/report-generator";
import {
  createPersistedState,
  processIntervalCrossingMidnight,
} from "@/utils/bess-unified";
import { CHART_COLORS } from "@/constants/chart-colors";
import { axisStyle, tooltipStyle } from "@/utils/echarts-helpers";

function isPeakHour(date: Date, config: SiteSimulationConfig): boolean {
  const hour = date.getHours();
  const minute = date.getMinutes();
  const dayOfWeek = date.getDay();

  if (dayOfWeek === 0 || dayOfWeek === 6) return false;

  const minutes = hour * 60 + minute;

  if (config.PRICING_MODEL === "ev-charging") {
    const month = date.getMonth() + 1;
    const isSummer = config.SUMMER_MONTHS.includes(month);
    if (isSummer) {
      const start = config.PEAK_START_HOUR * 60 + config.PEAK_START_MINUTE;
      const end = config.PEAK_END_HOUR * 60 + config.PEAK_END_MINUTE;
      return minutes >= start && minutes < end;
    } else {
      const start =
        config.NON_SUMMER_PEAK_START_HOUR * 60 +
        config.NON_SUMMER_PEAK_START_MINUTE;
      const end =
        config.NON_SUMMER_PEAK_END_HOUR * 60 +
        config.NON_SUMMER_PEAK_END_MINUTE;
      return minutes >= start && minutes < end;
    }
  }

  const peakStart = config.PEAK_START_HOUR * 60 + config.PEAK_START_MINUTE;
  const peakEnd = config.PEAK_END_HOUR * 60 + config.PEAK_END_MINUTE;
  return minutes >= peakStart && minutes < peakEnd;
}

interface Props {
  date: string; // YYYY-MM-DD
  hourlyData: HourlyPowerRecord[];
  siteConfig: SiteSimulationConfig;
}

export function HistoryPowerDemandChart({
  date,
  hourlyData,
  siteConfig,
}: Props) {
  const chartData = useMemo(() => {
    // Filter hourly records for selected date (Taiwan time +08:00)
    const dayStart = new Date(`${date}T00:00:00+08:00`);
    const dayEnd = new Date(`${date}T23:59:59.999+08:00`);

    const dayRecords = hourlyData.filter((rec) => {
      const t = new Date(rec.date_timerange).getTime();
      return t >= dayStart.getTime() && t <= dayEnd.getTime();
    });

    // Build 24-hour slots
    const slots: Array<{
      time: string;
      hour: number;
      loadKW: number;
      slotDate: Date;
      isPeak: boolean;
    }> = [];

    for (let hour = 0; hour < 24; hour++) {
      // Find matching record for this hour
      const record = dayRecords.find((rec) => {
        const recDate = new Date(rec.date_timerange);
        const recHour = new Date(
          recDate.getTime() + 8 * 60 * 60 * 1000,
        ).getUTCHours();
        return recHour === hour;
      });

      const loadKW = record ? record["power(kwh)"] : 0;

      // Split each hour into four 15-minute slots
      for (const minute of [0, 15, 30, 45]) {
        const hh = String(hour).padStart(2, "0");
        const mm = String(minute).padStart(2, "0");
        const slotDate = new Date(`${date}T${hh}:${mm}:00+08:00`);

        slots.push({
          time: `${hh}:${mm}`,
          hour,
          loadKW,
          slotDate,
          isPeak: isPeakHour(slotDate, siteConfig),
        });
      }
    }

    // BESS simulation for the day
    const midnight = new Date(`${date}T00:00:00+08:00`);
    let bessState = createPersistedState(midnight.getTime(), siteConfig, 0);

    const simResults: Array<{
      chargePowerKW: number;
      dischargePowerKW: number;
      socKWh: number;
    }> = [];

    for (const slot of slots) {
      const slotStartMs = slot.slotDate.getTime();
      const slotEndMs = slotStartMs + 15 * 60 * 1000; // 15 minutes

      const simResult = processIntervalCrossingMidnight(
        bessState,
        slotStartMs,
        slotEndMs,
        slot.loadKW,
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

      simResults.push({
        chargePowerKW,
        dischargePowerKW,
        socKWh: bessState.socKWh,
      });
    }

    return slots.map((slot, i) => {
      const sim = simResults[i]!;
      const load = slot.loadKW;
      const gridSupplyKW = Math.max(0, load - sim.dischargePowerKW);
      const actualUsageKW = load + sim.chargePowerKW - sim.dischargePowerKW;

      return {
        time: slot.time,
        load: Math.round(load * 100) / 100,
        discharge: Math.round(sim.dischargePowerKW * 100) / 100,
        grid: Math.round(gridSupplyKW * 100) / 100,
        charge: Math.round(sim.chargePowerKW * 100) / 100,
        actualUsage: Math.round(actualUsageKW * 100) / 100,
        isPeak: slot.isPeak,
        soc: Math.round(sim.socKWh * 100) / 100,
        batteryPower:
          Math.round(
            (sim.chargePowerKW > 0
              ? sim.chargePowerKW
              : sim.dischargePowerKW) * 100,
          ) / 100,
      };
    });
  }, [date, hourlyData, siteConfig]);

  // Statistics — each slot is 0.25 hours, so kW × 0.25 = kWh
  const totalLoadKWh =
    Math.round(chartData.reduce((s, d) => s + d.load * 0.25, 0) * 100) / 100;
  const totalChargeKWh =
    Math.round(
      Math.min(
        chartData.reduce((s, d) => s + d.charge * 0.25, 0),
        siteConfig.BESS_CAPACITY_KWH,
      ) * 100,
    ) / 100;
  const totalDischargeKWh =
    Math.round(
      Math.min(
        chartData.reduce((s, d) => s + d.discharge * 0.25, 0),
        siteConfig.BESS_CAPACITY_KWH,
      ) * 100,
    ) / 100;
  const maxPower = Math.max(...chartData.map((d) => Math.max(d.load, d.actualUsage)));

  const yAxisMax = Math.ceil(
    Math.max(maxPower, siteConfig.CONTRACT_LIMIT_KW) * 1.1,
  );

  const weekday = ["日", "一", "二", "三", "四", "五", "六"][
    new Date(date).getDay()
  ];

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
      axisLabel: {
        ...axisStyle.axisLabel,
        fontSize: 10,
        interval: (_index: number, value: string) => value.endsWith(":00"),
      },
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
      {
        name: "用電負載",
        type: "line",
        data: chartData.map((d) => d.load),
        smooth: true,
        symbol: "none",
        lineStyle: { width: 2.5, color: CHART_COLORS.coral },
        itemStyle: { color: CHART_COLORS.coral },
      },
      {
        name: "電池充電",
        type: "line",
        data: chartData.map((d) => d.charge),
        smooth: true,
        symbol: "none",
        lineStyle: { width: 1.5, color: CHART_COLORS.amber },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: CHART_COLORS.amber + "99" },
            { offset: 1, color: CHART_COLORS.amber + "1A" },
          ]),
        },
        itemStyle: { color: CHART_COLORS.amber },
      },
      {
        name: "儲能放電",
        type: "line",
        data: chartData.map((d) => d.discharge),
        smooth: true,
        symbol: "none",
        lineStyle: { width: 1.5, color: CHART_COLORS.terracotta },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: CHART_COLORS.terracotta + "99" },
            { offset: 1, color: CHART_COLORS.terracotta + "1A" },
          ]),
        },
        itemStyle: { color: CHART_COLORS.terracotta },
      },
      {
        name: "儲能作用",
        type: "line",
        data: chartData.map((d) => d.batteryPower),
        smooth: true,
        symbol: "none",
        lineStyle: { width: 2, color: CHART_COLORS.plum },
        itemStyle: { color: CHART_COLORS.plum },
      },
    ],
  };

  // Add contract limit reference line
  (echartsOption.series[0] as { markLine?: object }).markLine = {
    silent: true,
    symbol: "none",
    animation: false,
    data: [
      {
        yAxis: siteConfig.CONTRACT_LIMIT_KW,
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
    <Card>
      <CardHeader className="px-3 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-white">
            每半小時用電負載 — {date} ({weekday})
          </CardTitle>
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
        <div className="mt-3 space-y-2">
          {/* Legend */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded shrink-0"
                style={{ backgroundColor: CHART_COLORS.slate }}
              />
              <span className="text-white/50">實際用電 (負載+充電)</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded shrink-0"
                style={{ backgroundColor: CHART_COLORS.coral }}
              />
              <span className="text-white/50">用電負載</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded shrink-0"
                style={{ backgroundColor: CHART_COLORS.terracotta }}
              />
              <span className="text-white/50">儲能放電</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded shrink-0"
                style={{ backgroundColor: CHART_COLORS.amber }}
              />
              <span className="text-white/50">儲能充電</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded shrink-0"
                style={{ backgroundColor: CHART_COLORS.plum }}
              />
              <span className="text-white/50">儲能作用</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-0 border-t-2 border-dashed shrink-0"
                style={{ borderColor: CHART_COLORS.contractLimit }}
              />
              <span className="text-white/50">
                契約容量 {siteConfig.CONTRACT_LIMIT_KW} kW
              </span>
            </div>
          </div>
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm pt-2 border-t border-[#3A2415]">
            <div className="text-white/50">
              總用電:{" "}
              <span className="text-white font-semibold">
                {totalLoadKWh} kWh
              </span>
            </div>
            <div className="text-white/50">
              充電:{" "}
              <span
                className="font-semibold"
                style={{ color: CHART_COLORS.amber }}
              >
                {totalChargeKWh} kWh
              </span>
            </div>
            <div className="text-white/50">
              放電:{" "}
              <span
                className="font-semibold"
                style={{ color: CHART_COLORS.terracotta }}
              >
                {totalDischargeKWh} kWh
              </span>
            </div>
          </div>

          {/* Hourly detail table */}
          <div className="pt-2 border-t border-[#3A2415]">
            <div className="overflow-x-auto max-h-64 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-[#2A1A0F]">
                  <tr className="border-b border-[#3A2415]">
                    <th className="text-left py-2 px-2 text-white/60 font-semibold">
                      時間
                    </th>
                    <th className="text-right py-2 px-2 text-white/60 font-semibold">
                      負載 kW
                    </th>
                    <th
                      className="text-right py-2 px-2 font-semibold"
                      style={{ color: CHART_COLORS.amber }}
                    >
                      充電 kW
                    </th>
                    <th
                      className="text-right py-2 px-2 font-semibold"
                      style={{ color: CHART_COLORS.terracotta }}
                    >
                      放電 kW
                    </th>
                    <th className="text-right py-2 px-2 text-white/60 font-semibold">
                      電網 kW
                    </th>
                    <th
                      className="text-right py-2 px-2 font-semibold"
                      style={{ color: CHART_COLORS.plum }}
                    >
                      SOC kWh
                    </th>
                    <th className="text-center py-2 px-2 text-white/60 font-semibold">
                      時段
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {chartData.map((d) => (
                    <tr
                      key={d.time}
                      className="border-b border-[#3A2415]/50 hover:bg-[#1E1208]"
                    >
                      <td className="py-1.5 px-2 text-white/70">{d.time}</td>
                      <td className="py-1.5 px-2 text-right text-white/70">
                        {d.load}
                      </td>
                      <td
                        className="py-1.5 px-2 text-right"
                        style={{ color: CHART_COLORS.amber }}
                      >
                        {d.charge > 0 ? d.charge : "-"}
                      </td>
                      <td
                        className="py-1.5 px-2 text-right"
                        style={{ color: CHART_COLORS.terracotta }}
                      >
                        {d.discharge > 0 ? d.discharge : "-"}
                      </td>
                      <td className="py-1.5 px-2 text-right text-white/70">
                        {d.grid}
                      </td>
                      <td
                        className="py-1.5 px-2 text-right"
                        style={{ color: CHART_COLORS.plum }}
                      >
                        {d.soc}
                      </td>
                      <td className="py-1.5 px-2 text-center">
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded ${
                            d.isPeak
                              ? "bg-red-100 text-red-700"
                              : "bg-[#241508] text-white/50"
                          }`}
                        >
                          {d.isPeak ? "尖峰" : "離峰"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
