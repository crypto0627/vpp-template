"use client";

import { useLiveStats } from "@/hooks/use-live-stats";
import type { SiteId } from "./types";

interface HomeLeftStatsProps {
  selectedSiteId: SiteId;
}

function StatBlock({
  label,
  value,
  unit,
  placeholder,
}: {
  label: string;
  value: string | null;
  unit: string;
  placeholder?: string;
}) {
  return (
    <div>
      <p className="text-sm font-medium text-white/50 uppercase tracking-wider mb-3">
        {label}
      </p>
      {value !== null ? (
        <>
          <p className="text-3xl font-bold text-[#E8883E] leading-none">{value}</p>
          <p className="text-xs text-white/30 mt-1">{unit}</p>
        </>
      ) : (
        <p className="text-base text-white/25 italic">{placeholder ?? "暫無數據"}</p>
      )}
    </div>
  );
}

export default function HomeLeftStats({ selectedSiteId }: HomeLeftStatsProps) {
  const { stats, loading, error, isSupported } = useLiveStats(selectedSiteId);

  const usageValue = isSupported
    ? loading && !stats ? null : stats ? stats.usageKWh.toFixed(2) : null
    : null;

  const costValue = isSupported
    ? loading && !stats ? null : stats ? `$${stats.costNTD.toLocaleString("zh-TW")}` : null
    : null;

  const placeholder = !isSupported
    ? "暫無即時數據"
    : loading ? "載入中..." : error ? "連線失敗" : "暫無數據";

  return (
    <div className="flex-1 bg-[#2A1A0F] rounded-2xl p-5 flex flex-col justify-between border border-[#3A2415] overflow-hidden min-h-0">
      {error && stats && (
        <p className="text-[10px] text-[#E05454] -mt-1 mb-1">⚠ 即時數據更新失敗，顯示為上次數據</p>
      )}
      <StatBlock
        label="今日總用電量"
        value={usageValue}
        unit="kWh"
        placeholder={placeholder}
      />

      <div className="border-t border-[#3A2415]" />

      <StatBlock
        label="今日電費成本"
        value={costValue}
        unit="NT$（即時估算）"
        placeholder={placeholder}
      />
    </div>
  );
}
