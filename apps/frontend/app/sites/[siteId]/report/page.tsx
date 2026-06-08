"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ChevronLeft, Inbox } from "lucide-react";
import HomeSidebar from "@/components/layout/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { ReportData } from "@/types/report-type";
import type { SiteId } from "@/types/data-type";
import { DateRangeSearch } from "@/components/ui/date-range-search";
import { exportReportCSV } from "@/utils/report-csv-export";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { SiteNav } from "@/components/site/site-nav";
import {
  CostComparisonChart,
  DRRevenueChart,
  SRegRevenueChart,
} from "@/components/home/finance-charts";

const ChartPlaceholder = () => <div className="h-48 bg-[#2A1A0F] rounded-xl animate-pulse" />;
const ReportSummaryCards = dynamic(() => import("@/components/report/report-summary-cards").then((m) => m.ReportSummaryCards), { loading: ChartPlaceholder });
const ReportEnergyBreakdown = dynamic(() => import("@/components/report/report-energy-breakdown").then((m) => m.ReportEnergyBreakdown), { loading: ChartPlaceholder });

const REPORT_SITE_IDS = ["neihu", "etai"] as const;
const SITE_TITLES: Record<string, string> = { neihu: "內湖 Evalue 旗艦站", etai: "億泰電纜儲能站" };

export default function FinancialReportPage() {
  const params = useParams();
  const siteId = Array.isArray(params.siteId) ? params.siteId[0] : params.siteId;
  const { isAuthorized, isLoading: authLoading } = useAuthGuard({ siteId: siteId as SiteId });

  const [startDate, setStartDate] = useState("2025-01-01");
  const [endDate, setEndDate] = useState("2025-01-01");
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorState, setErrorState] = useState<string | null>(null);

  const hasSiteData = REPORT_SITE_IDS.includes(siteId as (typeof REPORT_SITE_IDS)[number]);
  const siteTitle = (siteId && SITE_TITLES[siteId]) || "";

  const isEtai = siteId === "etai";

  const fetchReport = useCallback(async () => {
    if (!hasSiteData || !siteId) return;
    setLoading(true);
    setErrorState(null);
    try {
      const res = await fetch(`/api/${siteId}/report?start=${startDate}&end=${endDate}`);
      if (res.ok) {
        const data = await res.json();
        setReport(data);
        if (data.error === "NO_DATA" && data.message) setErrorState(data.message);
      } else if (res.status === 400) {
        const data = await res.json().catch(() => null);
        setReport(null);
        setErrorState(data?.message || "日期範圍無效，請重新選擇日期");
      } else {
        setReport(null);
        setErrorState("查無資料");
      }
    } catch {
      setReport(null);
      setErrorState("查無資料");
    }
    setLoading(false);
  }, [startDate, endDate, hasSiteData, siteId]);

  // Initial load + on site change; date edits apply only when 查詢 is pressed.
  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => { fetchReport(); }, [siteId]);

  if (authLoading) {
    return <div className="flex h-screen items-center justify-center bg-[#1E1208] text-white/50">載入中...</div>;
  }
  if (!isAuthorized) return null;

  return (
    <div className="flex flex-col lg:flex-row lg:h-screen bg-[#1E1208] lg:gap-4 lg:p-4">
      <HomeSidebar />
      <main className="flex-1 flex flex-col gap-4 text-white p-4 pb-24 lg:py-2 lg:px-0 lg:pb-0 lg:min-h-0 lg:overflow-y-auto">
        {/* Header */}
        <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2">
            <Link href={`/sites/${siteId}`} className="flex items-center gap-1 text-white/40 hover:text-[#E8883E] transition-colors text-sm">
              <ChevronLeft size={16} />返回監控
            </Link>
            <span className="text-white/20">/</span>
            <h1 className="text-lg font-bold">儲能效益分析報告</h1>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-white/40">{siteTitle}</span>
            <SiteNav siteId={siteId as SiteId} />
          </div>
        </div>

        {!hasSiteData && (
          <Card><CardContent className="py-16 text-center text-white/50">此站點暫無財報數據</CardContent></Card>
        )}

        {hasSiteData && (
          <>
            <Card>
              <CardContent className="pt-4 pb-4">
                <DateRangeSearch
                  startDate={startDate}
                  endDate={endDate}
                  loading={loading}
                  onStartChange={(v) => { setStartDate(v); if (endDate < v) setEndDate(v); }}
                  onEndChange={(v) => setEndDate(v)}
                  onSearch={fetchReport}
                  rightSlot={
                    !!report && report.dailyReport.length > 0 ? (
                      <button
                        onClick={() => report && exportReportCSV(report, startDate, endDate)}
                        className="px-4 py-2 text-sm font-medium bg-[#E8883E] text-white rounded-lg hover:bg-[#d4762e] transition-colors whitespace-nowrap"
                      >
                        CSV 匯出
                      </button>
                    ) : undefined
                  }
                />
              </CardContent>
            </Card>

            {loading && <div className="text-center py-16 text-white/50">分析中…</div>}

            {!loading && errorState && (
              <Card>
                <CardContent className="py-16 flex flex-col items-center justify-center gap-4 text-center">
                  <Inbox size={40} className="text-white/30" strokeWidth={1.5} />
                  <div className="space-y-1">
                    <p className="text-white/80 font-medium">查無資料</p>
                    <p className="text-sm text-white/40">{errorState}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {!loading && !errorState && report?.dailyReport.length === 0 && (
              <Card><CardContent className="py-16 text-center text-white/50">該日期範圍內無充電記錄</CardContent></Card>
            )}

            {!loading && !errorState && report && report.dailyReport.length > 0 && (() => {
              const multiDay = report.dailyReport.length > 1;
              return (
                <>
                  <ReportSummaryCards summary={report.summary} siteId={siteId as SiteId} />

                  <ReportEnergyBreakdown summary={report.summary} />

                  {/* Finance charts — hidden for single-day selection */}
                  {multiDay && <CostComparisonChart dailyReport={report.dailyReport} height={220} />}
                  {multiDay && isEtai && <DRRevenueChart   dailyReport={report.dailyReport} height={180} />}
                  {multiDay && isEtai && <SRegRevenueChart dailyReport={report.dailyReport} height={180} />}
                </>
              );
            })()}
          </>
        )}
      </main>
    </div>
  );
}
