/**
 * Report Generator
 *
 * Shared report generation logic used by per-site report API routes.
 * Each route loads its own data source (and transforms it into HourlyPowerRecord),
 * then calls `generateReport` with its site config.
 */

import { isPeakTimeTW, isSemiPeakTimeTW } from "@/utils/bess-algorithm/time-utils";
import { isNationalHolidayTW } from "@/constants/taiwan-holidays";
import {
  type SiteSimulationConfig,
  isSummerDate,
  getSohForYear,
  getDCCapacity,
  isDRSeasonDate,
  getDailyDRCost,
  calculateSRegRevenue,
} from "@/config/site-configs";

function getSRegForDate(config: SiteSimulationConfig, dateStr: string): number {
  if (!config.SREG?.ENABLED) return 0;
  const sreg = config.SREG;
  const price = sreg.PRICE_PER_MW_HOUR;
  const uf = sreg.UTILIZATION_FACTOR;
  const calcSlots = (slots: { mw: number; hours: number }[]) =>
    slots.reduce((sum, s) => sum + s.mw * price * s.hours, 0) * uf;

  const dt = new Date(`${dateStr}T12:00:00+08:00`);
  const dow = dt.getDay();
  const isHoliday = isNationalHolidayTW(dt);

  if (dow === 0) return 0;
  if (isHoliday || dow === 6) return calcSlots(sreg.SATURDAY);
  if (dow === 1) return calcSlots(sreg.MONDAY);
  return calcSlots(sreg.TUE_TO_FRI);
}

/** Resolve peak/semi-peak/off-peak rate from a site config based on date. */
function getRateFromConfig(
  date: Date,
  config: SiteSimulationConfig,
): { peakRate: number; semiPeakRate: number; offRate: number } {
  const tw = new Date(date.getTime() + 8 * 60 * 60 * 1000);
  const month = tw.getUTCMonth() + 1;
  const day = tw.getUTCDate();
  const summer = isSummerDate(month, day, config);
  return {
    peakRate: summer ? config.SUMMER_PEAK_RATE : config.NON_SUMMER_PEAK_RATE,
    semiPeakRate: summer
      ? config.SUMMER_SEMI_PEAK_RATE
      : config.NON_SUMMER_SEMI_PEAK_RATE,
    offRate: summer
      ? config.SUMMER_OFFPEAK_RATE
      : config.NON_SUMMER_OFFPEAK_RATE,
  };
}

/** Get available charging hours before peak starts for a given date and config. */
function getChargeHoursBeforePeak(
  date: Date,
  config: SiteSimulationConfig,
): number {
  if (config.PRICING_MODEL === "ev-charging") {
    const tw = new Date(date.getTime() + 8 * 60 * 60 * 1000);
    const month = tw.getUTCMonth() + 1;
    const isSummer = config.SUMMER_MONTHS.includes(month);
    if (isSummer) {
      return config.PEAK_START_HOUR + config.PEAK_START_MINUTE / 60;
    } else {
      return (
        config.NON_SUMMER_PEAK_START_HOUR +
        config.NON_SUMMER_PEAK_START_MINUTE / 60
      );
    }
  }
  // batch-tou: unified peak hours
  return config.PEAK_START_HOUR + config.PEAK_START_MINUTE / 60;
}

// 每小時用電快照
export interface HourlyPowerRecord {
  date_timerange: string; // ISO timestamp
  "power(kwh)": number; // Power consumption for this hour
}

// --- 台灣時間工具 (UTC+8) ---
function getTW(utc: Date) {
  const tw = new Date(utc.getTime() + 8 * 60 * 60 * 1000);
  return {
    year: tw.getUTCFullYear(),
    month: tw.getUTCMonth() + 1,
    day: tw.getUTCDate(),
    hour: tw.getUTCHours(),
    dow: tw.getUTCDay(), // 0=Sun
  };
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export interface ReportResult {
  status: "ok" | "no_data" | "invalid_range";
  payload: unknown;
}

/**
 * Generate a BESS effectiveness report for a date range using the
 * supplied hourly load records and site config.
 */
export function generateReport(
  allData: HourlyPowerRecord[],
  config: SiteSimulationConfig,
  start: string,
  end: string,
): ReportResult {
  // 日期範圍 → 台灣時間 midnight ~ 23:59
  const msStart = new Date(`${start}T00:00:00+08:00`).getTime();
  const msEnd = new Date(`${end}T23:59:59.999+08:00`).getTime();

  if (isNaN(msStart) || isNaN(msEnd)) {
    return {
      status: "invalid_range",
      payload: { error: "Invalid date format" },
    };
  }

  // 1. 過濾每小時用電記錄
  const filteredRecords = allData.filter((rec) => {
    if (rec["power(kwh)"] <= 0) return false;

    const recTime = new Date(rec.date_timerange);
    if (isNaN(recTime.getTime())) return false;

    const twDate = getTW(recTime);
    const recDateKey = `${twDate.year}-${String(twDate.month).padStart(2, "0")}-${String(twDate.day).padStart(2, "0")}`;

    return recDateKey >= start && recDateKey <= end;
  });

  if (filteredRecords.length === 0) {
    return {
      status: "no_data",
      payload: {
        error: "NO_DATA",
        message: `所選日期範圍（${start} 至 ${end}）沒有可用的用電數據`,
        summary: {
          totalHours: 0,
          totalPeakKWh: 0,
          totalOffPeakKWh: 0,
          totalKWh: 0,
          costWithoutBESS: 0,
          costWithBESS: 0,
          savings: 0,
          savingsRate: 0,
          peakSavingsKWh: 0,
          withoutPeakCost: 0,
          withoutOffpeakCost: 0,
          withPeakCost: 0,
          withOffpeakCost: 0,
          totalOverContractCount: 0,
          totalBessSuppressedCount: 0,
          totalPeakGridSupplementCount: 0,
          drDays: 0,
          drTotalCost: 0,
          costWithBESSAfterDR: 0,
        },
        dailyReport: [],
      },
    };
  }

  // 2. 按日分組統計尖峰/半尖峰/離峰用電
  const dayMapNoStorage = new Map<
    string,
    {
      peakKWh: number;
      semiPeakKWh: number;
      offPeakKWh: number;
      hours: number;
      month: number;
    }
  >();

  for (const rec of filteredRecords) {
    const recTime = new Date(rec.date_timerange);

    const tw = getTW(recTime);
    const key = `${tw.year}-${String(tw.month).padStart(2, "0")}-${String(tw.day).padStart(2, "0")}`;

    const row = dayMapNoStorage.get(key) ?? {
      peakKWh: 0,
      semiPeakKWh: 0,
      offPeakKWh: 0,
      hours: 0,
      month: tw.month,
    };
    row.hours++;

    // 國定假日：所有用電算離峰（與週末相同）
    if (isNationalHolidayTW(recTime)) {
      row.offPeakKWh += rec["power(kwh)"];
    } else if (isPeakTimeTW(recTime, config)) {
      row.peakKWh += rec["power(kwh)"];
    } else if (isSemiPeakTimeTW(recTime, config)) {
      row.semiPeakKWh += rec["power(kwh)"];
    } else {
      row.offPeakKWh += rec["power(kwh)"];
    }
    dayMapNoStorage.set(key, row);
  }

  // 2.5 按日分組逐小時紀錄（供超約偵測）
  const dayHourlyRecords = new Map<string, HourlyPowerRecord[]>();
  for (const rec of filteredRecords) {
    const recTime = new Date(rec.date_timerange);
    const tw = getTW(recTime);
    const key = `${tw.year}-${String(tw.month).padStart(2, "0")}-${String(tw.day).padStart(2, "0")}`;
    const arr = dayHourlyRecords.get(key) ?? [];
    arr.push(rec);
    dayHourlyRecords.set(key, arr);
  }

  // 3. 計算儲能模擬數據：跨日的電池 SOC 狀態
  const PCS_MAX_POWER = config.PCS_CAPACITY_KW;
  const CHARGE_EFF = config.CHARGE_EFFICIENCY;
  const DISCHARGE_EFF = config.DISCHARGE_EFFICIENCY;

  const getSoh = (year: number): number => getSohForYear(config, year);

  const allDates = Array.from(dayMapNoStorage.keys()).sort();

  // 從數據集第一天開始計算 SOC（保證連續性）
  let currentSOC = 0;
  const socMap = new Map<
    string,
    {
      start: number;
      end: number;
      chargedKWh: number;
      dischargedKWh: number;
      soh: number;
      capacityKWh: number;
      overContractCount: number;
      bessSuppressedCount: number;
      peakGridSupplementCount: number;
    }
  >();

  for (const date of allDates) {
    const noStorage = dayMapNoStorage.get(date);
    if (!noStorage) continue;

    const startSOC = currentSOC;

    const dateObj = new Date(`${date}T12:00:00+08:00`);
    const year = dateObj.getFullYear();
    const dayOfWeek = dateObj.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isHoliday = isNationalHolidayTW(dateObj);
    const isNonWorkingDay = isWeekend || isHoliday;

    // DC側可用容量 = 原始容量 × SOH（電池 SOC 上限）
    const soh = getSoh(year);
    const BESS_CAPACITY = getDCCapacity(config, year);

    // 若 SOC 超過新容量上限（跨年 SOH 衰退），截斷
    currentSOC = Math.min(currentSOC, BESS_CAPACITY);

    let gridChargeKWh = 0;
    let peakReplacedKWh = 0;

    // 3.1 逐小時超約偵測 + 需量反應放電
    let overContractCount = 0;
    let bessSuppressedCount = 0;
    let peakGridSupplementCount = 0;
    const hourlyRecords = dayHourlyRecords.get(date) ?? [];

    if (!isNonWorkingDay && noStorage.peakKWh > 0) {
      // Available charge hours: 00:00 to peak start
      const availableChargeHours = getChargeHoursBeforePeak(dateObj, config);
      // 用電負載＋充電不能超過契約容量的 90%
      const chargeCapKW = config.CONTRACT_LIMIT_KW * 0.9;
      const peakHours = noStorage.hours - availableChargeHours;
      const offPeakHours = Math.max(1, noStorage.hours - Math.max(0, peakHours));
      const avgOffPeakLoadKW = noStorage.offPeakKWh / offPeakHours;
      const availableChargePowerKW = Math.min(
        PCS_MAX_POWER,
        Math.max(0, chargeCapKW - avgOffPeakLoadKW),
      );
      const maxChargeKWh = availableChargePowerKW * availableChargeHours;

      const batteryChargedKWh = Math.min(
        BESS_CAPACITY - currentSOC,
        maxChargeKWh,
      );
      gridChargeKWh = batteryChargedKWh / CHARGE_EFF;
      currentSOC += batteryChargedKWh;

      // 需量反應：逐小時掃描，超約時優先放電抑低
      for (const rec of hourlyRecords) {
        const loadKW = rec["power(kwh)"];
        if (loadKW > config.CONTRACT_LIMIT_KW) {
          overContractCount++;
          const excessKW = loadKW - config.CONTRACT_LIMIT_KW;
          const suppressableKW = Math.min(excessKW, PCS_MAX_POWER);
          // 1 小時間隔，電池需提供的能量
          const drEnergyFromBattery =
            (suppressableKW * 1) / DISCHARGE_EFF;
          if (currentSOC >= drEnergyFromBattery) {
            currentSOC -= drEnergyFromBattery;
            bessSuppressedCount++;
          }
        }
      }

      // 尖峰放電：逐小時模擬削峰，計算電網補充次數
      const peakRecords = hourlyRecords.filter((rec) =>
        isPeakTimeTW(new Date(rec.date_timerange), config),
      );

      for (const rec of peakRecords) {
        const loadKW = rec["power(kwh)"];
        const maxDischargeKW = Math.min(loadKW, PCS_MAX_POWER);
        const energyNeededDC = maxDischargeKW / DISCHARGE_EFF;
        const actualDischargeDC = Math.min(energyNeededDC, currentSOC);
        const actualDischargeAC = actualDischargeDC * DISCHARGE_EFF;

        if (actualDischargeAC < loadKW) {
          peakGridSupplementCount++;
        }

        currentSOC -= actualDischargeDC;
        peakReplacedKWh += actualDischargeAC;
      }
      // DR 夜間充電 (22:00~24:00)：DR期間工作日額外充電
      if (config.DR?.ENABLED) {
        const tw = getTW(dateObj);
        if (isDRSeasonDate(tw.month, tw.day, config)) {
          const drChargeKW = config.DR.NIGHT_CHARGE_KW;
          const drChargeHours = 2; // 22:00~24:00
          const drChargeEnergy = Math.min(
            drChargeKW * drChargeHours,
            BESS_CAPACITY - currentSOC,
          );
          if (drChargeEnergy > 0) {
            gridChargeKWh += drChargeEnergy / CHARGE_EFF;
            currentSOC += drChargeEnergy;
          }
        }
      }
    } else {
      // 非工作日或無尖峰：仍需偵測超約（不放電）
      for (const rec of hourlyRecords) {
        if (rec["power(kwh)"] > config.CONTRACT_LIMIT_KW) {
          overContractCount++;
        }
      }
    }

    const endSOC = currentSOC;

    socMap.set(date, {
      start: startSOC,
      end: endSOC,
      chargedKWh: gridChargeKWh,
      dischargedKWh: peakReplacedKWh,
      soh,
      capacityKWh: BESS_CAPACITY,
      overContractCount,
      bessSuppressedCount,
      peakGridSupplementCount,
    });
  }

  // 4. 生成每日報告
  const totals = {
    hours: 0,
    peakKWh: 0,
    semiPeakKWh: 0,
    offPeakKWh: 0,
    withoutTotal: 0,
    withTotal: 0,
    withoutPeak: 0,
    withoutSemiPeak: 0,
    withoutOffpeak: 0,
    withPeak: 0,
    withSemiPeak: 0,
    withOffpeak: 0,
    peakOffset: 0,
    overContractCount: 0,
    bessSuppressedCount: 0,
    peakGridSupplementCount: 0,
    drDays: 0,
    drTotalCost: 0,
  };

  const dailyReport = Array.from(dayMapNoStorage.keys())
    .sort()
    .map((date) => {
      const noStorage = dayMapNoStorage.get(date);
      const soc = socMap.get(date);
      if (!noStorage || !soc) return null;

      const dateObj = new Date(`${date}T12:00:00+08:00`);
      const { peakRate, semiPeakRate, offRate } = getRateFromConfig(
        dateObj,
        config,
      );

      const woPeak = noStorage.peakKWh * peakRate;
      const woSemiPeak = noStorage.semiPeakKWh * semiPeakRate;
      const woOff = noStorage.offPeakKWh * offRate;

      const gridChargeKWh = soc.chargedKWh;
      const peakReplacedKWh = soc.dischargedKWh;

      const withPeak = (noStorage.peakKWh - peakReplacedKWh) * peakRate;
      const withSemiPeak = noStorage.semiPeakKWh * semiPeakRate;
      const withOff = (noStorage.offPeakKWh + gridChargeKWh) * offRate;

      // DR 電費扣減：5/1~10/31 工作日（排除假日）
      let dailyDR = 0;
      const dow = dateObj.getDay();
      const isWorkingDay = dow >= 1 && dow <= 5 && !isNationalHolidayTW(dateObj);
      const twForDR = getTW(dateObj);
      if (isWorkingDay && isDRSeasonDate(twForDR.month, twForDR.day, config)) {
        dailyDR = getDailyDRCost(config);
      }

      totals.hours += noStorage.hours;
      totals.peakKWh += noStorage.peakKWh;
      totals.semiPeakKWh += noStorage.semiPeakKWh;
      totals.offPeakKWh += noStorage.offPeakKWh;
      totals.withoutTotal += woPeak + woSemiPeak + woOff;
      totals.withTotal += withPeak + withSemiPeak + withOff;
      totals.withoutPeak += woPeak;
      totals.withoutSemiPeak += woSemiPeak;
      totals.withoutOffpeak += woOff;
      totals.withPeak += withPeak;
      totals.withSemiPeak += withSemiPeak;
      totals.withOffpeak += withOff;
      totals.peakOffset += peakReplacedKWh;
      totals.overContractCount += soc.overContractCount;
      totals.bessSuppressedCount += soc.bessSuppressedCount;
      totals.peakGridSupplementCount += soc.peakGridSupplementCount;
      if (dailyDR > 0) {
        totals.drDays++;
        totals.drTotalCost += dailyDR;
      }

      return {
        date,
        peakKWh: round2(noStorage.peakKWh),
        offPeakKWh: round2(noStorage.semiPeakKWh + noStorage.offPeakKWh),
        hours: noStorage.hours,
        withoutBESS: round2(woPeak + woSemiPeak + woOff),
        withBESS: round2(withPeak + withSemiPeak + withOff),
        savings: round2(
          woPeak + woSemiPeak + woOff - withPeak - withSemiPeak - withOff,
        ),
        chargedKWh: round2(gridChargeKWh),
        dischargedKWh: round2(peakReplacedKWh),
        startSOC: round2(soc.start),
        endSOC: round2(soc.end),
        soh: round2(soc.soh * 100),
        capacityKWh: round2(soc.capacityKWh),
        overContractCount: soc.overContractCount,
        bessSuppressedCount: soc.bessSuppressedCount,
        peakGridSupplementCount: soc.peakGridSupplementCount,
        drCost: round2(dailyDR),
        sRegRevenue: round2(getSRegForDate(config, date)),
      };
    })
    .filter((x) => x !== null);

  const savings = totals.withoutTotal - totals.withTotal;
  const sRegRevenue = calculateSRegRevenue(config, start, end);
  const costAfterDR = round2(totals.withTotal - totals.drTotalCost);

  return {
    status: "ok",
    payload: {
      summary: {
        totalHours: totals.hours,
        totalPeakKWh: round2(totals.peakKWh),
        totalOffPeakKWh: round2(totals.semiPeakKWh + totals.offPeakKWh),
        totalKWh: round2(
          totals.peakKWh + totals.semiPeakKWh + totals.offPeakKWh,
        ),
        costWithoutBESS: round2(totals.withoutTotal),
        costWithBESS: round2(totals.withTotal),
        savings: round2(savings),
        savingsRate:
          totals.withoutTotal > 0
            ? round2((savings / totals.withoutTotal) * 100)
            : 0,
        peakSavingsKWh: round2(totals.peakOffset),
        withoutPeakCost: round2(totals.withoutPeak),
        withoutOffpeakCost: round2(
          totals.withoutSemiPeak + totals.withoutOffpeak,
        ),
        withPeakCost: round2(totals.withPeak),
        withOffpeakCost: round2(totals.withSemiPeak + totals.withOffpeak),
        totalOverContractCount: totals.overContractCount,
        totalBessSuppressedCount: totals.bessSuppressedCount,
        totalPeakGridSupplementCount: totals.peakGridSupplementCount,
        drDays: totals.drDays,
        drTotalCost: round2(totals.drTotalCost),
        costWithBESSAfterDR: costAfterDR,
        sRegRevenue: round2(sRegRevenue),
        costWithBESSFinal: round2(costAfterDR - sRegRevenue),
      },
      dailyReport,
    },
  };
}
