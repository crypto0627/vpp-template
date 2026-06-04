/**
 * Site-specific simulation configurations
 * Maps each site to its BESS and energy management parameters
 */


import { isTaiwanNationalHoliday } from "@/constants/taiwan-holidays";
import type { SiteId } from "@/types/data-type";

/**
 * Pricing model type:
 * - "ev-charging": 電動車充電站電價 (month-based summer, season-dependent peak hours, no semi-peak)
 * - "batch-tou": 批次時間電價 (date-based summer, unified peak hours, Saturday semi-peak)
 */
export type PricingModel = "ev-charging" | "batch-tou";

export interface SiteSimulationConfig {
  // Battery Energy Storage System (BESS)
  BESS_CAPACITY_KWH: number;
  BESS_CAPACITY_AH: number;
  PCS_CAPACITY_KW: number;
  NOMINAL_VOLTAGE: number;

  // Contract & Safety Limits
  CONTRACT_LIMIT_KW: number;
  SAFETY_MARGIN: number;

  // SOH degradation by year (ratio, e.g. 0.8631 = 86.31%)
  SOH_BY_YEAR: Record<number, number>;

  // System Efficiency
  CHARGE_EFFICIENCY: number;
  DISCHARGE_EFFICIENCY: number;
  AC_SIDE_EFFICIENCY: number;

  // Pricing Model
  PRICING_MODEL: PricingModel;

  // Summer Season
  // ev-charging: month-based (SUMMER_MONTHS)
  // batch-tou: date-based (SUMMER_START/END_MONTH/DAY)
  SUMMER_MONTHS: readonly number[];
  SUMMER_START_MONTH: number;
  SUMMER_START_DAY: number;
  SUMMER_END_MONTH: number;
  SUMMER_END_DAY: number;

  // Summer Peak Hours (or unified peak for batch-tou)
  PEAK_START_HOUR: number;
  PEAK_START_MINUTE: number;
  PEAK_END_HOUR: number;
  PEAK_END_MINUTE: number;

  // Non-Summer Peak Hours (ev-charging only; batch-tou sets same as PEAK)
  NON_SUMMER_PEAK_START_HOUR: number;
  NON_SUMMER_PEAK_START_MINUTE: number;
  NON_SUMMER_PEAK_END_HOUR: number;
  NON_SUMMER_PEAK_END_MINUTE: number;

  // Semi-Peak Hours (batch-tou only, Saturdays; ev-charging sets 0)
  SEMI_PEAK_START_HOUR: number;
  SEMI_PEAK_START_MINUTE: number;
  SEMI_PEAK_END_HOUR: number;
  SEMI_PEAK_END_MINUTE: number;

  // Electricity Rates
  BASIC_FEE_NTD: number;
  CONTRACT_CAPACITY_RATE_NTD: number;
  SUMMER_PEAK_RATE: number;
  SUMMER_OFFPEAK_RATE: number;
  NON_SUMMER_PEAK_RATE: number;
  NON_SUMMER_OFFPEAK_RATE: number;
  SUMMER_SEMI_PEAK_RATE: number;
  NON_SUMMER_SEMI_PEAK_RATE: number;

  // Voltage Range
  MIN_VOLTAGE: number;
  MAX_VOLTAGE: number;

  // Four-Hour Demand Response (optional, ETai only)
  // 5/1~10/31 weekdays (excl. holidays), 4-hour DR program
  DR?: {
    ENABLED: boolean;
    START_MONTH: number; // 5
    START_DAY: number; // 1
    END_MONTH: number; // 10
    END_DAY: number; // 31
    SUPPRESSED_KW: number; // 抑低契約容量 (kW)
    EXECUTION_RATE: number; // 執行率 (1.0 = 100%)
    HOURS: number; // 執行時數
    RATE_PER_KWH: number; // 流動電費扣減費率 (NT$/kWh)
    DISCOUNT_RATIO: number; // 扣減比率 (1.2 = 120%)
    NIGHT_CHARGE_KW: number; // DR期間 22:00~24:00 額外充電功率 (kW)
  };

  // sReg 電力輔助服務 (optional, ETai only)
  // Revenue = MW × Price × Hours × UtilizationFactor
  SREG?: {
    ENABLED: boolean;
    PRICE_PER_MW_HOUR: number; // NT$/MW/hour
    UTILIZATION_FACTOR: number; // 利用率 (0.67 = 67%)
    // 各日排程：{ mw: MW, hours: 時數 }[]
    MONDAY: { mw: number; hours: number }[];
    TUE_TO_FRI: { mw: number; hours: number }[];
    SATURDAY: { mw: number; hours: number }[];
    // Sunday & holidays: no revenue
  };
}

/**
 * Neihu site configuration
 * Defines all parameters for the Neihu EV charging station
 */
export const NEIHU_SIMULATION_CONFIG: SiteSimulationConfig = {
  // Battery Energy Storage System (BESS)
  BESS_CAPACITY_KWH: 370,
  BESS_CAPACITY_AH: 462.5,
  PCS_CAPACITY_KW: 100,
  NOMINAL_VOLTAGE: 800,

  // Contract & Safety Limits
  CONTRACT_LIMIT_KW: 432,
  SAFETY_MARGIN: 1,

  // SOH degradation by year (based on actual battery aging data)
  SOH_BY_YEAR: {
    2022: 0.9488,
    2023: 0.9218,
    2024: 0.8998,
    2025: 0.8806,
    2026: 0.8631,
    2027: 0.847,
    2028: 0.8319,
    2029: 0.8177,
    2030: 0.8041,
  },

  // System Efficiency
  CHARGE_EFFICIENCY: 0.97,
  DISCHARGE_EFFICIENCY: 0.9,
  AC_SIDE_EFFICIENCY: 1.0,

  // Pricing Model: 電動車充電站電價
  PRICING_MODEL: "ev-charging",

  // Summer: month-based (June-September)
  SUMMER_MONTHS: [6, 7, 8, 9],
  SUMMER_START_MONTH: 6,
  SUMMER_START_DAY: 1,
  SUMMER_END_MONTH: 9,
  SUMMER_END_DAY: 30,

  // Summer Peak: 16:00-22:00 (weekdays)
  PEAK_START_HOUR: 16,
  PEAK_START_MINUTE: 0,
  PEAK_END_HOUR: 22,
  PEAK_END_MINUTE: 0,

  // Non-Summer Peak: 15:00-21:00 (weekdays)
  NON_SUMMER_PEAK_START_HOUR: 15,
  NON_SUMMER_PEAK_START_MINUTE: 0,
  NON_SUMMER_PEAK_END_HOUR: 21,
  NON_SUMMER_PEAK_END_MINUTE: 0,

  // No semi-peak for EV charging
  SEMI_PEAK_START_HOUR: 0,
  SEMI_PEAK_START_MINUTE: 0,
  SEMI_PEAK_END_HOUR: 0,
  SEMI_PEAK_END_MINUTE: 0,

  // Electricity Cost (電動車充電站電價)
  BASIC_FEE_NTD: 0,
  CONTRACT_CAPACITY_RATE_NTD: 0,
  SUMMER_PEAK_RATE: 12.47,
  SUMMER_OFFPEAK_RATE: 3.05,
  NON_SUMMER_PEAK_RATE: 12.14,
  NON_SUMMER_OFFPEAK_RATE: 2.9,
  SUMMER_SEMI_PEAK_RATE: 3.05, // = offpeak (no semi-peak)
  NON_SUMMER_SEMI_PEAK_RATE: 2.9,

  // Voltage Range
  MIN_VOLTAGE: 780,
  MAX_VOLTAGE: 850,
};

/**
 * Etai (億泰電纜) site configuration
 * High-voltage industrial customer with 2.4 MW PCS / 10 MWh BESS.
 */
export const ETAI_SIMULATION_CONFIG: SiteSimulationConfig = {
  // Battery Energy Storage System (BESS)
  BESS_CAPACITY_KWH: 10030,
  BESS_CAPACITY_AH: 6666.67, // 10000 kWh @ 1500V nominal
  PCS_CAPACITY_KW: 2400,
  NOMINAL_VOLTAGE: 1500,

  // Contract & Safety Limits
  CONTRACT_LIMIT_KW: 2700,
  SAFETY_MARGIN: 1,

  // SOH degradation by year (Year 1 = 2026, Year 2 = 2027)
  SOH_BY_YEAR: {
    2026: 0.9522,
    2027: 0.9252,
  },

  // System Efficiency
  // 充電量 = DC可用容量 ÷ 充電效率 ÷ AC側效率
  // 放電量 = DC可用容量 × 放電效率 × AC側效率
  CHARGE_EFFICIENCY: 0.964,
  DISCHARGE_EFFICIENCY: 0.903,
  AC_SIDE_EFFICIENCY: 0.99,

  // Pricing Model: 批次時間電價
  PRICING_MODEL: "batch-tou",

  // Summer: date-based (5/16 ~ 10/15)
  SUMMER_MONTHS: [],
  SUMMER_START_MONTH: 5,
  SUMMER_START_DAY: 16,
  SUMMER_END_MONTH: 10,
  SUMMER_END_DAY: 15,

  // Unified Peak: 15:30-21:30 (weekdays)
  PEAK_START_HOUR: 15,
  PEAK_START_MINUTE: 30,
  PEAK_END_HOUR: 21,
  PEAK_END_MINUTE: 30,

  // Non-Summer Peak: same as summer for batch-tou
  NON_SUMMER_PEAK_START_HOUR: 15,
  NON_SUMMER_PEAK_START_MINUTE: 30,
  NON_SUMMER_PEAK_END_HOUR: 21,
  NON_SUMMER_PEAK_END_MINUTE: 30,

  // Semi-Peak: Saturdays 15:30-21:30
  SEMI_PEAK_START_HOUR: 15,
  SEMI_PEAK_START_MINUTE: 30,
  SEMI_PEAK_END_HOUR: 21,
  SEMI_PEAK_END_MINUTE: 30,

  // Electricity Cost (批次時間電價)
  BASIC_FEE_NTD: 0,
  CONTRACT_CAPACITY_RATE_NTD: 0,
  SUMMER_PEAK_RATE: 12.47,
  SUMMER_OFFPEAK_RATE: 3.18,
  NON_SUMMER_PEAK_RATE: 11.79,
  NON_SUMMER_OFFPEAK_RATE: 3.18,
  SUMMER_SEMI_PEAK_RATE: 3.26,
  NON_SUMMER_SEMI_PEAK_RATE: 3.0,

  // Voltage Range (scaled to 1500V nominal)
  MIN_VOLTAGE: 1450,
  MAX_VOLTAGE: 1600,

  // Four-Hour Demand Response program
  // 5/1~10/31 weekdays, 當日電費扣減 = 抑低kW × 執行率 × 時數 × 費率 × 扣減比率
  DR: {
    ENABLED: true,
    START_MONTH: 5,
    START_DAY: 1,
    END_MONTH: 10,
    END_DAY: 31,
    SUPPRESSED_KW: 1000,
    EXECUTION_RATE: 1.0, // 100%
    HOURS: 4,
    RATE_PER_KWH: 1.84,
    DISCOUNT_RATIO: 1.2, // 120%
    NIGHT_CHARGE_KW: 1000, // 22:00~24:00 charging during DR season
  },

  // sReg 電力輔助服務
  SREG: {
    ENABLED: true,
    PRICE_PER_MW_HOUR: 275, // NT$/MW/hour
    UTILIZATION_FACTOR: 0.67, // 67%
    MONDAY: [{ mw: 1, hours: 7 }], // 08:00-14:59
    TUE_TO_FRI: [
      { mw: 2, hours: 6 }, // 00:00-05:59
      { mw: 1, hours: 9 }, // 06:00-14:59
    ],
    SATURDAY: [{ mw: 1, hours: 24 }], // 全天
  },
};

/**
 * Site configuration map
 * Add new sites here as they are onboarded
 */
export const SITE_CONFIGS: Record<string, SiteSimulationConfig> = {
  neihu: NEIHU_SIMULATION_CONFIG,
  etai: ETAI_SIMULATION_CONFIG,
};

/**
 * Get site-specific configuration
 * @param siteId - The site identifier
 * @returns Site simulation configuration
 */
export function getSiteConfig(siteId: SiteId): SiteSimulationConfig {
  return SITE_CONFIGS[siteId];
}

/**
 * 判斷日期是否為夏月
 * ev-charging: month-based (e.g. 6,7,8,9)
 * batch-tou: date-based (e.g. 5/16 ~ 10/15)
 */
export function isSummerDate(
  month: number,
  day: number,
  config: SiteSimulationConfig,
): boolean {
  if (config.PRICING_MODEL === "ev-charging") {
    return config.SUMMER_MONTHS.includes(month);
  }
  // batch-tou: date-based
  const start = config.SUMMER_START_MONTH * 100 + config.SUMMER_START_DAY;
  const end = config.SUMMER_END_MONTH * 100 + config.SUMMER_END_DAY;
  const cur = month * 100 + day;
  return cur >= start && cur <= end;
}

/**
 * 判斷日期是否在 DR 需量反應期間（5/1~10/31 工作日，排除國定假日）
 */
export function isDRSeasonDate(
  month: number,
  day: number,
  config: SiteSimulationConfig,
): boolean {
  if (!config.DR?.ENABLED) return false;
  const dr = config.DR;
  const start = dr.START_MONTH * 100 + dr.START_DAY;
  const end = dr.END_MONTH * 100 + dr.END_DAY;
  const cur = month * 100 + day;
  return cur >= start && cur <= end;
}

/**
 * 計算單日 DR 電費扣減
 * = 抑低kW × 執行率 × 時數 × 費率 × 扣減比率
 */
export function getDailyDRCost(config: SiteSimulationConfig): number {
  if (!config.DR?.ENABLED) return 0;
  const dr = config.DR;
  return (
    dr.SUPPRESSED_KW *
    dr.EXECUTION_RATE *
    dr.HOURS *
    dr.RATE_PER_KWH *
    dr.DISCOUNT_RATIO
  );
}

/**
 * Get SOH ratio for a given year from a site's SOH_BY_YEAR table.
 * Clamps to the earliest/latest year if out of range.
 */
export function getSohForYear(
  config: SiteSimulationConfig,
  year: number,
): number {
  const table = config.SOH_BY_YEAR;
  const years = Object.keys(table)
    .map(Number)
    .sort((a, b) => a - b);
  if (years.length === 0) return 1;
  if (year <= years[0]!) return table[years[0]!]!;
  if (year >= years[years.length - 1]!) return table[years[years.length - 1]!]!;
  return table[year] ?? table[years[0]!]!;
}

/**
 * DC側可用容量（kWh）= 原始容量 × SOH
 */
export function getDCCapacity(
  config: SiteSimulationConfig,
  year: number,
): number {
  const soh = getSohForYear(config, year);
  return config.BESS_CAPACITY_KWH * soh;
}

/**
 * 負載端實際可用容量（最大放電量, kWh）
 * = DC側可用容量 × PCS效率（放電效率）
 */
export function getEffectiveCapacity(
  config: SiteSimulationConfig,
  year: number,
): number {
  return getDCCapacity(config, year) * config.DISCHARGE_EFFICIENCY;
}

/**
 * 計算 sReg 電力輔助服務收益
 * Revenue = MW × Price × Hours × UtilizationFactor
 * 週日及國定假日無收益
 */
export function calculateSRegRevenue(
  config: SiteSimulationConfig,
  startDate: string,
  endDate: string,
): number {
  if (!config.SREG?.ENABLED) return 0;
  const sreg = config.SREG;
  const price = sreg.PRICE_PER_MW_HOUR;
  const uf = sreg.UTILIZATION_FACTOR;

  const calcSlots = (slots: { mw: number; hours: number }[]): number =>
    slots.reduce((sum, s) => sum + s.mw * price * s.hours, 0) * uf;

  const monRevenue = calcSlots(sreg.MONDAY);
  const tueFriRevenue = calcSlots(sreg.TUE_TO_FRI);
  const satRevenue = calcSlots(sreg.SATURDAY);

  let total = 0;
  // Use noon UTC to avoid timezone boundary issues when extracting TW date
  const cur = new Date(`${startDate}T12:00:00+08:00`);
  const end = new Date(`${endDate}T12:00:00+08:00`);

  while (cur <= end) {
    // Extract TW date (UTC+8)
    const tw = new Date(cur.getTime() + 8 * 60 * 60 * 1000);
    const y = tw.getUTCFullYear();
    const m = String(tw.getUTCMonth() + 1).padStart(2, "0");
    const d = String(tw.getUTCDate()).padStart(2, "0");
    const dateStr = `${y}-${m}-${d}`;
    const dow = tw.getUTCDay(); // 0=Sun, 1=Mon, ...6=Sat

    const isHoliday = isTaiwanNationalHoliday(dateStr);

    if (dow === 0) {
      // Sunday: no revenue
    } else if (isHoliday) {
      // Holiday: use Saturday logic
      total += satRevenue;
    } else if (dow === 1) {
      total += monRevenue;
    } else if (dow >= 2 && dow <= 5) {
      total += tueFriRevenue;
    } else if (dow === 6) {
      total += satRevenue;
    }

    cur.setDate(cur.getDate() + 1);
  }

  return Math.round(total * 100) / 100;
}
