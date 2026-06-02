"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ReactECharts from "echarts-for-react";
import { CHART_COLORS } from "@/constants/chart-colors";
import { axisStyle, tooltipStyle, ntdFormatter } from "@/utils/echarts-helpers";
import type { Summary } from "@/types/report-type";

export function ReportCostChart({ summary }: { summary: Summary }) {
  const option = {
    tooltip: {
      ...tooltipStyle,
      trigger: "axis",
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
      type: "category",
      data: ["無儲能", "有儲能"],
      ...axisStyle,
      axisLabel: { ...axisStyle.axisLabel, fontSize: 15 },
    },
    yAxis: {
      type: "value",
      ...axisStyle,
      axisLabel: {
        ...axisStyle.axisLabel,
        fontSize: 13,
        formatter: (v: number) => `$${v.toLocaleString()}`,
      },
    },
    series: [
      {
        name: "尖峰",
        type: "bar",
        stack: "c",
        data: [summary.withoutPeakCost, summary.withPeakCost],
        itemStyle: { color: CHART_COLORS.peak },
        barCategoryGap: "30%",
      },
      {
        name: "離峰",
        type: "bar",
        stack: "c",
        data: [summary.withoutOffpeakCost, summary.withOffpeakCost],
        itemStyle: { color: CHART_COLORS.sand },
        barCategoryGap: "30%",
      },
    ],
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">電費比較</CardTitle>
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
