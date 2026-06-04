"use client";

import { memo } from "react";
import ReactECharts from "echarts-for-react";
import * as echarts from "echarts";
import { CHART_COLORS, CHART_COLORS_ARRAY } from "@/constants/chart-colors";
import { darkTooltipStyle } from "@/utils/echarts-helpers";
import type { ChartConfig } from "@/types/ai-types";

interface ChartRendererProps {
  config: ChartConfig;
}

const darkAxis = {
  axisLine: { lineStyle: { color: CHART_COLORS.dark.border } },
  axisTick: { lineStyle: { color: CHART_COLORS.dark.border } },
  axisLabel: { color: CHART_COLORS.dark.axisLabel, fontSize: 11 },
  splitLine: {
    lineStyle: { color: CHART_COLORS.dark.gridLine, type: "dashed" as const },
  },
};

function buildOption(base: object) {
  return {
    grid: { top: 20, right: 30, bottom: 20, left: 10, containLabel: true },
    ...base,
  };
}

export const ChartRenderer = memo(function ChartRenderer({
  config,
}: ChartRendererProps) {
  const { type, title, data } = config;

  if (!data || data.length === 0) {
    return (
      <div className="my-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
        圖表數據為空
      </div>
    );
  }

  let option: object;

  switch (type) {
    case "power-demand":
      option = buildOption({
        tooltip: { ...darkTooltipStyle, trigger: "axis" },
        xAxis: { type: "category", data: data.map((d) => d.time), ...darkAxis },
        yAxis: { type: "value", ...darkAxis },
        series: [
          {
            type: "line",
            data: data.map((d) => d.load),
            smooth: true,
            symbol: "none",
            lineStyle: { color: CHART_COLORS.coral },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: CHART_COLORS.coral + "CC" },
                { offset: 1, color: CHART_COLORS.coral + "1A" },
              ]),
            },
            itemStyle: { color: CHART_COLORS.coral },
          },
        ],
      });
      break;

    case "cost-trend":
      option = buildOption({
        tooltip: { ...darkTooltipStyle, trigger: "axis" },
        legend: { textStyle: { fontSize: 11, color: CHART_COLORS.dark.text } },
        xAxis: { type: "category", data: data.map((d) => d.date), boundaryGap: false, ...darkAxis },
        yAxis: { type: "value", ...darkAxis },
        series: [
          {
            name: "無儲能", type: "line", data: data.map((d) => d["無儲能"]),
            smooth: true, symbol: "none",
            lineStyle: { width: 2, color: CHART_COLORS.warmDark },
            itemStyle: { color: CHART_COLORS.warmDark },
          },
          {
            name: "有儲能", type: "line", data: data.map((d) => d["有儲能"]),
            smooth: true, symbol: "none",
            lineStyle: { width: 2, color: CHART_COLORS.coral },
            itemStyle: { color: CHART_COLORS.coral },
          },
          {
            name: "省費", type: "line", data: data.map((d) => d["省費"]),
            smooth: true, symbol: "none",
            lineStyle: { width: 2, color: CHART_COLORS.sage, type: "dashed" },
            itemStyle: { color: CHART_COLORS.sage },
          },
        ],
      });
      break;

    case "cost-comparison":
      option = buildOption({
        tooltip: { ...darkTooltipStyle, trigger: "axis" },
        legend: { textStyle: { fontSize: 11, color: CHART_COLORS.dark.text } },
        xAxis: { type: "category", data: data.map((d) => d.name), ...darkAxis },
        yAxis: { type: "value", ...darkAxis },
        series: [
          {
            name: "尖峰", type: "bar", stack: "cost",
            data: data.map((d) => d["尖峰"]),
            itemStyle: { color: CHART_COLORS.peak, borderRadius: [4, 4, 0, 0] },
          },
          {
            name: "離峰", type: "bar", stack: "cost",
            data: data.map((d) => d["離峰"]),
            itemStyle: { color: CHART_COLORS.sand, borderRadius: [0, 0, 4, 4] },
          },
        ],
      });
      break;

    case "bess-charge-discharge":
      option = buildOption({
        tooltip: { ...darkTooltipStyle, trigger: "axis" },
        legend: { textStyle: { fontSize: 11, color: CHART_COLORS.dark.text } },
        xAxis: { type: "category", data: data.map((d) => d.date), ...darkAxis },
        yAxis: [{ type: "value", ...darkAxis }, { type: "value", ...darkAxis }],
        series: [
          {
            name: "充電", type: "bar", yAxisIndex: 0, data: data.map((d) => d["充電"]),
            itemStyle: { color: CHART_COLORS.amber, borderRadius: [4, 4, 0, 0] },
          },
          {
            name: "放電", type: "bar", yAxisIndex: 0, data: data.map((d) => d["放電"]),
            itemStyle: { color: CHART_COLORS.terracotta, borderRadius: [0, 0, 4, 4] },
          },
          {
            name: "SOC", type: "line", yAxisIndex: 1, data: data.map((d) => d["SOC"]),
            smooth: true, symbol: "none",
            lineStyle: { color: CHART_COLORS.plum },
            areaStyle: { color: CHART_COLORS.plum + "33" },
            itemStyle: { color: CHART_COLORS.plum },
          },
        ],
      });
      break;

    case "battery-soc":
      option = buildOption({
        tooltip: { ...darkTooltipStyle, trigger: "axis" },
        xAxis: { type: "category", data: data.map((d) => d.time), ...darkAxis },
        yAxis: { type: "value", ...darkAxis },
        series: [
          {
            type: "line", data: data.map((d) => d.soc),
            smooth: true, symbol: "none",
            lineStyle: { width: 2, color: CHART_COLORS.sage },
            itemStyle: { color: CHART_COLORS.sage },
          },
        ],
      });
      break;

    case "yearly-comparison": {
      const years = data.length > 0
        ? Object.keys(data[0]!).filter((k) => k !== "month")
        : [];
      option = buildOption({
        tooltip: { ...darkTooltipStyle, trigger: "axis" },
        legend: { textStyle: { fontSize: 11, color: CHART_COLORS.dark.text } },
        xAxis: { type: "category", data: data.map((d) => d.month), boundaryGap: false, ...darkAxis },
        yAxis: { type: "value", ...darkAxis },
        series: years.map((year, i) => ({
          name: year, type: "line", data: data.map((d) => d[year]),
          smooth: true, symbol: "circle", symbolSize: 6,
          lineStyle: { width: 2, color: CHART_COLORS_ARRAY[i % CHART_COLORS_ARRAY.length] },
          itemStyle: { color: CHART_COLORS_ARRAY[i % CHART_COLORS_ARRAY.length] },
        })),
      });
      break;
    }

    default:
      return (
        <div className="my-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 text-xs">
          不支援的圖表類型: {type}
        </div>
      );
  }

  return (
    <div className="my-3 rounded-lg border border-[#DA7756]/30 bg-[#262420]/40 p-3 shadow-md">
      {title && (
        <h4 className="text-xs font-semibold text-[#E8DDD3] mb-2">{title}</h4>
      )}
      <ReactECharts option={option} style={{ height: 240 }} notMerge lazyUpdate />
    </div>
  );
});
