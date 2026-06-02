"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Card, CardContent } from "@/components/ui/card";
import { Navbar } from "@/components/home/navbar";
import { ReportData } from "@/types/report-type";
import type { SiteId } from "@/types/data-type";
import { ReportDatePicker } from "@/components/report/report-date-picker";
import { exportReportCSV } from "@/utils/report-csv-export";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { PageLoading } from "@/components/ui";

// Code-split heavy chart/table components
const ChartPlaceholder = () => (
  <div className="h-48 bg-gray-50 rounded-lg animate-pulse flex items-center justify-center text-gray-400 text-sm">
    載入元件中…
  </div>
);
const ReportSummaryCards = dynamic(
  () =>
    import("@/components/report/report-summary-cards").then(
      (m) => m.ReportSummaryCards,
    ),
  { loading: ChartPlaceholder },
);
const ReportEnergyBreakdown = dynamic(
  () =>
    import("@/components/report/report-energy-breakdown").then(
      (m) => m.ReportEnergyBreakdown,
    ),
  { loading: ChartPlaceholder },
);
const ReportTrendChart = dynamic(
  () =>
    import("@/components/report/report-trend-chart").then(
      (m) => m.ReportTrendChart,
    ),
  { loading: ChartPlaceholder },
);
const ReportCumulativeSavingsChart = dynamic(
  () =>
    import("@/components/report/report-cumulative-savings-chart").then(
      (m) => m.ReportCumulativeSavingsChart,
    ),
  { loading: ChartPlaceholder },
);
const ReportDetailTable = dynamic(
  () =>
    import("@/components/report/report-detail-table").then(
      (m) => m.ReportDetailTable,
    ),
  { loading: ChartPlaceholder },
);

export default function FinancialReportPage() {
  const params = useParams();
  const siteId = Array.isArray(params.siteId)
    ? params.siteId[0]
    : params.siteId;

  const { isAuthenticated, isLoading: authLoading } = useAuthGuard({
    siteId: siteId as SiteId,
  });
  const [dateMode, setDateMode] = useState<"single" | "range">("single");
  const [startDate, setStartDate] = useState("2025-01-01");
  const [endDate, setEndDate] = useState("2025-12-01");
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const REPORT_SITE_IDS = ["neihu", "etai"] as const;
  const hasSiteData = REPORT_SITE_IDS.includes(
    siteId as (typeof REPORT_SITE_IDS)[number],
  );
  const effectiveEnd = dateMode === "single" ? startDate : endDate;

  const SITE_TITLES: Record<string, string> = {
    neihu: "內湖 Evalue 旗艦站",
    etai: "億泰電纜儲能站",
  };
  const siteTitle = (siteId && SITE_TITLES[siteId]) || "";

  // --------------- Fetch ---------------
  const fetchReport = useCallback(async () => {
    if (!hasSiteData || !siteId) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch(
        `/api/${siteId}/report?start=${startDate}&end=${effectiveEnd}`,
      );
      if (res.ok) {
        const data = await res.json();
        setReport(data);

        // Check if API returned NO_DATA error
        if (data.error === "NO_DATA" && data.message) {
          setErrorMessage(data.message);
        }
      } else {
        setReport(null);
        setErrorMessage("無法載入報告數據，請稍後再試");
      }
    } catch {
      setReport(null);
      setErrorMessage("網路錯誤，請檢查連線後重試");
    }
    setLoading(false);
  }, [startDate, effectiveEnd, hasSiteData, siteId]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // --------------- Handlers ---------------
  const handleDateModeChange = (mode: "single" | "range") => {
    setDateMode(mode);
    if (mode === "range") setEndDate(startDate);
  };

  const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStartDate(e.target.value);
    if (dateMode === "range" && endDate < e.target.value)
      setEndDate(e.target.value);
  };

  const handleEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEndDate(e.target.value);
  };

  // --------------- Render ---------------
  if (authLoading) {
    return <PageLoading text="載入中..." className="h-screen" />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              儲能效益分析報告
            </h1>
            <p className="text-base text-gray-500 mt-0.5">
              {siteTitle} — 裝儲能 vs 不裝儲能
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/sites/${siteId}/history`}
              className="px-3 sm:px-4 py-2 text-sm sm:text-base bg-[#DA7756] text-white rounded-md hover:bg-[#C2614A] transition-colors whitespace-nowrap"
            >
              歷史數據
            </Link>
            <Link
              href={`/sites/${siteId}`}
              className="px-3 sm:px-4 py-2 text-sm sm:text-base bg-white border border-gray-300 text-gray-900 rounded-md hover:bg-gray-100 transition-colors whitespace-nowrap"
            >
              返回監控
            </Link>
            <Link
              href="/"
              className="px-3 sm:px-4 py-2 text-sm sm:text-base bg-white border border-gray-300 text-gray-900 rounded-md hover:bg-gray-100 transition-colors whitespace-nowrap"
            >
              首頁
            </Link>
          </div>
        </div>

        {/* No data for this site */}
        {!hasSiteData && (
          <Card>
            <CardContent className="py-16 text-center text-base text-gray-500">
              此站點暫無財報數據
            </CardContent>
          </Card>
        )}

        {hasSiteData && (
          <>
            <ReportDatePicker
              dateMode={dateMode}
              startDate={startDate}
              endDate={endDate}
              onDateModeChange={handleDateModeChange}
              onStartDateChange={handleStartChange}
              onEndDateChange={handleEndChange}
              showExport={!!report && report.dailyReport.length > 0}
              onExport={() =>
                report && exportReportCSV(report, startDate, effectiveEnd)
              }
            />

            {loading && (
              <div className="text-center py-16 text-base text-gray-500">
                分析中…
              </div>
            )}

            {!loading && errorMessage && (
              <Card>
                <CardContent className="py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <svg
                      className="w-12 h-12 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                      />
                    </svg>
                    <p className="text-base text-gray-600">{errorMessage}</p>
                    <p className="text-sm text-gray-400 mt-1">
                      請選擇其他日期範圍或稍後再試
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {!loading && !errorMessage && report?.dailyReport.length === 0 && (
              <Card>
                <CardContent className="py-16 text-center text-base text-gray-500">
                  該日期範圍內無充電記錄
                </CardContent>
              </Card>
            )}

            {!loading && report && report.dailyReport.length > 0 && (
              <>
                <ReportSummaryCards summary={report.summary} siteId={siteId as SiteId} />

                <ReportEnergyBreakdown summary={report.summary} />

                <ReportCumulativeSavingsChart
                  dailyReport={report.dailyReport}
                />

<ReportTrendChart dailyReport={report.dailyReport} />

                <ReportDetailTable
                  summary={report.summary}
                  dailyReport={report.dailyReport}
                />
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
