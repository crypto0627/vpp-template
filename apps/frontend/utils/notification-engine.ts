import type { SummaryData, SiteId } from "@/types/data-type";
import type { TelemetryData } from "@/types/telemetry";
import type { PendingNotification } from "@/types/notification-type";
import { NOTIFICATION_THRESHOLDS, SITE_NAMES } from "@/constants/notification-rules";

interface EngineInput {
  summaryData: Record<SiteId, SummaryData>;
  data: Record<SiteId, TelemetryData[]>;
  lastUpdated: Date | null;
  now: Date;
  allowedSites: SiteId[];
}

function isDRSeason(now: Date): boolean {
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const { drStartMonth, drStartDay, drEndMonth, drEndDay } = NOTIFICATION_THRESHOLDS.etai;
  if (month < drStartMonth || month > drEndMonth) return false;
  if (month === drStartMonth && day < drStartDay) return false;
  if (month === drEndMonth && day > drEndDay) return false;
  return true;
}

export function evaluateNotificationRules(
  input: EngineInput,
): Array<PendingNotification & { ruleId: string }> {
  const { summaryData, data, lastUpdated, now, allowedSites } = input;
  const results: Array<PendingNotification & { ruleId: string }> = [];

  if (allowedSites.includes("neihu")) {
    const neihuData = data.neihu ?? [];
    const neihuSummary = summaryData.neihu;
    const th = NOTIFICATION_THRESHOLDS.neihu;

    const soc = neihuSummary?.energyStorage?.value ?? 0;

    if (soc > 0 && soc < th.socLowPct) {
      results.push({
        ruleId: "neihu-soc-low",
        siteId: "neihu",
        siteName: SITE_NAMES.neihu,
        severity: "warning",
        title: "電池電量不足",
        message: `目前 SOC ${soc.toFixed(1)}%，低於警戒值 ${th.socLowPct}%，請注意充電排程`,
        createdAt: now.toISOString(),
      });
    }

    if (soc >= th.socFullPct) {
      results.push({
        ruleId: "neihu-soc-full",
        siteId: "neihu",
        siteName: SITE_NAMES.neihu,
        severity: "info",
        title: "電池已充飽",
        message: `目前 SOC ${soc.toFixed(1)}%，電池已完成充電`,
        createdAt: now.toISOString(),
      });
    }

    const latestData = neihuData.length > 0 ? neihuData[neihuData.length - 1] : null;
    if (latestData) {
      const powerKW = (latestData.TotalUsage ?? 0) / 1000;
      const warnLimit = th.contractKW * th.powerWarnRatio;
      const criticalLimit = th.contractKW * th.powerCriticalRatio;
      const ratio = Math.round((powerKW / th.contractKW) * 100);

      if (powerKW >= criticalLimit) {
        results.push({
          ruleId: "neihu-power-critical",
          siteId: "neihu",
          siteName: SITE_NAMES.neihu,
          severity: "critical",
          title: "需量超約",
          message: `目前需量 ${powerKW.toFixed(0)} kW，超過契約容量 ${th.contractKW} kW（${ratio}%）`,
          createdAt: now.toISOString(),
        });
      } else if (powerKW >= warnLimit) {
        results.push({
          ruleId: "neihu-power-warning",
          siteId: "neihu",
          siteName: SITE_NAMES.neihu,
          severity: "warning",
          title: "需量接近超約",
          message: `目前需量 ${powerKW.toFixed(0)} kW，達契約容量 ${th.contractKW} kW 的 ${ratio}%`,
          createdAt: now.toISOString(),
        });
      }
    }

    if (lastUpdated && neihuData.length > 0) {
      const minutesAgo = (now.getTime() - lastUpdated.getTime()) / 60000;
      if (minutesAgo >= th.dataStaleMinutes) {
        results.push({
          ruleId: "neihu-data-stale",
          siteId: "neihu",
          siteName: SITE_NAMES.neihu,
          severity: "warning",
          title: "資料更新中斷",
          message: `最後更新於 ${Math.round(minutesAgo)} 分鐘前，請確認網路連線狀態`,
          createdAt: now.toISOString(),
        });
      }
    }

    const piles = neihuSummary?.chargingPiles;
    if (piles && piles.total > 0 && piles.active === 0 && neihuData.length > 0) {
      results.push({
        ruleId: "neihu-charger-idle",
        siteId: "neihu",
        siteName: SITE_NAMES.neihu,
        severity: "info",
        title: "充電樁閒置",
        message: `目前所有 ${piles.total} 座充電樁均閒置，無車輛充電中`,
        createdAt: now.toISOString(),
      });
    }
  }

  if (allowedSites.includes("etai") && isDRSeason(now)) {
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const { drStartMonth, drStartDay } = NOTIFICATION_THRESHOLDS.etai;
    const isSeasonStart = month === drStartMonth && day === drStartDay;
    const prefix = isSeasonStart ? "需量反應季節今日開始，" : "目前為需量反應季節，";
    results.push({
      ruleId: "etai-dr-season-active",
      siteId: "etai",
      siteName: SITE_NAMES.etai,
      severity: "info",
      title: "需量反應 (DR) 季節",
      message: `${prefix}執行期間每日可獲得 NT$8,832 DR 補貼（5/1 - 10/31）`,
      createdAt: now.toISOString(),
    });
  }

  return results;
}
