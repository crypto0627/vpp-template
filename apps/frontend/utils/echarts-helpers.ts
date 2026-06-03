import * as echarts from "echarts";
import { CHART_COLORS } from "@/constants/chart-colors";

export function areaGradient(color: string, topOpacity = 0.8, bottomOpacity = 0.1): echarts.graphic.LinearGradient {
  return new echarts.graphic.LinearGradient(0, 0, 0, 1, [
    { offset: 0, color: withOpacity(color, topOpacity) },
    { offset: 1, color: withOpacity(color, bottomOpacity) },
  ]);
}

function withOpacity(hex: string, opacity: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

export const axisStyle = {
  axisLine: { lineStyle: { color: "#3A2415" } },
  axisTick: { lineStyle: { color: "#3A2415" } },
  axisLabel: { color: "rgba(255,255,255,0.4)", fontSize: 11 },
  splitLine: { lineStyle: { color: "#3A2415", type: "dashed" as const } },
};

export const darkAxisStyle = {
  axisLine: { lineStyle: { color: CHART_COLORS.dark.border } },
  axisTick: { lineStyle: { color: CHART_COLORS.dark.border } },
  axisLabel: { color: CHART_COLORS.dark.axisLabel, fontSize: 11 },
  splitLine: { lineStyle: { color: CHART_COLORS.dark.gridLine, type: "dashed" as const } },
};

export const tooltipStyle: echarts.TooltipComponentOption = {
  backgroundColor: "#241508",
  borderColor: "#3A2415",
  borderWidth: 1,
  textStyle: { color: "#fff", fontSize: 12 },
};

export const darkTooltipStyle: echarts.TooltipComponentOption = {
  backgroundColor: CHART_COLORS.dark.tooltipBg,
  borderColor: CHART_COLORS.dark.tooltipBorder,
  borderWidth: 1,
  textStyle: { color: CHART_COLORS.dark.text, fontSize: 12 },
};

export const chartGrid = {
  top: 20, right: 30, bottom: 20, left: 20, containLabel: true,
};

export function ntdFormatter(value: number): string {
  return `$${value.toLocaleString()}`;
}
