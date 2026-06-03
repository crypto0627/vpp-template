import { ReportData } from "@/types/report-type";

export function exportReportCSV(report: ReportData, startDate: string, endDate: string) {
  const { summary: s, dailyReport } = report;

  const totalCharged    = dailyReport.reduce((sum, d) => sum + d.chargedKWh, 0);
  const totalDischarged = dailyReport.reduce((sum, d) => sum + d.dischargedKWh, 0);
  const peakOffsetRate  = s.totalPeakKWh > 0
    ? Math.round((totalDischarged / s.totalPeakKWh) * 10000) / 100
    : 0;

  const hasDR   = s.drTotalCost > 0;
  const hasSReg = s.sRegRevenue > 0;

  const rows: (string | number)[][] = [];

  // ── 標題 ──────────────────────────────────────────────────────────────
  rows.push(["儲能效益分析報告"]);
  rows.push(["時間範圍", `${startDate} ~ ${endDate}`]);
  rows.push([]);

  // ── 摘要 ──────────────────────────────────────────────────────────────
  rows.push(["【期間總計】"]);
  rows.push(["總用電量 (kWh)",    s.totalKWh]);
  rows.push(["尖峰用電 (kWh)",    s.totalPeakKWh]);
  rows.push(["離峰用電 (kWh)",    s.totalOffPeakKWh]);
  rows.push(["儲能充電量 (kWh)",  Math.round(totalCharged    * 100) / 100]);
  rows.push(["儲能放電量 (kWh)",  Math.round(totalDischarged * 100) / 100]);
  rows.push(["尖峰抵銷率 (%)",    peakOffsetRate]);
  rows.push([]);
  rows.push(["無儲能花費 (NT$)",  s.costWithoutBESS]);
  rows.push(["有儲能花費 (NT$)",  s.costWithBESS]);
  rows.push(["節省費用 (NT$)",    s.savings]);
  if (hasDR)   rows.push(["需量反應扣減 (NT$)", s.drTotalCost, `共 ${s.drDays} 天`]);
  if (hasSReg) rows.push(["sReg 輔助服務收益 (NT$)", s.sRegRevenue]);
  rows.push(["最終電費 (NT$)",    s.costWithBESSFinal]);
  rows.push([]);

  // ── 逐日明細表頭 ──────────────────────────────────────────────────────
  rows.push([
    "日期",
    "總用電 (kWh)",
    "尖峰用電 (kWh)",
    "離峰用電 (kWh)",
    "儲能充電量 (kWh)",
    "儲能放電量 (kWh)",
    "尖峰抵銷率 (%)",
    "無儲能花費 (NT$)",
    "有儲能花費 (NT$)",
    "節省費用 (NT$)",
  ]);

  // ── 逐日明細 ──────────────────────────────────────────────────────────
  for (const d of dailyReport) {
    const dayOffsetRate = d.peakKWh > 0
      ? Math.round((d.dischargedKWh / d.peakKWh) * 10000) / 100
      : 0;
    rows.push([
      d.date,
      Math.round((d.peakKWh + d.offPeakKWh) * 100) / 100,
      d.peakKWh,
      d.offPeakKWh,
      d.chargedKWh,
      d.dischargedKWh,
      dayOffsetRate,
      d.withoutBESS,
      d.withBESS,
      d.savings,
    ]);
  }

  // ── 合計列 ────────────────────────────────────────────────────────────
  rows.push([
    "合計",
    s.totalKWh,
    s.totalPeakKWh,
    s.totalOffPeakKWh,
    Math.round(totalCharged    * 100) / 100,
    Math.round(totalDischarged * 100) / 100,
    peakOffsetRate,
    s.costWithoutBESS,
    s.costWithBESS,
    s.savings,
  ]);

  // ── 產生檔案 ──────────────────────────────────────────────────────────
  const csv = rows
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `儲能效益報告_${startDate}_${endDate}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
