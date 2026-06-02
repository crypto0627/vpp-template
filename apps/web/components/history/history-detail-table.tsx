"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DailyRecord } from "@/types/report-type";

export function HistoryDetailTable({
  dailyReport,
  selectedDate,
  onSelectDate,
}: {
  dailyReport: DailyRecord[];
  selectedDate?: string | null;
  onSelectDate?: (date: string | null) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const display = expanded ? dailyReport : dailyReport.slice(0, 10);

  const totalCharged = dailyReport.reduce((s, d) => s + d.chargedKWh, 0);
  const totalDischarged = dailyReport.reduce((s, d) => s + d.dischargedKWh, 0);

  const handleDateClick = (date: string) => {
    if (!onSelectDate) return;
    onSelectDate(selectedDate === date ? null : date);
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">逐日運轉明細</CardTitle>
          <div className="flex items-center gap-3">
            {onSelectDate && (
              <span className="text-xs text-gray-400">點擊日期查看逐時數據</span>
            )}
            <span className="text-sm text-gray-500">{dailyReport.length} 天</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-2.5 px-3 text-gray-600 font-semibold">
                  日期
                </th>
                <th className="text-right py-2.5 px-3 text-gray-600 font-semibold">
                  小時
                </th>
                <th
                  className="text-right py-2.5 px-3 font-semibold"
                  style={{ color: "#4A4540" }}
                >
                  尖峰 kWh
                </th>
                <th
                  className="text-right py-2.5 px-3 font-semibold"
                  style={{ color: "#BEA98F" }}
                >
                  離峰 kWh
                </th>
                <th
                  className="text-right py-2.5 px-3 font-semibold"
                  style={{ color: "#D4A56A" }}
                >
                  充電 kWh
                </th>
                <th
                  className="text-right py-2.5 px-3 font-semibold"
                  style={{ color: "#C2614A" }}
                >
                  放電 kWh
                </th>
                <th
                  className="text-right py-2.5 px-3 font-semibold"
                  style={{ color: "#6B7B8D" }}
                >
                  尖峰電網 kWh
                </th>
                <th
                  className="text-right py-2.5 px-3 font-semibold"
                  style={{ color: "#9B7093" }}
                >
                  結束 SOC
                </th>
              </tr>
            </thead>
            <tbody>
              {display.map((d) => (
                <tr
                  key={d.date}
                  className={`border-b border-gray-100 hover:bg-gray-50 ${
                    selectedDate === d.date ? "bg-orange-50" : ""
                  }`}
                >
                  <td className="py-2 px-3">
                    {onSelectDate ? (
                      <button
                        onClick={() => handleDateClick(d.date)}
                        className={`text-left font-medium hover:underline ${
                          selectedDate === d.date
                            ? "text-[#DA7756]"
                            : "text-[#6B7B8D] hover:text-[#DA7756]"
                        }`}
                      >
                        {d.date}
                        <span className="text-gray-400 ml-1 font-normal">
                          ({["日", "一", "二", "三", "四", "五", "六"][new Date(d.date).getDay()]})
                        </span>
                      </button>
                    ) : (
                      <span className="text-gray-700">
                        {d.date}
                        <span className="text-gray-400 ml-1">
                          ({["日", "一", "二", "三", "四", "五", "六"][new Date(d.date).getDay()]})
                        </span>
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-right text-gray-500">
                    {d.hours}
                  </td>
                  <td className="py-2 px-3 text-right text-gray-700">
                    {d.peakKWh}
                  </td>
                  <td className="py-2 px-3 text-right text-gray-500">
                    {d.offPeakKWh}
                  </td>
                  <td
                    className="py-2 px-3 text-right"
                    style={{ color: "#D4A56A" }}
                  >
                    {d.chargedKWh}
                  </td>
                  <td
                    className="py-2 px-3 text-right"
                    style={{ color: "#C2614A" }}
                  >
                    {d.dischargedKWh}
                  </td>
                  <td
                    className="py-2 px-3 text-right"
                    style={{ color: "#6B7B8D" }}
                  >
                    {Math.round((d.peakKWh - d.dischargedKWh) * 100) / 100}
                  </td>
                  <td
                    className="py-2 px-3 text-right font-medium"
                    style={{ color: "#9B7093" }}
                  >
                    {d.endSOC} kWh
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-200 bg-gray-50 font-semibold text-sm">
                <td className="py-2.5 px-3 text-gray-800">合計</td>
                <td className="py-2.5 px-3 text-right text-gray-800">
                  {dailyReport.reduce((s, d) => s + d.hours, 0)}
                </td>
                <td className="py-2.5 px-3 text-right text-gray-800">
                  {dailyReport
                    .reduce((s, d) => s + d.peakKWh, 0)
                    .toLocaleString()}
                </td>
                <td className="py-2.5 px-3 text-right text-gray-800">
                  {dailyReport
                    .reduce((s, d) => s + d.offPeakKWh, 0)
                    .toLocaleString()}
                </td>
                <td
                  className="py-2.5 px-3 text-right"
                  style={{ color: "#C2946A" }}
                >
                  {totalCharged.toFixed(1)}
                </td>
                <td
                  className="py-2.5 px-3 text-right"
                  style={{ color: "#A85A42" }}
                >
                  {totalDischarged.toFixed(1)}
                </td>
                <td
                  className="py-2.5 px-3 text-right"
                  style={{ color: "#6B7B8D" }}
                >
                  {Math.round(
                    (dailyReport.reduce((s, d) => s + d.peakKWh, 0) - totalDischarged) * 100,
                  ) / 100}
                </td>
                <td
                  className="py-2.5 px-3 text-right"
                  style={{ color: "#8A6282" }}
                >
                  {dailyReport.length > 0
                    ? `${dailyReport[dailyReport.length - 1]!.endSOC} kWh`
                    : "-"}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {dailyReport.length > 10 && (
          <div className="px-4 py-3 border-t border-gray-100 text-center">
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-sm text-[#DA7756] hover:text-[#C2614A] font-medium"
            >
              {expanded ? "收合" : `展開全部（共 ${dailyReport.length} 天）`}
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
