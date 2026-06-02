import { ReportData } from "@/types/report-type";

export function exportReportCSV(
  report: ReportData,
  startDate: string,
  endDate: string,
) {
  const { summary: s, dailyReport } = report;
  const dayCount = dailyReport.length;
  const monthlyEst = dayCount > 0 ? Math.round((s.savings / dayCount) * 30) : 0;
  const annualEst = dayCount > 0 ? Math.round((s.savings / dayCount) * 365) : 0;

  const rows: (string | number)[][] = [];

  // Metadata
  rows.push(["內湖 Evalue 旗艦站 — 儲能效益分析報告"]);
  rows.push(["時間範圍", `${startDate} ~ ${endDate}`]);
  rows.push([]);

  // Summary
  rows.push(["【總計】"]);
  rows.push(["充電總量 (kWh)", s.totalKWh]);
  rows.push(["充電時數 (小時)", s.totalHours]);
  rows.push(["尖峰用電 (kWh)", s.totalPeakKWh]);
  rows.push(["離峰用電 (kWh)", s.totalOffPeakKWh]);
  rows.push(["無儲能花費 (NT$)", s.costWithoutBESS]);
  rows.push(["有儲能花費 (NT$)", s.costWithBESS]);
  rows.push(["省電費 (NT$)", s.savings]);
  rows.push(["省費率 (%)", s.savingsRate]);
  rows.push(["儲能抵消尖峰 (kWh)", s.peakSavingsKWh]);
  rows.push(["估算月均省費 (NT$)", monthlyEst, "估算年省費 (NT$)", annualEst]);
  rows.push([]);

  // Daily detail
  rows.push([
    "日期",
    "充電時數 (小時)",
    "尖峰用電 (kWh)",
    "離峰用電 (kWh)",
    "無儲能花費 (NT$)",
    "有儲能花費 (NT$)",
    "省費 (NT$)",
  ]);
  for (const d of dailyReport) {
    rows.push([
      d.date,
      d.hours,
      d.peakKWh,
      d.offPeakKWh,
      d.withoutBESS,
      d.withBESS,
      d.savings,
    ]);
  }
  rows.push([
    "合計",
    s.totalHours,
    s.totalPeakKWh,
    s.totalOffPeakKWh,
    s.costWithoutBESS,
    s.costWithBESS,
    s.savings,
  ]);

  const csv = rows
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `儲能效益報告_${startDate}_${endDate}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
