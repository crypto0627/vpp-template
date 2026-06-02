"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ReactECharts from "echarts-for-react";
import { CHART_COLORS } from "@/constants/chart-colors";
import { axisStyle, tooltipStyle } from "@/utils/echarts-helpers";
import type { DailyRecord } from "@/types/report-type";

export function PeakDemandChart({
  dailyReport,
  contractLimitKW,
}: {
  dailyReport: DailyRecord[];
  contractLimitKW: number;
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
          if (p.seriesName === "契約容量") {
            html += `<div>${p.marker} ${p.seriesName}: ${p.value} kW</div>`;
          } else {
            html += `<div>${p.marker} ${p.seriesName}: ${p.value.toLocaleString()} kWh</div>`;
          }
        }
        return html;
      },
    },
    legend: { textStyle: { fontSize: 13 } },
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
    },
    series: [
      {
        name: "尖峰用電",
        type: "bar" as const,
        data: dailyReport.map((d) => d.peakKWh),
        itemStyle: {
          color: (params: { value: number }) => {
            // Highlight if peak usage exceeds a threshold (e.g. half of contract * peak hours)
            return params.value > contractLimitKW * 3
              ? CHART_COLORS.contractLimit
              : CHART_COLORS.coral;
          },
          borderRadius: [4, 4, 0, 0],
        },
      },
      {
        name: "契約容量",
        type: "line" as const,
        data: dailyReport.map(() => contractLimitKW),
        symbol: "none",
        lineStyle: {
          width: 2,
          color: CHART_COLORS.contractLimit,
          type: "dashed" as const,
        },
        itemStyle: { color: CHART_COLORS.contractLimit },
      },
    ],
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">尖峰用電監控</CardTitle>
          <span className="text-sm text-gray-500">
            契約容量 {contractLimitKW} kW
          </span>
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
