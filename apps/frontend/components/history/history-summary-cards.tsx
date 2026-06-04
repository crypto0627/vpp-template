"use client";

import { useState } from "react";
import { ReportSummaryCard } from "@/components/report/report-summary-card";
import type { Summary, DailyRecord } from "@/types/report-type";
import { isNationalHolidayTW } from "@/constants/taiwan-holidays";

interface Props {
  summary: Summary;
  dailyReport: DailyRecord[];
}

function getExecutionStats(dailyReport: DailyRecord[]) {
  const workingDays: DailyRecord[] = [];
  const anomalies: DailyRecord[] = [];

  for (const d of dailyReport) {
    const date = new Date(`${d.date}T12:00:00+08:00`);
    const dow = date.getDay();
    if (dow === 0 || dow === 6) continue;
    if (isNationalHolidayTW(date)) continue;
    workingDays.push(d);
    if (d.chargedKWh === 0 || d.dischargedKWh === 0) anomalies.push(d);
  }

  const executedDays = workingDays.length - anomalies.length;
  const rate = workingDays.length > 0 ? Math.round((executedDays / workingDays.length) * 10000) / 100 : 0;
  return { workingDays: workingDays.length, executedDays, rate, anomalies };
}

const WEEKDAY_LABELS = ["日", "一", "二", "三", "四", "五", "六"];

export function HistorySummaryCards({ summary, dailyReport }: Props) {
  const [showAnomalies, setShowAnomalies] = useState(false);

  const days = dailyReport.length;
  const avgDaily = days > 0 ? Math.round(summary.totalKWh / days) : 0;
  const peakRatio = summary.totalKWh > 0 ? Math.round((summary.totalPeakKWh / summary.totalKWh) * 100) : 0;

  const totalDischarged = dailyReport.reduce((sum, d) => sum + d.dischargedKWh, 0);
  const utilization = summary.totalPeakKWh > 0 ? Math.round((totalDischarged / summary.totalPeakKWh) * 10000) / 100 : 0;

  const overCount = summary.totalOverContractCount ?? 0;
  const suppressedCount = summary.totalBessSuppressedCount ?? 0;
  const suppressionRate = overCount > 0 ? Math.round((suppressedCount / overCount) * 100) : 0;

  const exec = getExecutionStats(dailyReport);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <ReportSummaryCard label="總用電量" value={`${summary.totalKWh.toLocaleString()} kWh`} sub={`${days} 天 · ${summary.totalHours} 小時`} />
        <ReportSummaryCard label="日均用電" value={`${avgDaily.toLocaleString()} kWh`} sub="每天平均" />
        <ReportSummaryCard label="尖峰佔比" value={`${peakRatio}%`} sub={`尖峰 ${summary.totalPeakKWh.toLocaleString()} kWh`} />
        <ReportSummaryCard label="儲能尖峰抵銷率" value={`${utilization}%`} sub={`放電 ${Math.round(totalDischarged).toLocaleString()} / 尖峰 ${summary.totalPeakKWh.toLocaleString()} kWh`} highlight={utilization > 50} />
        <ReportSummaryCard label="儲能抑低超約次數" value={`${suppressedCount} 次`} sub={`抑制率 ${suppressionRate}%`} highlight={suppressedCount > 0} />
        <ReportSummaryCard label="儲能執行率" value={`${exec.rate}%`} sub={`${exec.executedDays} / ${exec.workingDays} 工作日`} highlight={exec.rate >= 90} />
        <button type="button" className="text-left cursor-pointer" onClick={() => exec.anomalies.length > 0 && setShowAnomalies(!showAnomalies)}>
          <ReportSummaryCard label="執行率異常" value={`${exec.anomalies.length} 天`} sub={exec.anomalies.length > 0 ? "點擊查看詳情" : "無異常"} highlight={exec.anomalies.length > 0} variant="warning" />
        </button>
      </div>

      {showAnomalies && exec.anomalies.length > 0 && (
        <div className="bg-[#2A1A0F] border border-[#3A2415] rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white/70">儲能執行異常日明細</h3>
            <button onClick={() => setShowAnomalies(false)} className="text-white/40 hover:text-white text-xs">收合</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#3A2415]">
                  <th className="text-left py-2 px-2 text-white/50 font-semibold">日期</th>
                  <th className="text-right py-2 px-2 text-white/50 font-semibold">充電 kWh</th>
                  <th className="text-right py-2 px-2 text-white/50 font-semibold">放電 kWh</th>
                  <th className="text-center py-2 px-2 text-white/50 font-semibold">原因</th>
                </tr>
              </thead>
              <tbody>
                {exec.anomalies.map((d) => {
                  const date = new Date(`${d.date}T12:00:00+08:00`);
                  return (
                    <tr key={d.date} className="border-b border-[#3A2415]/50">
                      <td className="py-1.5 px-2 text-white/70">{d.date} ({WEEKDAY_LABELS[date.getDay()]})</td>
                      <td className={`py-1.5 px-2 text-right ${d.chargedKWh === 0 ? "text-red-400 font-semibold" : "text-white/70"}`}>{d.chargedKWh}</td>
                      <td className={`py-1.5 px-2 text-right ${d.dischargedKWh === 0 ? "text-red-400 font-semibold" : "text-white/70"}`}>{d.dischargedKWh}</td>
                      <td className="py-1.5 px-2 text-center">
                        {d.chargedKWh === 0 && d.dischargedKWh === 0 && <span className="text-xs px-1.5 py-0.5 rounded bg-red-900/30 text-red-400">未充未放</span>}
                        {d.chargedKWh === 0 && d.dischargedKWh !== 0 && <span className="text-xs px-1.5 py-0.5 rounded bg-orange-900/30 text-orange-400">未充電</span>}
                        {d.chargedKWh !== 0 && d.dischargedKWh === 0 && <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-900/30 text-yellow-400">未放電</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
