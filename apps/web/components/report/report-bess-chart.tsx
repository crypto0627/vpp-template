"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ReactECharts from "echarts-for-react";
import * as echarts from "echarts";
import { CHART_COLORS } from "@/constants/chart-colors";
import { axisStyle, tooltipStyle } from "@/utils/echarts-helpers";
import type { DailyRecord } from "@/types/report-type";

export function ReportBESSChart({
  dailyReport,
}: {
  dailyReport: DailyRecord[];
}) {
  if (dailyReport.length <= 1) return null;

  const dates = dailyReport.map((d) => d.date.slice(5));

  const option = {
    tooltip: {
      ...tooltipStyle,
      trigger: "axis",
      formatter(
        params: Array<{
          seriesName: string;
          value: number;
          marker: string;
        }>,
      ) {
        let html = `<div style="font-weight:600;margin-bottom:4px">${(params[0] as unknown as { axisValue: string })?.axisValue ?? ""}</div>`;
        for (const p of params) {
          html += `<div>${p.marker} ${p.seriesName}: ${Math.abs(p.value).toFixed(2)}</div>`;
        }
        return html;
      },
    },
    legend: {
      textStyle: { fontSize: 13 },
      icon: "rect",
      data: [
        { name: "充電 (kWh)", itemStyle: { color: CHART_COLORS.amber } },
        { name: "放電 (kWh)", itemStyle: { color: CHART_COLORS.terracotta } },
        { name: "結束時 SOC (kWh)", itemStyle: { color: CHART_COLORS.plum } },
      ],
    },
    grid: { top: 50, right: 60, bottom: 30, left: 60, containLabel: true },
    xAxis: {
      type: "category",
      data: dates,
      ...axisStyle,
      axisLabel: { ...axisStyle.axisLabel, fontSize: 12 },
    },
    yAxis: [
      {
        type: "value",
        name: "充放電 (kWh)",
        nameTextStyle: { fontSize: 13, color: CHART_COLORS.foreground },
        ...axisStyle,
        axisLabel: { ...axisStyle.axisLabel, fontSize: 12 },
      },
      {
        type: "value",
        name: "SOC (kWh)",
        nameTextStyle: { fontSize: 13, color: CHART_COLORS.foreground },
        min: 0,
        max: 370,
        ...axisStyle,
        axisLabel: { ...axisStyle.axisLabel, fontSize: 12 },
      },
    ],
    series: [
      {
        name: "充電 (kWh)",
        type: "bar",
        yAxisIndex: 0,
        data: dailyReport.map((d) => d.chargedKWh),
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: CHART_COLORS.amber },
            { offset: 1, color: CHART_COLORS.amber + "4D" },
          ]),
          borderRadius: [4, 4, 0, 0],
        },
      },
      {
        name: "放電 (kWh)",
        type: "bar",
        yAxisIndex: 0,
        data: dailyReport.map((d) => -d.dischargedKWh),
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 1, 0, 0, [
            { offset: 0, color: CHART_COLORS.terracotta },
            { offset: 1, color: CHART_COLORS.terracotta + "4D" },
          ]),
          borderRadius: [0, 0, 4, 4],
        },
      },
      {
        name: "結束時 SOC (kWh)",
        type: "line",
        yAxisIndex: 1,
        data: dailyReport.map((d) => d.endSOC),
        smooth: true,
        symbol: "none",
        lineStyle: { width: 2, color: CHART_COLORS.plum },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: CHART_COLORS.plum + "80" },
            { offset: 1, color: CHART_COLORS.plum + "1A" },
          ]),
        },
        itemStyle: { color: CHART_COLORS.plum },
      },
    ],
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">儲能充放電趨勢</CardTitle>
      </CardHeader>
      <CardContent>
        <ReactECharts
          option={option}
          style={{ height: 320 }}
          notMerge
          lazyUpdate
        />

        <div className="mt-4 pt-3 border-t border-border space-y-2">
          <div className="flex items-start gap-2 text-sm">
            <span
              className="font-semibold"
              style={{ color: CHART_COLORS.amber }}
            >
              ↑ 充電：
            </span>
            <span style={{ color: CHART_COLORS.amber }}>
              離峰時段（00:00）充電補滿電池，充電量取決於前一天剩餘電量
            </span>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <span
              className="font-semibold"
              style={{ color: CHART_COLORS.terracotta }}
            >
              ↓ 放電：
            </span>
            <span style={{ color: CHART_COLORS.terracotta }}>
              尖峰時段放電替代尖峰用電，放電量取決於當天尖峰負載
            </span>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <span
              className="font-semibold"
              style={{ color: CHART_COLORS.plum }}
            >
              ━ SOC：
            </span>
            <span style={{ color: CHART_COLORS.plum }}>
              電池電量狀態（0-370 kWh），區域顯示每日結束時的剩餘電量
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
