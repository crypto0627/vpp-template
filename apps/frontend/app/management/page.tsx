"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { ChevronDown } from "lucide-react";
import HomeSidebar from "@/components/layout/sidebar";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { useSiteDataStore } from "@/stores/data-store";
import { getSiteConfig } from "@/config/site-configs";
import { LiveClock } from "@/components/ui/live-clock";
import { Card, CardContent } from "@/components/ui/card";
import type { SiteId } from "@/types/data-type";
import type { ReportData } from "@/types/report-type";
import type { HourlyPowerRecord } from "@/utils/report-generator";

const Placeholder = () => (
  <div className="h-48 bg-[#2A1A0F] rounded-xl animate-pulse" />
);

const SiteSummaryCards = dynamic(
  () => import("@/components/site/site-summary-cards").then((m) => m.SiteSummaryCards),
  { loading: Placeholder },
);
const PowerDemandChart = dynamic(
  () => import("@/components/site/power-demand-chart").then((m) => m.PowerDemandChart),
  { loading: Placeholder },
);
const BatterySOCChart = dynamic(
  () => import("@/components/site/battery-soc-chart").then((m) => m.BatterySOCChart),
  { loading: Placeholder },
);
const EnergyFlowDiagram = dynamic(
  () => import("@/components/site/energy-flow-diagram").then((m) => m.EnergyFlowDiagram),
  { loading: Placeholder },
);
const ChargerStatusGrid = dynamic(
  () => import("@/components/site/charger-status-grid").then((m) => m.ChargerStatusGrid),
  { loading: Placeholder },
);
const HistorySummaryCards = dynamic(
  () => import("@/components/history/history-summary-cards").then((m) => m.HistorySummaryCards),
  { loading: Placeholder },
);
const HistoryDetailTable = dynamic(
  () => import("@/components/history/history-detail-table").then((m) => m.HistoryDetailTable),
  { loading: Placeholder },
);
const HistoryPowerDemandChart = dynamic(
  () => import("@/components/history/history-power-demand-chart").then((m) => m.HistoryPowerDemandChart),
  { loading: Placeholder },
);

interface HistoryResponse extends ReportData {
  granularity: "daily" | "hourly";
  hourlyData?: HourlyPowerRecord[];
}

const SITE_META: Record<SiteId, { name: string; type: string }> = {
  neihu: { name: "內湖 Evalue 旗艦站", type: "充電站" },
  etai: { name: "億泰電纜儲能站", type: "儲能站" },
};

const HISTORY_DATE_CONFIG: Record<SiteId, { minDate: string; maxDate: string }> = {
  neihu: { minDate: "2022-06-24", maxDate: new Date().toISOString().split("T")[0]! },
  etai: { minDate: "2021-01-01", maxDate: "2025-12-31" },
};

const inputClass =
  "cursor-pointer border border-[#3A2415] rounded-xl px-3 py-2 text-sm bg-[#1E1208] text-white focus:outline-none focus:ring-1 focus:ring-[#E8883E]";

export default function ManagementPage() {
  const { isLoading, isAuthorized } = useAuthGuard({ allowedRoles: ["admin"] });
  const { setCurrentSite, fetchData } = useSiteDataStore();

  const [selectedSite, setSelectedSite] = useState<SiteId>("neihu");
  const [activeTab, setActiveTab] = useState<"live" | "history">("live");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // History state
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [report, setReport] = useState<HistoryResponse | null>(null);
  const [histLoading, setHistLoading] = useState(false);
  const [histError, setHistError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [hourlyData, setHourlyData] = useState<HourlyPowerRecord[]>([]);
  const [hourlyLoading, setHourlyLoading] = useState(false);

  const siteConfig = getSiteConfig(selectedSite);
  const dateConfig = HISTORY_DATE_CONFIG[selectedSite];
  const siteMeta = SITE_META[selectedSite];

  // Sync store + auto-refresh live data
  useEffect(() => {
    setCurrentSite(selectedSite);
    fetchData(selectedSite);
    if (activeTab !== "live") return;
    const interval = setInterval(() => fetchData(selectedSite), 10000);
    return () => clearInterval(interval);
  }, [selectedSite, activeTab, setCurrentSite, fetchData]);

  // Reset history state on site change
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setReport(null);
    setHistError(null);
    setSelectedDate(null);
    setHourlyData([]);
    setStartDate("");
    setEndDate("");
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [selectedSite]);

  const fetchHistory = useCallback(async () => {
    if (!startDate || !endDate) return;
    setHistLoading(true);
    setHistError(null);
    setSelectedDate(null);
    setHourlyData([]);
    try {
      const res = await fetch(
        `/api/history/${selectedSite}?start=${startDate}&end=${endDate}&granularity=daily`,
      );
      if (res.ok) {
        const data = await res.json();
        setReport(data);
        if (data.error === "NO_DATA" && data.message) setHistError(data.message);
      } else {
        setReport(null);
        setHistError("無法載入歷史數據，請稍後再試");
      }
    } catch {
      setReport(null);
      setHistError("網路錯誤，請檢查連線後重試");
    }
    setHistLoading(false);
  }, [startDate, endDate, selectedSite]);

  const handleSelectDate = useCallback(
    async (date: string | null) => {
      setSelectedDate(date);
      if (!date) {
        setHourlyData([]);
        return;
      }
      setHourlyLoading(true);
      try {
        const res = await fetch(
          `/api/history/${selectedSite}?start=${date}&end=${date}&granularity=hourly`,
        );
        if (res.ok) {
          const data = await res.json();
          setHourlyData(data.hourlyData || []);
        } else {
          setHourlyData([]);
        }
      } catch {
        setHourlyData([]);
      }
      setHourlyLoading(false);
    },
    [selectedSite],
  );

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#1E1208]">
        <div className="text-white/50">載入中...</div>
      </div>
    );
  }
  if (!isAuthorized) return null;

  return (
    <div className="flex flex-col lg:flex-row lg:h-screen bg-[#1E1208] lg:gap-4 lg:p-4">
      <HomeSidebar />
      <main className="flex-1 flex flex-col gap-4 text-white p-4 pb-24 lg:py-2 lg:px-0 lg:pb-0 lg:min-h-0 lg:overflow-y-auto">
        {/* ── Header ── */}
        <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold shrink-0">案場管理總覽</h1>
            <span className="text-white/20">/</span>
            {/* Site Dropdown — fixed w-52 h-9 */}
            <div className="relative" ref={dropdownRef}>
              <div
                onClick={() => setDropdownOpen((o) => !o)}
                className="w-52 h-9 cursor-pointer flex items-center justify-between gap-2 border border-[#3A2415] rounded-lg px-3 text-sm bg-[#2A1A0F] text-white hover:border-[#E8883E]/50 transition-colors select-none"
              >
                <span className="truncate">{SITE_META[selectedSite].name}</span>
                <ChevronDown
                  size={14}
                  className={`text-white/40 shrink-0 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
                />
              </div>
              {dropdownOpen && (
                <div className="absolute top-full left-0 mt-1 z-50 w-52 bg-[#2A1A0F] border border-[#3A2415] rounded-lg overflow-hidden shadow-xl">
                  {(["neihu", "etai"] as SiteId[]).map((siteId) => (
                    <div
                      key={siteId}
                      onClick={() => {
                        setSelectedSite(siteId);
                        setDropdownOpen(false);
                      }}
                      className={`px-3 py-2.5 text-sm cursor-pointer transition-colors truncate ${
                        selectedSite === siteId
                          ? "bg-[#E8883E]/20 text-[#E8883E]"
                          : "text-white/70 hover:bg-[#3A2415] hover:text-white"
                      }`}
                    >
                      {SITE_META[siteId].name}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <span className="px-2 py-0.5 rounded-lg text-xs bg-[#3A2415] text-[#E8883E] border border-[#E8883E]/20">
              {siteMeta.type}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <LiveClock />
            <span className="text-white/20">|</span>
            {/* Tab switcher */}
            <div className="flex rounded-lg overflow-hidden border border-[#3A2415] text-xs">
              {(["live", "history"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 transition-colors ${
                    activeTab === tab
                      ? "bg-[#E8883E] text-white"
                      : "bg-[#2A1A0F] text-white/50 hover:text-white hover:bg-[#3A2415]"
                  }`}
                >
                  {tab === "live" ? "即時監控" : "歷史查詢"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Live Tab ── */}
        {activeTab === "live" && (
          <>
            {selectedSite === "etai" && (
              <div className="shrink-0 px-4 py-2.5 rounded-lg bg-[#2A1A0F] border border-[#3A2415] text-center text-white/50 text-sm">
                ETai 暫無即時數據，能源流向以模擬數據顯示
              </div>
            )}

            <SiteSummaryCards />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <PowerDemandChart />
              <BatterySOCChart />
            </div>

            <EnergyFlowDiagram />

            {selectedSite === "neihu" && <ChargerStatusGrid />}
          </>
        )}

        {/* ── History Tab ── */}
        {activeTab === "history" && (
          <div className="flex flex-col gap-4">
            {/* Date range picker */}
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    type="date"
                    value={startDate}
                    min={dateConfig.minDate}
                    max={dateConfig.maxDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      if (endDate < e.target.value) setEndDate(e.target.value);
                    }}
                    onClick={(e) => (e.currentTarget as HTMLInputElement).showPicker?.()}
                    style={{ colorScheme: "dark" }}
                    className={inputClass}
                  />
                  <span className="text-white/40">～</span>
                  <input
                    type="date"
                    value={endDate}
                    min={startDate || dateConfig.minDate}
                    max={dateConfig.maxDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    onClick={(e) => (e.currentTarget as HTMLInputElement).showPicker?.()}
                    style={{ colorScheme: "dark" }}
                    className={inputClass}
                  />
                  <button
                    onClick={fetchHistory}
                    disabled={!startDate || !endDate || histLoading}
                    className="px-5 py-2 text-sm font-medium bg-[#E8883E] text-white rounded-xl hover:bg-[#d4762e] transition-colors disabled:opacity-50"
                  >
                    {histLoading ? "查詢中…" : "查詢"}
                  </button>
                  <span className="text-xs text-white/30 ml-auto hidden sm:inline">
                    可查詢：{dateConfig.minDate} ～ {dateConfig.maxDate}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Empty / error states */}
            {!histLoading && !report && !histError && (
              <Card>
                <CardContent className="py-16 text-center text-white/50">
                  請選擇日期範圍後點擊「查詢」
                </CardContent>
              </Card>
            )}
            {!histLoading && histError && (
              <Card>
                <CardContent className="py-16 text-center text-white/50">{histError}</CardContent>
              </Card>
            )}
            {!histLoading && !histError && report?.dailyReport.length === 0 && (
              <Card>
                <CardContent className="py-16 text-center text-white/50">
                  該日期範圍內無數據記錄
                </CardContent>
              </Card>
            )}

            {/* Results */}
            {!histLoading && report && report.dailyReport.length > 0 && (
              <>
                <HistorySummaryCards
                  summary={report.summary}
                  dailyReport={report.dailyReport}
                />
                <HistoryDetailTable
                  dailyReport={report.dailyReport}
                  selectedDate={selectedDate}
                  onSelectDate={handleSelectDate}
                />
                {selectedDate && hourlyLoading && (
                  <div className="text-center py-8 text-white/50">載入逐時數據…</div>
                )}
                {selectedDate && !hourlyLoading && hourlyData.length > 0 && (
                  <HistoryPowerDemandChart
                    date={selectedDate}
                    hourlyData={hourlyData}
                    siteConfig={siteConfig}
                  />
                )}
                {selectedDate && !hourlyLoading && hourlyData.length === 0 && (
                  <div className="text-center py-8 text-white/50">該日期無逐時數據</div>
                )}
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
