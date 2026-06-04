/**
 * Taiwan Time Utilities
 *
 * Date/time helpers, peak/off-peak detection, holiday/weekend checks.
 */

import { isNationalHolidayTW } from "@/constants/taiwan-holidays";
import type { SiteSimulationConfig } from "@/config/site-configs";

/**
 * 獲取台灣時間字串（YYYY-MM-DD）
 */
export function getTaiwanDateString(utcTime: Date): string {
  const timeMs = utcTime.getTime();
  if (isNaN(timeMs)) {
    console.error("Invalid date passed to getTaiwanDateString:", utcTime);
    return "1970-01-01";
  }
  const tw = new Date(timeMs + 8 * 60 * 60 * 1000);
  const year = tw.getUTCFullYear();
  const month = String(tw.getUTCMonth() + 1).padStart(2, "0");
  const day = String(tw.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * 獲取台灣時間的小時和分鐘
 */
export function getTaiwanTime(utcTime: Date): {
  hour: number;
  minute: number;
  dayOfWeek: number;
} {
  const tw = new Date(utcTime.getTime() + 8 * 60 * 60 * 1000);
  return {
    hour: tw.getUTCHours(),
    minute: tw.getUTCMinutes(),
    dayOfWeek: tw.getUTCDay(),
  };
}

/**
 * 判斷是否為尖峰時段（台灣時間）
 * 工作日(週一至週五)才有尖峰時段，週末和國定假日全部為離峰
 * ev-charging: 夏/非夏月有不同尖峰時段
 * batch-tou: 統一尖峰時段
 */
export function isPeakTimeTW(utc: Date, config: SiteSimulationConfig): boolean {
  const tw = new Date(utc.getTime() + 8 * 60 * 60 * 1000);
  const dow = tw.getUTCDay();

  // Only weekdays (Mon-Fri) have peak hours
  if (dow === 0 || dow === 6) return false;
  if (isNationalHolidayTW(utc)) return false;

  const minutes = tw.getUTCHours() * 60 + tw.getUTCMinutes();

  // ev-charging: season-dependent peak hours
  if (config.PRICING_MODEL === "ev-charging") {
    const month = tw.getUTCMonth() + 1;
    const isSummer = config.SUMMER_MONTHS.includes(month);
    if (isSummer) {
      const start = config.PEAK_START_HOUR * 60 + config.PEAK_START_MINUTE;
      const end = config.PEAK_END_HOUR * 60 + config.PEAK_END_MINUTE;
      return minutes >= start && minutes < end;
    } else {
      const start =
        config.NON_SUMMER_PEAK_START_HOUR * 60 +
        config.NON_SUMMER_PEAK_START_MINUTE;
      const end =
        config.NON_SUMMER_PEAK_END_HOUR * 60 +
        config.NON_SUMMER_PEAK_END_MINUTE;
      return minutes >= start && minutes < end;
    }
  }

  // batch-tou: unified peak hours
  const peakStart = config.PEAK_START_HOUR * 60 + config.PEAK_START_MINUTE;
  const peakEnd = config.PEAK_END_HOUR * 60 + config.PEAK_END_MINUTE;
  return minutes >= peakStart && minutes < peakEnd;
}

/**
 * 判斷是否為半尖峰時段（台灣時間）
 * 僅 batch-tou 模式下週六有半尖峰時段（國定假日除外）
 * ev-charging 模式無半尖峰
 */
export function isSemiPeakTimeTW(
  utc: Date,
  config: SiteSimulationConfig,
): boolean {
  // ev-charging has no semi-peak
  if (config.PRICING_MODEL === "ev-charging") return false;

  const tw = new Date(utc.getTime() + 8 * 60 * 60 * 1000);
  const dow = tw.getUTCDay();

  // Only Saturday has semi-peak hours
  if (dow !== 6) return false;
  if (isNationalHolidayTW(utc)) return false;

  const minutes = tw.getUTCHours() * 60 + tw.getUTCMinutes();
  const semiStart =
    config.SEMI_PEAK_START_HOUR * 60 + config.SEMI_PEAK_START_MINUTE;
  const semiEnd = config.SEMI_PEAK_END_HOUR * 60 + config.SEMI_PEAK_END_MINUTE;
  return minutes >= semiStart && minutes < semiEnd;
}

/**
 * 檢查是否跨越午夜（台灣時間）
 */
export function crossesMidnightTW(
  startTimeMs: number,
  endTimeMs: number,
): boolean {
  const startDate = getTaiwanDateString(new Date(startTimeMs));
  const endDate = getTaiwanDateString(new Date(endTimeMs));
  return startDate !== endDate;
}

/**
 * 檢查儲能系統是否應該停用
 * 國定假日時儲能系統完全不作用（不充電、不放電）
 */
export function shouldDisableBESS(utc: Date): boolean {
  return isNationalHolidayTW(utc);
}

/**
 * 檢查是否為週末或國定假日（台灣時間）
 * 週末和假日不應啟動充電會話
 */
export function isWeekendOrHoliday(utc: Date): boolean {
  const tw = new Date(utc.getTime() + 8 * 60 * 60 * 1000);
  const dow = tw.getUTCDay();

  if (dow === 0 || dow === 6) return true;
  return isNationalHolidayTW(utc);
}

/**
 * 找到下一個午夜時間點（台灣時間）
 */
export function getNextMidnightTW(currentTimeMs: number): number {
  if (isNaN(currentTimeMs)) {
    console.error("Invalid time passed to getNextMidnightTW:", currentTimeMs);
    return Date.now();
  }
  const tw = new Date(currentTimeMs + 8 * 60 * 60 * 1000);
  const nextMidnightTW = new Date(
    Date.UTC(
      tw.getUTCFullYear(),
      tw.getUTCMonth(),
      tw.getUTCDate() + 1,
      0,
      0,
      0,
      0,
    ),
  );
  return nextMidnightTW.getTime() - 8 * 60 * 60 * 1000;
}
