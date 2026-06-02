/**
 * Report Type Definitions
 *
 * Type definitions for energy storage reports including daily records and summary statistics.
 */

/**
 * Daily energy and cost record
 */
export interface DailyRecord {
  date: string;
  peakKWh: number;
  offPeakKWh: number;
  hours: number; // 改為小時數
  withoutBESS: number;
  withBESS: number;
  savings: number;
  // 充放電記錄
  chargedKWh: number; // 當日充電總量（儲能實際增加的電量）
  dischargedKWh: number; // 當日放電總量（儲能實際減少的電量）
  startSOC: number; // 當日開始 SOC (kWh)
  endSOC: number; // 當日結束 SOC (kWh)
  soh?: number; // 當年度 SOH (%)
  capacityKWh?: number; // 當年度實際可用容量 (kWh)
  overContractCount: number; // 該日超約次數（無儲能時）
  bessSuppressedCount: number; // 儲能成功抑低超約次數
  peakGridSupplementCount: number; // 尖峰時段電網補充次數（每小時為基數）
}

/**
 * Aggregated summary statistics for reports
 */
export interface Summary {
  totalHours: number; // 改為總小時數
  totalPeakKWh: number;
  totalOffPeakKWh: number;
  totalKWh: number;
  costWithoutBESS: number;
  costWithBESS: number;
  savings: number;
  savingsRate: number;
  peakSavingsKWh: number;
  withoutPeakCost: number;
  withoutOffpeakCost: number;
  withPeakCost: number;
  withOffpeakCost: number;
  totalOverContractCount: number; // 總超約次數
  totalBessSuppressedCount: number; // 儲能成功抑低超約總次數
  totalPeakGridSupplementCount: number; // 尖峰時段電網補充總次數
  // Demand Response (DR)
  drDays: number; // DR 適用天數
  drTotalCost: number; // DR 總扣減金額
  costWithBESSAfterDR: number; // 有儲能花費 - DR扣減
  // sReg 電力輔助服務
  sRegRevenue: number; // sReg 總收益
  costWithBESSFinal: number; // 最終電費 = 有儲能花費 - DR扣減 - sReg收益
}

/**
 * Complete report structure
 */
export interface ReportData {
  summary: Summary;
  dailyReport: DailyRecord[];
}
