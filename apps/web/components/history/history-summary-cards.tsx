"use client";

import { useState } from "react";
import { ReportSummaryCard } from "@/components/report/report-summary-card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { Summary, DailyRecord } from "@/types/report-type";
import { isNationalHolidayTW } from "@/constants/taiwan-holidays";

interface Props {
  summary: Summary;
  dailyReport: DailyRecord[];
}

/**
 * 儲能執行率：有充放電行為的工作日 / 總工作日
 * 異常日：工作日但充電=0 或 放電=0（儲能應執行卻未執行）
 */
function getExecutionStats(dailyReport: DailyRecord[]) {
  const workingDays: DailyRecord[] = [];
  const anomalies: DailyRecord[] = [];

  for (const d of dailyReport) {
    const date = new Date(`${d.date}T12:00:00+08:00`);
    const dow = date.getDay();
    if (dow === 0 || dow === 6) continue; // skip weekends
    if (isNationalHolidayTW(date)) continue; // skip national holidays

    workingDays.push(d);

    // Anomaly: working day with no charge or no discharge
    if (d.chargedKWh === 0 || d.dischargedKWh === 0) {
      anomalies.push(d);
    }
  }

  const executedDays = workingDays.length - anomalies.length;
  const rate =
    workingDays.length > 0
      ? Math.round((executedDays / workingDays.length) * 10000) / 100
      : 0;

  return { workingDays: workingDays.length, executedDays, rate, anomalies };
}

const WEEKDAY_LABELS = ["日", "一", "二", "三", "四", "五", "六"];

export function HistorySummaryCards({ summary, dailyReport }: Props) {
  const [anomalyOpen, setAnomalyOpen] = useState(false);

  const days = dailyReport.length;
  const avgDaily = days > 0 ? Math.round(summary.totalKWh / days) : 0;
  const peakRatio =
    summary.totalKWh > 0
      ? Math.round((summary.totalPeakKWh / summary.totalKWh) * 100)
      : 0;

  // 尖峰放電抵銷率: 放電量 / 尖峰用電量
  const totalDischarged = dailyReport.reduce(
    (sum, d) => sum + d.dischargedKWh,
    0,
  );
  const utilization =
    summary.totalPeakKWh > 0
      ? Math.round((totalDischarged / summary.totalPeakKWh) * 10000) / 100
      : 0;

  // 超約統計
  const overCount = summary.totalOverContractCount ?? 0;
  const suppressedCount = summary.totalBessSuppressedCount ?? 0;
  const suppressionRate =
    overCount > 0 ? Math.round((suppressedCount / overCount) * 100) : 0;

  // 儲能執行率
  const exec = getExecutionStats(dailyReport);

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <ReportSummaryCard
          label="總用電量"
          value={`${summary.totalKWh.toLocaleString()} kWh`}
          sub={`${days} 天 · ${summary.totalHours} 小時`}
        />
        <ReportSummaryCard
          label="日均用電"
          value={`${avgDaily.toLocaleString()} kWh`}
          sub="每天平均"
        />
        <ReportSummaryCard
          label="尖峰佔比"
          value={`${peakRatio}%`}
          sub={`尖峰 ${summary.totalPeakKWh.toLocaleString()} kWh`}
        />
        <ReportSummaryCard
          label="儲能尖峰抵銷率"
          value={`${utilization}%`}
          sub={`放電 ${Math.round(totalDischarged).toLocaleString()} / 尖峰 ${summary.totalPeakKWh.toLocaleString()} kWh`}
          highlight={utilization > 50}
        />
        <ReportSummaryCard
          label="儲能抑低超約次數"
          value={`${suppressedCount} 次`}
          sub={`抑制率 ${suppressionRate}%`}
          highlight={suppressedCount > 0}
        />
        <ReportSummaryCard
          label="儲能執行率"
          value={`${exec.rate}%`}
          sub={`${exec.executedDays} / ${exec.workingDays} 工作日`}
          highlight={exec.rate >= 90}
        />
        {/* Clickable anomaly card */}
        <button
          type="button"
          className="text-left cursor-pointer"
          onClick={() => exec.anomalies.length > 0 && setAnomalyOpen(true)}
        >
          <ReportSummaryCard
            label="執行率異常"
            value={`${exec.anomalies.length} 天`}
            sub={exec.anomalies.length > 0 ? "點擊查看詳情" : "無異常"}
            highlight={exec.anomalies.length > 0}
            variant="warning"
          />
        </button>
      </div>

      {/* Anomaly detail modal */}
      <Dialog open={anomalyOpen} onOpenChange={setAnomalyOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>儲能執行異常日明細</DialogTitle>
            <DialogDescription>
              以下工作日未完整執行充放電（充電或放電為 0）
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-auto flex-1 -mx-6 px-6">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-2 text-gray-600 font-semibold">
                    日期
                  </th>
                  <th className="text-right py-2 px-2 text-gray-600 font-semibold">
                    充電 kWh
                  </th>
                  <th className="text-right py-2 px-2 text-gray-600 font-semibold">
                    放電 kWh
                  </th>
                  <th className="text-right py-2 px-2 text-gray-600 font-semibold">
                    尖峰 kWh
                  </th>
                  <th className="text-right py-2 px-2 text-gray-600 font-semibold">
                    起始 SOC
                  </th>
                  <th className="text-center py-2 px-2 text-gray-600 font-semibold">
                    異常原因
                  </th>
                </tr>
              </thead>
              <tbody>
                {exec.anomalies.map((d) => {
                  const date = new Date(`${d.date}T12:00:00+08:00`);
                  const weekday = WEEKDAY_LABELS[date.getDay()];
                  const noCharge = d.chargedKWh === 0;
                  const noDischarge = d.dischargedKWh === 0;

                  return (
                    <tr
                      key={d.date}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-1.5 px-2 text-gray-700">
                        {d.date} ({weekday})
                      </td>
                      <td
                        className={`py-1.5 px-2 text-right ${noCharge ? "text-red-500 font-semibold" : "text-gray-700"}`}
                      >
                        {d.chargedKWh}
                      </td>
                      <td
                        className={`py-1.5 px-2 text-right ${noDischarge ? "text-red-500 font-semibold" : "text-gray-700"}`}
                      >
                        {d.dischargedKWh}
                      </td>
                      <td className="py-1.5 px-2 text-right text-gray-700">
                        {d.peakKWh}
                      </td>
                      <td className="py-1.5 px-2 text-right text-gray-700">
                        {d.startSOC}
                      </td>
                      <td className="py-1.5 px-2 text-center">
                        {noCharge && noDischarge && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-red-100 text-red-700">
                            未充未放
                          </span>
                        )}
                        {noCharge && !noDischarge && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-orange-100 text-orange-700">
                            未充電
                          </span>
                        )}
                        {!noCharge && noDischarge && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700">
                            未放電
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {exec.anomalies.length === 0 && (
              <p className="text-center text-gray-400 py-8">無異常紀錄</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
