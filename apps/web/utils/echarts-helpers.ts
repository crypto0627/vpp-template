/**
 * Shared ECharts utilities for consistent chart styling.
 */
import * as echarts from "echarts";
import { CHART_COLORS } from "@/constants/chart-colors";

/** Create a vertical linear gradient for area/bar fills */
export function areaGradient(
  color: string,
  topOpacity = 0.8,
  bottomOpacity = 0.1,
): echarts.graphic.LinearGradient {
  return new echarts.graphic.LinearGradient(0, 0, 0, 1, [
    { offset: 0, color: withOpacity(color, topOpacity) },
    { offset: 1, color: withOpacity(color, bottomOpacity) },
  ]);
}

/** Convert hex + opacity to rgba string */
function withOpacity(hex: string, opacity: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/** Shared light-mode axis style */
export const axisStyle = {
  axisLine: { lineStyle: { color: "#E8DDD3" } },
  axisTick: { lineStyle: { color: "#E8DDD3" } },
  axisLabel: { color: "#8B8178", fontSize: 11 },
  splitLine: { lineStyle: { color: "#E8DDD3", type: "dashed" as const } },
};

/** Shared dark-mode axis style */
export const darkAxisStyle = {
  axisLine: { lineStyle: { color: CHART_COLORS.dark.border } },
  axisTick: { lineStyle: { color: CHART_COLORS.dark.border } },
  axisLabel: { color: CHART_COLORS.dark.axisLabel, fontSize: 11 },
  splitLine: {
    lineStyle: {
      color: CHART_COLORS.dark.gridLine,
      type: "dashed" as const,
    },
  },
};

/** Shared tooltip style (light mode) */
export const tooltipStyle: echarts.TooltipComponentOption = {
  backgroundColor: "#FFFFFF",
  borderColor: "#E8DDD3",
  borderWidth: 1,
  textStyle: { color: CHART_COLORS.foreground, fontSize: 12 },
};

/** Shared tooltip style (dark mode) */
export const darkTooltipStyle: echarts.TooltipComponentOption = {
  backgroundColor: CHART_COLORS.dark.tooltipBg,
  borderColor: CHART_COLORS.dark.tooltipBorder,
  borderWidth: 1,
  textStyle: { color: CHART_COLORS.dark.text, fontSize: 12 },
};

/** Shared grid (chart padding) */
export const chartGrid = {
  top: 20,
  right: 30,
  bottom: 20,
  left: 20,
  containLabel: true,
};

/** NTD currency formatter for tooltip values */
export function ntdFormatter(value: number): string {
  return `$${value.toLocaleString()}`;
}
