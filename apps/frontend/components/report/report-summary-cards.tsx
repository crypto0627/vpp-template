import { Summary } from "@/types/report-type";
import { ReportSummaryCard } from "@/components/report/report-summary-card";
import type { SiteId } from "@/types/data-type";
import { getSiteConfig } from "@/config/site-configs";

function ntd(n: number) {
  return Math.round(n).toLocaleString("zh-TW");
}

export function ReportSummaryCards({
  summary,
  siteId,
}: {
  summary: Summary;
  siteId: SiteId;
}) {
  const config = getSiteConfig(siteId);
  const showDR = !!config.DR?.ENABLED;
  const showSReg = !!config.SREG?.ENABLED;

  // 尖離峰收益 = (尖峰放電量 × 尖峰電價) − (離峰充電量 × 離峰電價)
  const peakDischargeRevenue = summary.withoutPeakCost - summary.withPeakCost;
  const offPeakChargeCost = summary.withOffpeakCost - summary.withoutOffpeakCost;
  const peakArbitrage = peakDischargeRevenue - offPeakChargeCost;

  return (
    <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-5 gap-4">
      <ReportSummaryCard
        label="總用電量"
        value={`${summary.totalKWh.toLocaleString("zh-TW", { maximumFractionDigits: 1 })} kWh`}
        sub={`${summary.totalHours} 小時數據`}
      />
      <ReportSummaryCard
        label="尖離峰收益"
        value={`$${ntd(peakArbitrage)}`}
        sub="尖峰放電 − 離峰充電"
        highlight
      />
      {showDR && (
        <>
          <ReportSummaryCard
            label="需量反應扣減"
            value={`$${ntd(summary.drTotalCost)}`}
            sub={`${summary.drDays} 天適用`}
            highlight
          />
        </>
      )}
      {showSReg && (
        <>
          <ReportSummaryCard
            label="最終電費"
            value={`$${ntd(summary.costWithBESSAfterDR)}`}
            sub="有儲能 - DR扣減"
            highlight
          />
          <ReportSummaryCard
            label="sReg總收益"
            value={`$${ntd(summary.sRegRevenue)}`}
            sub="電力輔助服務"
            highlight
          />
        </>
      )}
    </div>
  );
}
