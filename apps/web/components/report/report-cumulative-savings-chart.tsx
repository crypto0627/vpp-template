"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ReactECharts from "echarts-for-react";
import { CHART_COLORS } from "@/constants/chart-colors";
import {
  axisStyle,
  tooltipStyle,
  areaGradient,
  ntdFormatter,
} from "@/utils/echarts-helpers";
import type { DailyRecord } from "@/types/report-type";

export function ReportCumulativeSavingsChart({
  dailyReport,
}: {
  dailyReport: DailyRecord[];
}) {
  if (dailyReport.length <= 1) return null;

  const dates = dailyReport.map((d) => d.date.slice(5));

  // Compute cumulative savings
  let cumulative = 0;
  const cumulativeData = dailyReport.map((d) => {
    cumulative += d.savings;
    return Math.round(cumulative);
  });

  const option = {
    tooltip: {
      ...tooltipStyle,
      trigger: "axis" as const,
      formatter(
        params: Array<{ seriesName: string; value: number; marker: string }>,
      ) {
        const p = params[0]!;
        const axisValue = (p as unknown as { axisValue: string }).axisValue;
        return `<div style="font-weight:600;margin-bottom:4px">${axisValue}</div><div>${p.marker} 累積節費: ${ntdFormatter(p.value)}</div>`;
      },
    },
    grid: { top: 30, right: 20, bottom: 30, left: 20, containLabel: true },
    xAxis: {
      type: "category" as const,
      data: dates,
      boundaryGap: false,
      ...axisStyle,
    },
    yAxis: {
      type: "value" as const,
      ...axisStyle,
      axisLabel: {
        ...axisStyle.axisLabel,
        formatter: (v: number) => `$${v.toLocaleString()}`,
      },
    },
    series: [
      {
        name: "累積節費",
        type: "line" as const,
        data: cumulativeData,
        smooth: true,
        symbol: "none",
        lineStyle: { width: 3, color: CHART_COLORS.sage },
        areaStyle: { color: areaGradient(CHART_COLORS.sage, 0.4, 0.05) },
        itemStyle: { color: CHART_COLORS.sage },
      },
    ],
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">累積節費曲線</CardTitle>
          <span
            className="text-sm font-semibold"
            style={{ color: CHART_COLORS.sage }}
          >
            {ntdFormatter(cumulative)}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <ReactECharts
          option={option}
          style={{ height: 260 }}
          notMerge
          lazyUpdate
        />
      </CardContent>
    </Card>
  );
}
