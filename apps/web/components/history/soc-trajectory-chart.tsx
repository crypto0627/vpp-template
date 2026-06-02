"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ReactECharts from "echarts-for-react";
import { CHART_COLORS } from "@/constants/chart-colors";
import { axisStyle, tooltipStyle, areaGradient } from "@/utils/echarts-helpers";
import type { DailyRecord } from "@/types/report-type";

export function SocTrajectoryChart({
  dailyReport,
}: {
  dailyReport: DailyRecord[];
}) {
  if (dailyReport.length <= 1) return null;

  const dates = dailyReport.map((d) => d.date.slice(5));
  const capacity = dailyReport[0]?.capacityKWh || 0;

  const option = {
    tooltip: {
      ...tooltipStyle,
      trigger: "axis" as const,
      formatter(
        params: Array<{ seriesName: string; value: number; marker: string }>,
      ) {
        let html = `<div style="font-weight:600;margin-bottom:4px">${(params[0] as unknown as { axisValue: string })?.axisValue ?? ""}</div>`;
        for (const p of params) {
          html += `<div>${p.marker} ${p.seriesName}: ${p.value.toFixed(1)} kWh</div>`;
        }
        return html;
      },
    },
    legend: { textStyle: { fontSize: 13 } },
    grid: { top: 40, right: 20, bottom: 30, left: 20, containLabel: true },
    xAxis: {
      type: "category" as const,
      data: dates,
      boundaryGap: false,
      ...axisStyle,
    },
    yAxis: {
      type: "value" as const,
      name: "SOC (kWh)",
      nameTextStyle: { fontSize: 12, color: CHART_COLORS.muted },
      min: 0,
      max: capacity > 0 ? Math.ceil(capacity / 50) * 50 : undefined,
      ...axisStyle,
    },
    series: [
      // Capacity reference area (subtle background)
      ...(capacity > 0
        ? [
            {
              name: "可用容量",
              type: "line" as const,
              data: dailyReport.map(() => capacity),
              symbol: "none",
              lineStyle: {
                width: 1,
                color: CHART_COLORS.muted,
                type: "dashed" as const,
              },
              itemStyle: { color: CHART_COLORS.muted },
            },
          ]
        : []),
      {
        name: "起始 SOC",
        type: "line" as const,
        data: dailyReport.map((d) => d.startSOC),
        smooth: true,
        symbol: "circle",
        symbolSize: 4,
        lineStyle: { width: 2, color: CHART_COLORS.amber },
        itemStyle: { color: CHART_COLORS.amber },
      },
      {
        name: "結束 SOC",
        type: "line" as const,
        data: dailyReport.map((d) => d.endSOC),
        smooth: true,
        symbol: "circle",
        symbolSize: 4,
        lineStyle: { width: 2, color: CHART_COLORS.plum },
        areaStyle: { color: areaGradient(CHART_COLORS.plum, 0.3, 0.05) },
        itemStyle: { color: CHART_COLORS.plum },
      },
    ],
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">電池 SOC 軌跡</CardTitle>
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
