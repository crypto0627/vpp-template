"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ReactECharts from "echarts-for-react";
import * as echarts from "echarts";
import { CHART_COLORS } from "@/constants/chart-colors";
import { axisStyle, tooltipStyle } from "@/utils/echarts-helpers";
import type { DailyRecord } from "@/types/report-type";

export function ChargeDischargeChart({
  dailyReport,
}: {
  dailyReport: DailyRecord[];
}) {
  if (dailyReport.length <= 1) return null;

  const dates = dailyReport.map((d) => d.date.slice(5));

  const option = {
    tooltip: {
      ...tooltipStyle,
      trigger: "axis" as const,
      formatter(
        params: Array<{ seriesName: string; value: number; marker: string }>,
      ) {
        let html = `<div style="font-weight:600;margin-bottom:4px">${(params[0] as unknown as { axisValue: string })?.axisValue ?? ""}</div>`;
        for (const p of params) {
          html += `<div>${p.marker} ${p.seriesName}: ${Math.abs(p.value).toFixed(1)} kWh</div>`;
        }
        return html;
      },
    },
    legend: {
      textStyle: { fontSize: 13 },
      data: ["充電", "放電"],
    },
    grid: { top: 40, right: 20, bottom: 30, left: 20, containLabel: true },
    xAxis: {
      type: "category" as const,
      data: dates,
      ...axisStyle,
    },
    yAxis: {
      type: "value" as const,
      name: "kWh",
      nameTextStyle: { fontSize: 12, color: CHART_COLORS.muted },
      ...axisStyle,
      axisLabel: {
        ...axisStyle.axisLabel,
        formatter: (v: number) => `${Math.abs(v)}`,
      },
    },
    series: [
      {
        name: "充電",
        type: "bar" as const,
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
        name: "放電",
        type: "bar" as const,
        data: dailyReport.map((d) => -d.dischargedKWh),
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 1, 0, 0, [
            { offset: 0, color: CHART_COLORS.terracotta },
            { offset: 1, color: CHART_COLORS.terracotta + "4D" },
          ]),
          borderRadius: [0, 0, 4, 4],
        },
      },
    ],
  };

  // Calculate round-trip efficiency
  const totalCharged = dailyReport.reduce((s, d) => s + d.chargedKWh, 0);
  const totalDischarged = dailyReport.reduce((s, d) => s + d.dischargedKWh, 0);
  const efficiency =
    totalCharged > 0
      ? Math.round((totalDischarged / totalCharged) * 10000) / 100
      : 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">充放電量對照</CardTitle>
          <span className="text-sm text-gray-500">往返效率 {efficiency}%</span>
        </div>
      </CardHeader>
      <CardContent>
        <ReactECharts
          option={option}
          style={{ height: 280 }}
          notMerge
          lazyUpdate
        />
      </CardContent>
    </Card>
  );
}
