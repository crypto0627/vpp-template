"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ReactECharts from "echarts-for-react";
import { CHART_COLORS } from "@/constants/chart-colors";
import { axisStyle, tooltipStyle, ntdFormatter } from "@/utils/echarts-helpers";
import type { DailyRecord } from "@/types/report-type";

export function ReportTrendChart({
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
          html += `<div>${p.marker} ${p.seriesName}: ${ntdFormatter(p.value)}</div>`;
        }
        return html;
      },
    },
    legend: { textStyle: { fontSize: 14 } },
    grid: { top: 30, right: 20, bottom: 30, left: 20, containLabel: true },
    xAxis: {
      type: "category" as const,
      data: dates,
      boundaryGap: false,
      ...axisStyle,
      axisLabel: { ...axisStyle.axisLabel, fontSize: 13 },
    },
    yAxis: {
      type: "value" as const,
      ...axisStyle,
      axisLabel: {
        ...axisStyle.axisLabel,
        fontSize: 13,
        formatter: (v: number) => `$${v}`,
      },
    },
    series: [
      {
        name: "無儲能",
        type: "line" as const,
        data: dailyReport.map((d) => d.withoutBESS),
        smooth: true,
        symbol: "none",
        lineStyle: { width: 2, color: CHART_COLORS.warmDark },
        itemStyle: { color: CHART_COLORS.warmDark },
      },
      {
        name: "有儲能",
        type: "line" as const,
        data: dailyReport.map((d) => d.withBESS),
        smooth: true,
        symbol: "none",
        lineStyle: { width: 2, color: CHART_COLORS.coral },
        itemStyle: { color: CHART_COLORS.coral },
      },
      {
        name: "每日節費",
        type: "line" as const,
        data: dailyReport.map((d) => d.savings),
        smooth: true,
        symbol: "none",
        lineStyle: {
          width: 2,
          color: CHART_COLORS.sage,
          type: "dashed" as const,
        },
        itemStyle: { color: CHART_COLORS.sage },
      },
    ],
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">每日電費趨勢</CardTitle>
      </CardHeader>
      <CardContent>
        <ReactECharts
          option={option}
          style={{ height: 240 }}
          notMerge
          lazyUpdate
        />
      </CardContent>
    </Card>
  );
}
