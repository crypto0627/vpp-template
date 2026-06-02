"use client";

import { useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Card, CardContent } from "@/components/ui/card";
import { Navbar } from "@/components/home/navbar";
import { ReportData } from "@/types/report-type";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { PageLoading } from "@/components/ui";
import { SiteId } from "@/types/data-type";
import { getSiteConfig } from "@/config/site-configs";
import { HourlyPowerRecord } from "@/types/hourly-power-record";
import { MOCK_HISTORY_REPORT, MOCK_HOURLY_DATA } from "@/constants/mock-data";

// Code-split heavy components
const Placeholder = () => (
  <div className="h-48 bg-gray-50 rounded-lg animate-pulse" />
);
const HistorySummaryCards = dynamic(
  () =>
    import("@/components/history/history-summary-cards").then(
      (m) => m.HistorySummaryCards,
    ),
  { loading: Placeholder },
);
const HistoryDetailTable = dynamic(
  () =>
    import("@/components/history/history-detail-table").then(
      (m) => m.HistoryDetailTable,
    ),
  { loading: Placeholder },
);
const HistoryPowerDemandChart = dynamic(
  () =>
    import("@/components/history/history-power-demand-chart").then(
      (m) => m.HistoryPowerDemandChart,
    ),
  { loading: Placeholder },
);

// Sites with history data
const HISTORY_SITE_IDS = ["neihu", "etai"] as const;

// Per-site date limits and titles
const SITE_HISTORY_CONFIG: Record<
  string,
  { title: string; minDate: string; maxDate: string }
> = {
  neihu: {
    title: "內湖 Evalue 旗艦站",
    minDate: "2022-06-24",
    maxDate: new Date().toISOString().split("T")[0]!,
  },
  etai: {
    title: "億泰電纜儲能站",
    minDate: "2021-01-01",
    maxDate: "2025-12-31",
  },
};

interface HistoryResponse extends ReportData {
  granularity: "daily" | "hourly";
  hourlyData?: HourlyPowerRecord[];
}

export default function HistoryPage() {
  const params = useParams();
  const siteId = (
    Array.isArray(params.siteId) ? params.siteId[0] : params.siteId
  ) as SiteId;

  const { isAuthenticated, isLoading: authLoading } = useAuthGuard({ siteId });

  const siteHistoryConfig = SITE_HISTORY_CONFIG[siteId];
  const hasSiteData =
    siteHistoryConfig &&
    (HISTORY_SITE_IDS as readonly string[]).includes(siteId);

  const simConfig = getSiteConfig(siteId);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [report, setReport] = useState<HistoryResponse | null>(null);
  const [loading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [hourlyDataForDate, setHourlyDataForDate] = useState<
    HourlyPowerRecord[]
  >([]);
  const hourlyLoading = false;

  const fetchHistory = useCallback(() => {
    if (!hasSiteData || !siteId || !startDate || !endDate) return;
    setErrorMessage(null);
    setSelectedDate(null);
    setHourlyDataForDate([]);
    setReport({ ...MOCK_HISTORY_REPORT, granularity: "daily" });
  }, [startDate, endDate, hasSiteData, siteId]);

  const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setStartDate(val);
    if (endDate < val) setEndDate(val);
  };
  const handleEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEndDate(e.target.value);
  };

  const handleSelectDate = useCallback(
    (date: string | null) => {
      setSelectedDate(date);
      if (!date) {
        setHourlyDataForDate([]);
        return;
      }
      setHourlyDataForDate(MOCK_HOURLY_DATA);
    },
    [],
  );

  if (authLoading) {
    return <PageLoading text="載入中..." className="h-screen" />;
  }
  if (!isAuthenticated) return null;

  const hasData =
    !loading && !errorMessage && report && report.dailyReport.length > 0;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              歷史數據查詢
            </h1>
            <p className="text-base text-gray-500 mt-0.5">
              {siteHistoryConfig?.title || siteId} — 運轉數據與 BESS 模擬
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/sites/${siteId}`}
              className="px-3 sm:px-4 py-2 text-sm sm:text-base bg-[#DA7756] text-white rounded-md hover:bg-[#C2614A] transition-colors whitespace-nowrap"
            >
              返回監控
            </Link>
            <Link
              href={`/sites/${siteId}/report`}
              className="px-3 sm:px-4 py-2 text-sm sm:text-base bg-white border border-gray-300 text-gray-900 rounded-md hover:bg-gray-100 transition-colors whitespace-nowrap"
            >
              財報
            </Link>
            <Link
              href="/"
              className="px-3 sm:px-4 py-2 text-sm sm:text-base bg-white border border-gray-300 text-gray-900 rounded-md hover:bg-gray-100 transition-colors whitespace-nowrap"
            >
              首頁
            </Link>
          </div>
        </div>

        {!hasSiteData && (
          <Card>
            <CardContent className="py-16 text-center text-base text-gray-500">
              此站點暫無歷史數據
            </CardContent>
          </Card>
        )}

        {hasSiteData && (
          <>
            {/* Controls */}
            <Card>
              <CardContent className="pt-5 pb-4">
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    type="date"
                    value={startDate}
                    min={siteHistoryConfig.minDate}
                    max={siteHistoryConfig.maxDate}
                    onChange={handleStartChange}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-base bg-white focus:outline-none focus:ring-2 focus:ring-[#DA7756] focus:border-transparent"
                  />
                  <span className="text-gray-400 font-medium">～</span>
                  <input
                    type="date"
                    value={endDate}
                    min={startDate}
                    max={siteHistoryConfig.maxDate}
                    onChange={handleEndChange}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-base bg-white focus:outline-none focus:ring-2 focus:ring-[#DA7756] focus:border-transparent"
                  />
                  <button
                    onClick={fetchHistory}
                    disabled={!startDate || !endDate || loading}
                    className="px-5 py-2 text-base font-medium bg-[#DA7756] text-white rounded-lg hover:bg-[#C2614A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    查詢
                  </button>
                  <span className="text-sm text-gray-400 ml-auto hidden sm:inline">
                    可查詢：{siteHistoryConfig.minDate} ～{" "}
                    {siteHistoryConfig.maxDate}
                  </span>
                </div>
              </CardContent>
            </Card>

            {!loading && !report && !errorMessage && (
              <Card>
                <CardContent className="py-16 text-center text-base text-gray-500">
                  請選擇日期範圍後點擊「查詢」
                </CardContent>
              </Card>
            )}

            {loading && (
              <div className="text-center py-16 text-base text-gray-500">
                查詢中…
              </div>
            )}

            {!loading && errorMessage && (
              <Card>
                <CardContent className="py-16 text-center">
                  <p className="text-base text-gray-600">{errorMessage}</p>
                  <p className="text-sm text-gray-400 mt-2">
                    請選擇其他日期範圍
                  </p>
                </CardContent>
              </Card>
            )}

            {!loading && !errorMessage && report?.dailyReport.length === 0 && (
              <Card>
                <CardContent className="py-16 text-center text-base text-gray-500">
                  該日期範圍內無數據記錄
                </CardContent>
              </Card>
            )}

            {/* Operation-focused content */}
            {hasData && (
              <>
                {/* Summary cards — operation metrics */}
                <HistorySummaryCards
                  summary={report.summary}
                  dailyReport={report.dailyReport}
                />

                {/* Detail table */}
                <HistoryDetailTable
                  dailyReport={report.dailyReport}
                  selectedDate={selectedDate}
                  onSelectDate={handleSelectDate}
                />

                {/* Hourly power demand chart for selected date */}
                {selectedDate && hourlyLoading && (
                  <div className="text-center py-8 text-base text-gray-500">
                    載入逐時數據…
                  </div>
                )}
                {selectedDate && !hourlyLoading && hourlyDataForDate.length > 0 && (
                  <HistoryPowerDemandChart
                    date={selectedDate}
                    hourlyData={hourlyDataForDate}
                    siteConfig={simConfig}
                  />
                )}
                {selectedDate && !hourlyLoading && hourlyDataForDate.length === 0 && (
                  <div className="text-center py-8 text-base text-gray-500">
                    該日期無逐時數據
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
