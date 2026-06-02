/**
 * 驗算：ETai 歷史數據 vs 報表 totalKWh
 *
 * 確認 report-generator 的 totalKWh（原始負載）
 * 加上被排除的國定假日用電後，是否等於原始 JSON 總和。
 */
import { readFileSync } from "fs";
import { join } from "path";
import { generateReport, type HourlyPowerRecord } from "@/utils/report-generator";
import { ETAI_SIMULATION_CONFIG } from "@/config/site-configs";
import { isNationalHolidayTW } from "@/constants/taiwan-holidays";

interface EtaiRawRecord {
  datetime: string;
  kW: number;
}

const raw: EtaiRawRecord[] = JSON.parse(
  readFileSync(join(process.cwd(), "constants", "ETai_2021_2025.json"), "utf-8"),
);

const allData: HourlyPowerRecord[] = raw.map((rec) => ({
  date_timerange: `${rec.datetime}+08:00`,
  "power(kwh)": rec.kW,
}));

// --- Per-year verification ---
const years = [2021, 2022, 2023, 2024, 2025];

let grandRawTotal = 0;
let grandReportTotal = 0;
let grandHolidayTotal = 0;
let grandFilteredZero = 0;

for (const year of years) {
  const start = `${year}-01-01`;
  const end = `${year}-12-31`;

  // Raw total for this year
  const yearRaw = raw.filter((r) => r.datetime.startsWith(`${year}`));
  const rawTotal = yearRaw.reduce((s, r) => s + r.kW, 0);

  // Records with kW <= 0 (filtered by report-generator)
  const zeroRecords = yearRaw.filter((r) => r.kW <= 0);
  const zeroTotal = zeroRecords.reduce((s, r) => s + r.kW, 0);

  // Holiday records (excluded by report-generator)
  const holidayRecords = yearRaw.filter((r) => {
    if (r.kW <= 0) return false;
    const d = new Date(`${r.datetime}+08:00`);
    return isNationalHolidayTW(d);
  });
  const holidayTotal = holidayRecords.reduce((s, r) => s + r.kW, 0);

  // Generate report
  const result = generateReport(allData, ETAI_SIMULATION_CONFIG, start, end);
  const payload = result.payload as {
    summary: { totalKWh: number; peakSavingsKWh: number };
    dailyReport: Array<{ chargedKWh: number; dischargedKWh: number }>;
  };

  const reportTotalKWh = payload.summary.totalKWh;
  const totalCharged = payload.dailyReport.reduce((s, d) => s + d.chargedKWh, 0);
  const totalDischarged = payload.dailyReport.reduce((s, d) => s + d.dischargedKWh, 0);

  // Verify: rawTotal = reportTotalKWh + holidayTotal + zeroTotal
  const reconstructed = reportTotalKWh + holidayTotal + zeroTotal;
  const diff = rawTotal - reconstructed;

  console.log(`\n=== ${year} ===`);
  console.log(`原始 JSON 總用電:          ${rawTotal.toFixed(2)} kWh`);
  console.log(`報表 totalKWh (不含假日):   ${reportTotalKWh.toFixed(2)} kWh`);
  console.log(`國定假日排除:              ${holidayTotal.toFixed(2)} kWh (${holidayRecords.length} 小時)`);
  console.log(`零/負值排除:               ${zeroTotal.toFixed(2)} kWh (${zeroRecords.length} 筆)`);
  console.log(`還原合計:                  ${reconstructed.toFixed(2)} kWh`);
  console.log(`差異:                      ${diff.toFixed(2)} kWh ${Math.abs(diff) < 1 ? "✅" : "❌"}`);
  console.log(`---`);
  console.log(`儲能充電 (離峰從電網充):    ${totalCharged.toFixed(2)} kWh`);
  console.log(`儲能放電 (尖峰替代電網):    ${totalDischarged.toFixed(2)} kWh`);
  console.log(`實際電網用電 = 總用電 + 充電 - 放電: ${(reportTotalKWh + totalCharged - totalDischarged).toFixed(2)} kWh`);

  grandRawTotal += rawTotal;
  grandReportTotal += reportTotalKWh;
  grandHolidayTotal += holidayTotal;
  grandFilteredZero += zeroTotal;
}

console.log(`\n========== 全年度彙總 ==========`);
console.log(`原始 JSON 總用電:          ${grandRawTotal.toFixed(2)} kWh`);
console.log(`報表 totalKWh 合計:        ${grandReportTotal.toFixed(2)} kWh`);
console.log(`國定假日排除合計:          ${grandHolidayTotal.toFixed(2)} kWh`);
console.log(`零/負值排除合計:           ${grandFilteredZero.toFixed(2)} kWh`);
const grandReconstructed = grandReportTotal + grandHolidayTotal + grandFilteredZero;
console.log(`還原合計:                  ${grandReconstructed.toFixed(2)} kWh`);
const grandDiff = grandRawTotal - grandReconstructed;
console.log(`總差異:                    ${grandDiff.toFixed(2)} kWh ${Math.abs(grandDiff) < 1 ? "✅" : "❌"}`);
