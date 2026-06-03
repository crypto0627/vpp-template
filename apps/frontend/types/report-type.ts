export interface DailyRecord {
  date: string;
  peakKWh: number;
  offPeakKWh: number;
  hours: number;
  withoutBESS: number;
  withBESS: number;
  savings: number;
  chargedKWh: number;
  dischargedKWh: number;
  startSOC: number;
  endSOC: number;
  soh?: number;
  capacityKWh?: number;
  overContractCount: number;
  bessSuppressedCount: number;
  peakGridSupplementCount: number;
}

export interface Summary {
  totalHours: number;
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
  totalOverContractCount: number;
  totalBessSuppressedCount: number;
  totalPeakGridSupplementCount: number;
  drDays: number;
  drTotalCost: number;
  costWithBESSAfterDR: number;
  sRegRevenue: number;
  costWithBESSFinal: number;
}

export interface ReportData {
  summary: Summary;
  dailyReport: DailyRecord[];
}
