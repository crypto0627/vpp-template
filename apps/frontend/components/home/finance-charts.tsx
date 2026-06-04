"use client";

import { useEffect, useRef } from "react";
import * as echarts from "echarts";

// ── Shared chart item type ────────────────────────────────────────────────────
export interface DailyChartItem {
  date: string;
  withoutBESS: number;
  withBESS: number;
  savings: number;
  drCost?: number;
  sRegRevenue?: number;
}

// ── Shared chart helpers ──────────────────────────────────────────────────────
const TOOLTIP_STYLE = {
  backgroundColor: "#2A1A0F",
  borderColor: "#3A2415",
  textStyle: { color: "#fff", fontSize: 11 },
  extraCssText: "border-radius:8px;padding:8px 12px;",
};

const AXIS_LABEL = { color: "rgba(255,255,255,0.4)", fontSize: 9 };
const SPLIT_LINE = { lineStyle: { color: "#3A2415" } };

const DOW_ZH = ["日", "一", "二", "三", "四", "五", "六"] as const;
function formatWithDow(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  return `${dateStr.slice(5).replace("-", "/")}(${DOW_ZH[d.getDay()]})`;
}

function buildXAxis(dates: string[], len: number, formatFn?: (d: string) => string) {
  return {
    type: "category" as const,
    data: dates.map((d) => formatFn ? formatFn(d) : d.slice(5).replace("-", "/")),
    axisLabel: { ...AXIS_LABEL, rotate: len > 14 ? -30 : 0, interval: len > 20 ? Math.floor(len / 10) : 0 },
    axisLine: { lineStyle: { color: "#3A2415" } },
    axisTick: { show: false },
  };
}

function buildYAxis(formatter?: (v: number) => string) {
  return {
    type: "value" as const,
    axisLabel: { ...AXIS_LABEL, formatter: formatter ?? ((v: number) => `$${Math.round(v / 1000)}K`) },
    splitLine: SPLIT_LINE,
    axisLine: { show: false },
  };
}

type TooltipParam = { axisValue?: string | number; marker?: string; seriesName?: string; value?: unknown };

function tooltipFmt(params: TooltipParam | TooltipParam[]) {
  const parts = Array.isArray(params) ? params : [params];
  const date = String(parts[0]?.axisValue ?? "");
  let html = `<div style="margin-bottom:4px;font-size:10px;color:rgba(255,255,255,0.5)">${date}</div>`;
  parts.forEach((p) => {
    const val = typeof p.value === "number" ? p.value : 0;
    html += `<div style="display:flex;align-items:center;gap:6px">${p.marker}<span>${p.seriesName}</span><b>NT$${Math.round(val).toLocaleString("zh-TW")}</b></div>`;
  });
  return html;
}

// ── Wrapper ───────────────────────────────────────────────────────────────────
export function ChartBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#1E1208] rounded-xl p-3 border border-[#3A2415]">
      <p className="text-xs text-white/40 mb-2 font-medium">{title}</p>
      {children}
    </div>
  );
}

export function NoDataMsg() {
  return (
    <div className="flex items-center justify-center h-14 text-xs text-white/25">
      該日期區間內無數據
    </div>
  );
}

// ── Chart 1: 無儲能 vs 有儲能電費 ────────────────────────────────────────────
export function CostComparisonChart({ dailyReport, height = 190 }: { dailyReport: DailyChartItem[]; height?: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || dailyReport.length === 0) return;
    const chart = echarts.init(el, null, { renderer: "svg" });
    chart.setOption({
      backgroundColor: "transparent",
      tooltip: { trigger: "axis", ...TOOLTIP_STYLE, formatter: tooltipFmt },
      grid: { top: 8, bottom: dailyReport.length > 14 ? 40 : 24, left: 0, right: 4, containLabel: true },
      xAxis: buildXAxis(dailyReport.map((d) => d.date), dailyReport.length),
      yAxis: buildYAxis(),
      series: [
        {
          name: "有儲能費用",
          type: "line",
          data: dailyReport.map((d) => d.withBESS),
          smooth: true,
          symbol: "circle",
          lineStyle: { color: "#7D9B7E", width: 2 },
          itemStyle: { color: "#7D9B7E", borderColor: "#fff", borderWidth: 1.5 },
        },
      ],
    });
    const onResize = () => chart.resize();
    window.addEventListener("resize", onResize);
    return () => { window.removeEventListener("resize", onResize); chart.dispose(); };
  }, [dailyReport]);

  return <ChartBlock title="有儲能電費趨勢"><div ref={ref} style={{ height }} /></ChartBlock>;
}

// ── Chart 2: 需量反應收益（DR）────────────────────────────────────────────────
export function DRRevenueChart({ dailyReport, height = 160 }: { dailyReport: DailyChartItem[]; height?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const hasData = dailyReport.some((d) => (d.drCost ?? 0) > 0);

  useEffect(() => {
    const el = ref.current;
    if (!el || !hasData) return;
    // Only show dates that actually have DR revenue (DR season: 5/1–10/31)
    const drData = dailyReport.filter((d) => (d.drCost ?? 0) > 0);
    const chart = echarts.init(el, null, { renderer: "svg" });
    chart.setOption({
      backgroundColor: "transparent",
      tooltip: { trigger: "axis", ...TOOLTIP_STYLE, formatter: tooltipFmt },
      grid: { top: 8, bottom: drData.length > 14 ? 40 : 24, left: 0, right: 4, containLabel: true },
      xAxis: buildXAxis(drData.map((d) => d.date), drData.length, formatWithDow),
      yAxis: buildYAxis(),
      series: [{
        name: "需量反應收益",
        type: "bar",
        data: drData.map((d) => d.drCost ?? 0),
        barMaxWidth: 24,
        itemStyle: { color: "#E8883E", borderRadius: [3, 3, 0, 0] },
      }],
    });
    const onResize = () => chart.resize();
    window.addEventListener("resize", onResize);
    return () => { window.removeEventListener("resize", onResize); chart.dispose(); };
  }, [dailyReport, hasData]);

  return (
    <ChartBlock title="需量反應收益（DR）">
      {hasData ? <div ref={ref} style={{ height }} /> : <NoDataMsg />}
    </ChartBlock>
  );
}

// ── Chart 3: sReg 電力輔助服務收益 ───────────────────────────────────────────
export function SRegRevenueChart({ dailyReport, height = 160 }: { dailyReport: DailyChartItem[]; height?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const hasData = dailyReport.some((d) => (d.sRegRevenue ?? 0) > 0);

  useEffect(() => {
    const el = ref.current;
    if (!el || !hasData) return;
    const sRegData = dailyReport.filter((d) => (d.sRegRevenue ?? 0) > 0);
    const chart = echarts.init(el, null, { renderer: "svg" });
    chart.setOption({
      backgroundColor: "transparent",
      tooltip: { trigger: "axis", ...TOOLTIP_STYLE, formatter: tooltipFmt },
      grid: { top: 8, bottom: sRegData.length > 14 ? 40 : 24, left: 0, right: 4, containLabel: true },
      xAxis: buildXAxis(sRegData.map((d) => d.date), sRegData.length, formatWithDow),
      yAxis: buildYAxis(),
      series: [{
        name: "sReg輔助服務收益",
        type: "bar",
        data: sRegData.map((d) => d.sRegRevenue ?? 0),
        barMaxWidth: 24,
        itemStyle: { color: "#4A9EDB", borderRadius: [3, 3, 0, 0] },
      }],
    });
    const onResize = () => chart.resize();
    window.addEventListener("resize", onResize);
    return () => { window.removeEventListener("resize", onResize); chart.dispose(); };
  }, [dailyReport, hasData]);

  return (
    <ChartBlock title="sReg 電力輔助服務收益">
      {hasData ? <div ref={ref} style={{ height }} /> : <NoDataMsg />}
    </ChartBlock>
  );
}

// ── MetricCard ────────────────────────────────────────────────────────────────
export function MetricCard({ label, value, unit, highlight, icon }: {
  label: string; value: string; unit: string; highlight?: boolean; icon?: React.ReactNode;
}) {
  return (
    <div className={`group min-w-0 overflow-hidden rounded-xl p-3 xs:p-4 border transition-all duration-200 cursor-default ${
      highlight
        ? "bg-[#3A2415] border-[#E8883E]/30 hover:border-[#E8883E]/70 hover:bg-[#46291A]"
        : "bg-[#1E1208] border-[#3A2415] hover:border-[#E8883E]/50 hover:bg-[#2A1A0F]"
    }`}>
      <div className="flex items-center gap-1 xs:gap-1.5 mb-2">
        {icon}
        <p className="text-xs xs:text-sm text-white/50 truncate group-hover:text-white transition-colors duration-200">{label}</p>
      </div>
      <p className={`text-base xs:text-xl font-bold leading-tight break-all transition-colors duration-200 ${
        highlight ? "text-[#E8883E] group-hover:text-[#FFAA66]" : "text-white group-hover:text-[#FFAA66]"
      }`}>{value}</p>
      <p className="text-xs xs:text-sm text-white/40 mt-1 truncate group-hover:text-white/70 transition-colors duration-200">{unit}</p>
    </div>
  );
}
