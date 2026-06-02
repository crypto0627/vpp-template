import { Summary } from "@/types/report-type";
import { ReportSummaryCard } from "@/components/report/report-summary-card";
import type { SiteId } from "@/types/data-type";
import { getSiteConfig } from "@/config/site-configs";

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

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <ReportSummaryCard
        label="總用電量"
        value={`${summary.totalKWh.toLocaleString()} kWh`}
        sub={`${summary.totalHours} 小時數據`}
      />
      <ReportSummaryCard
        label="無儲能花費"
        value={`$${summary.costWithoutBESS.toLocaleString()}`}
        sub="NT$ 流動電費"
      />
      <ReportSummaryCard
        label="有儲能花費"
        value={`$${summary.costWithBESS.toLocaleString()}`}
        sub="NT$ 流動電費"
      />
      <ReportSummaryCard
        label="裝儲能省了"
        value={`$${summary.savings.toLocaleString()}`}
        sub="NT$ 節省金額"
        highlight
      />
      {showDR && (
        <>
          <ReportSummaryCard
            label="需量反應扣減"
            value={`$${summary.drTotalCost.toLocaleString()}`}
            sub={`${summary.drDays} 天適用`}
            highlight
          />
        </>
      )}
      {showSReg && (
        <>
          <ReportSummaryCard
            label="最終電費"
            value={`$${summary.costWithBESSAfterDR.toLocaleString()}`}
            sub="有儲能 - DR扣減"
            highlight
          />
          <ReportSummaryCard
            label="sReg總收益"
            value={`$${summary.sRegRevenue.toLocaleString()}`}
            sub="電力輔助服務"
            highlight
          />
        </>
      )}
    </div>
  );
}
