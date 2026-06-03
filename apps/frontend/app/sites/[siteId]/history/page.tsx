"use client";

import { useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ChevronLeft } from "lucide-react";
import HomeSidebar from "@/components/layout/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { ReportData } from "@/types/report-type";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { SiteId } from "@/types/data-type";
import { getSiteConfig } from "@/config/site-configs";
import { HourlyPowerRecord } from "@/utils/report-generator";

const Placeholder = () => <div className="h-48 bg-[#2A1A0F] rounded-xl animate-pulse" />;
const HistorySummaryCards = dynamic(() => import("@/components/history/history-summary-cards").then((m) => m.HistorySummaryCards), { loading: Placeholder });
const HistoryDetailTable = dynamic(() => import("@/components/history/history-detail-table").then((m) => m.HistoryDetailTable), { loading: Placeholder });
const HistoryPowerDemandChart = dynamic(() => import("@/components/history/history-power-demand-chart").then((m) => m.HistoryPowerDemandChart), { loading: Placeholder });

const HISTORY_SITE_IDS = ["neihu", "etai"] as const;

const SITE_HISTORY_CONFIG: Record<string, { title: string; minDate: string; maxDate: string }> = {
  neihu: { title: "內湖 Evalue 旗艦站", minDate: "2022-06-24", maxDate: new Date().toISOString().split("T")[0]! },
  etai: { title: "億泰電纜儲能站", minDate: "2021-01-01", maxDate: "2025-12-31" },
};

interface HistoryResponse extends ReportData {
  granularity: "daily" | "hourly";
  hourlyData?: HourlyPowerRecord[];
}

export default function HistoryPage() {
  const params = useParams();
  const siteId = (Array.isArray(params.siteId) ? params.siteId[0] : params.siteId) as SiteId;
  const { isAuthenticated, isLoading: authLoading } = useAuthGuard({ siteId });
  const siteHistoryConfig = SITE_HISTORY_CONFIG[siteId];
  const hasSiteData = siteHistoryConfig && (HISTORY_SITE_IDS as readonly string[]).includes(siteId);
  const simConfig = getSiteConfig(siteId);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [report, setReport] = useState<HistoryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [hourlyDataForDate, setHourlyDataForDate] = useState<HourlyPowerRecord[]>([]);
  const [hourlyLoading, setHourlyLoading] = useState(false);

  const fetchHistory = useCallback(async () => {
    if (!hasSiteData || !siteId || !startDate || !endDate) return;
    setLoading(true);
    setErrorMessage(null);
    setSelectedDate(null);
    setHourlyDataForDate([]);
    try {
      const res = await fetch(`/api/history/${siteId}?start=${startDate}&end=${endDate}&granularity=daily`);
      if (res.ok) {
        const data = await res.json();
        setReport(data);
        if (data.error === "NO_DATA" && data.message) setErrorMessage(data.message);
      } else {
        setReport(null);
        setErrorMessage("無法載入歷史數據，請稍後再試");
      }
    } catch {
      setReport(null);
      setErrorMessage("網路錯誤，請檢查連線後重試");
    }
    setLoading(false);
  }, [startDate, endDate, hasSiteData, siteId]);

  const handleSelectDate = useCallback(async (date: string | null) => {
    setSelectedDate(date);
    if (!date || !siteId) { setHourlyDataForDate([]); return; }
    setHourlyLoading(true);
    try {
      const res = await fetch(`/api/history/${siteId}?start=${date}&end=${date}&granularity=hourly`);
      if (res.ok) { const data = await res.json(); setHourlyDataForDate(data.hourlyData || []); }
      else setHourlyDataForDate([]);
    } catch { setHourlyDataForDate([]); }
    setHourlyLoading(false);
  }, [siteId]);

  if (authLoading) {
    return <div className="flex h-screen items-center justify-center bg-[#1E1208] text-white/50">載入中...</div>;
  }
  if (!isAuthenticated) return null;

  const hasData = !loading && !errorMessage && report && report.dailyReport.length > 0;

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
            <h1 className="text-lg font-bold">歷史數據查詢</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/40">{siteHistoryConfig?.title || siteId}</span>
            <Link href={`/sites/${siteId}/report`} className="px-3 py-1.5 text-xs bg-[#3A2415] text-white/70 border border-[#E8883E]/20 rounded-lg hover:bg-[#4A3020]">財報</Link>
            <Link href="/" className="px-3 py-1.5 text-xs bg-[#3A2415] text-white/50 border border-[#3A2415] rounded-lg hover:bg-[#4A3020]">首頁</Link>
          </div>
        </div>

        {!hasSiteData && (
          <Card><CardContent className="py-16 text-center text-white/50">此站點暫無歷史數據</CardContent></Card>
        )}

        {hasSiteData && (
          <>
            {/* Date controls */}
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    type="date"
                    value={startDate}
                    min={siteHistoryConfig.minDate}
                    max={siteHistoryConfig.maxDate}
                    onChange={(e) => { setStartDate(e.target.value); if (endDate < e.target.value) setEndDate(e.target.value); }}
                    onClick={(e) => (e.currentTarget as HTMLInputElement).showPicker?.()}
                    style={{ colorScheme: "dark" }}
                    className="cursor-pointer border border-[#3A2415] rounded-lg px-3 py-2 text-sm bg-[#1E1208] text-white focus:outline-none focus:ring-1 focus:ring-[#E8883E]"
                  />
                  <span className="text-white/40">～</span>
                  <input
                    type="date"
                    value={endDate}
                    min={startDate}
                    max={siteHistoryConfig.maxDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    onClick={(e) => (e.currentTarget as HTMLInputElement).showPicker?.()}
                    style={{ colorScheme: "dark" }}
                    className="cursor-pointer border border-[#3A2415] rounded-lg px-3 py-2 text-sm bg-[#1E1208] text-white focus:outline-none focus:ring-1 focus:ring-[#E8883E]"
                  />
                  <button
                    onClick={fetchHistory}
                    disabled={!startDate || !endDate || loading}
                    className="px-5 py-2 text-sm font-medium bg-[#E8883E] text-white rounded-lg hover:bg-[#d4762e] transition-colors disabled:opacity-50"
                  >
                    {loading ? "查詢中…" : "查詢"}
                  </button>
                  <span className="text-xs text-white/30 ml-auto hidden sm:inline">可查詢：{siteHistoryConfig.minDate} ～ {siteHistoryConfig.maxDate}</span>
                </div>
              </CardContent>
            </Card>

            {!loading && !report && !errorMessage && (
              <Card><CardContent className="py-16 text-center text-white/50">請選擇日期範圍後點擊「查詢」</CardContent></Card>
            )}
            {!loading && errorMessage && (
              <Card><CardContent className="py-16 text-center text-white/50">{errorMessage}</CardContent></Card>
            )}
            {!loading && !errorMessage && report?.dailyReport.length === 0 && (
              <Card><CardContent className="py-16 text-center text-white/50">該日期範圍內無數據記錄</CardContent></Card>
            )}

            {hasData && (
              <>
                <HistorySummaryCards summary={report.summary} dailyReport={report.dailyReport} />
                <HistoryDetailTable dailyReport={report.dailyReport} selectedDate={selectedDate} onSelectDate={handleSelectDate} />
                {selectedDate && hourlyLoading && <div className="text-center py-8 text-white/50">載入逐時數據…</div>}
                {selectedDate && !hourlyLoading && hourlyDataForDate.length > 0 && (
                  <HistoryPowerDemandChart date={selectedDate} hourlyData={hourlyDataForDate} siteConfig={simConfig} />
                )}
                {selectedDate && !hourlyLoading && hourlyDataForDate.length === 0 && (
                  <div className="text-center py-8 text-white/50">該日期無逐時數據</div>
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
