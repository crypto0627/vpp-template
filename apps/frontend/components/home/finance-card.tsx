"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, TrendingDown, TrendingUp, Zap, DollarSign } from "lucide-react";
import type { SiteId } from "./types";
import {
  CostComparisonChart,
  DRRevenueChart,
  SRegRevenueChart,
  MetricCard,
  type DailyChartItem,
} from "./finance-charts";

interface ReportSummary {
  costWithoutBESS: number;
  costWithBESS: number;
  savings: number;
  savingsRate: number;
  drDays: number;
  drTotalCost: number;
  sRegRevenue: number;
  costWithBESSAfterDR: number;
  costWithBESSFinal: number;
}

interface HomeFinanceCardProps {
  selectedSiteId: SiteId;
}

const today = new Date().toISOString().slice(0, 10);
const monthStart = today.slice(0, 8) + "01";

function fmt(n: number | undefined) {
  return (n ?? 0).toLocaleString("zh-TW", { maximumFractionDigits: 0 });
}

export default function HomeFinanceCard({ selectedSiteId }: HomeFinanceCardProps) {
  const [startDate, setStartDate] = useState(monthStart);
  const [endDate,   setEndDate]   = useState(today);
  const [loading,   setLoading]   = useState(false);
  const [summary,   setSummary]   = useState<ReportSummary | null>(null);
  const [dailyReport, setDailyReport] = useState<DailyChartItem[]>([]);
  const [error,     setError]     = useState("");

  const siteHasDR   = selectedSiteId === "etai";
  const siteHasSReg = selectedSiteId === "etai";

  const handleQuery = useCallback(
    async (site = selectedSiteId, start = startDate, end = endDate) => {
      setLoading(true);
      setError("");
      setSummary(null);
      setDailyReport([]);
      try {
        const route = site === "neihu" ? "/api/neihu/report" : "/api/etai/report";
        const res  = await fetch(`${route}?start=${start}&end=${end}`);
        const data = await res.json();
        if (!res.ok) {
          setError(data?.error === "NO_DATA" ? "所選日期範圍沒有可用數據" : data?.error || "查詢失敗");
          return;
        }
        setSummary(data.summary);
        setDailyReport(data.dailyReport ?? []);
      } catch {
        setError("網路錯誤，請重試");
      } finally {
        setLoading(false);
      }
    },
    [selectedSiteId, startDate, endDate],
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    handleQuery(selectedSiteId, startDate, endDate);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSiteId]);

  return (
    <div className="flex-2 bg-[#2A1A0F] rounded-2xl p-5 border border-[#3A2415] flex flex-col gap-4 overflow-y-auto min-h-0">
      {/* Date picker + query */}
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={startDate}
          max={today}
          onChange={(e) => { setStartDate(e.target.value); if (endDate < e.target.value) setEndDate(e.target.value); }}
          onClick={(e) => (e.currentTarget as HTMLInputElement).showPicker?.()}
          style={{ colorScheme: "dark" }}
          className="cursor-pointer flex-1 min-w-0 border border-[#3A2415] rounded-xl px-3 py-2 text-xs bg-[#1E1208] text-white focus:outline-none focus:ring-1 focus:ring-[#E8883E]"
        />
        <span className="text-white/40 text-xs shrink-0">～</span>
        <input
          type="date"
          value={endDate}
          min={startDate}
          max={today}
          onChange={(e) => setEndDate(e.target.value)}
          onClick={(e) => (e.currentTarget as HTMLInputElement).showPicker?.()}
          style={{ colorScheme: "dark" }}
          className="cursor-pointer flex-1 min-w-0 border border-[#3A2415] rounded-xl px-3 py-2 text-xs bg-[#1E1208] text-white focus:outline-none focus:ring-1 focus:ring-[#E8883E]"
        />
        <button
          onClick={() => handleQuery()}
          disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#E8883E] rounded-xl text-white text-xs font-semibold hover:bg-[#d4762e] disabled:opacity-50 transition-all cursor-pointer shrink-0"
        >
          <Search size={13} />
          {loading ? "查詢中..." : "查詢"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-400">
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-2 gap-2 xs:gap-3">
          {Array.from({ length: siteHasDR ? 6 : 4 }).map((_, i) => (
            <div key={i} className="bg-[#1E1208] rounded-xl p-3 animate-pulse">
              <div className="h-2 bg-[#3A2415] rounded w-16 mb-2" />
              <div className="h-5 bg-[#3A2415] rounded w-20" />
            </div>
          ))}
        </div>
      )}

      {/* Metric cards */}
      {summary && !loading && (
        <div className="grid grid-cols-2 gap-2 xs:gap-3">
          <MetricCard label="無儲能費用" value={`$${fmt(summary.costWithoutBESS)}`} unit="NT$"                                   icon={<TrendingUp   size={13} className="text-white/30" />} />
          <MetricCard label="有儲能費用" value={`$${fmt(summary.costWithBESS)}`}    unit="NT$"                                   icon={<TrendingDown size={13} className="text-[#7D9B7E]" />} />
          <MetricCard label="節省金額"   value={`$${fmt(summary.savings)}`}          unit={`節省率 ${summary.savingsRate.toFixed(1)}%`} highlight icon={<Zap size={13} className="text-[#E8883E]" />} />
          {siteHasDR   && <MetricCard label="DR需量反應收益"   value={`$${fmt(summary.drTotalCost)}`}  unit={`共 ${summary.drDays} 天`} highlight icon={<Zap        size={13} className="text-[#E8883E]" />} />}
          {siteHasSReg && <MetricCard label="sReg輔助服務收益" value={`$${fmt(summary.sRegRevenue)}`} unit="NT$"                        highlight icon={<Zap        size={13} className="text-[#E8883E]" />} />}
          {siteHasDR   && <MetricCard label="最終電費" value={`$${fmt(summary.costWithBESSAfterDR ?? summary.costWithBESS)}`} unit="有儲能費用 − DR收益" highlight icon={<DollarSign size={13} className="text-[#E8883E]" />} />}
        </div>
      )}

      {/* Charts */}
      {summary && dailyReport.length > 0 && !loading && (
        <>
          <CostComparisonChart dailyReport={dailyReport} />
          {siteHasDR   && <DRRevenueChart   dailyReport={dailyReport} />}
          {siteHasSReg && <SRegRevenueChart dailyReport={dailyReport} />}
        </>
      )}

      {/* Empty state */}
      {!summary && !loading && !error && (
        <p className="text-xs text-white/20 text-center py-4">選擇日期區間後按查詢</p>
      )}
    </div>
  );
}
