"use client";

import { useLiveStats } from "@/hooks/use-live-stats";
import type { SiteId } from "./types";

interface HomeBessStatsProps {
  siteId: SiteId;
}

const STATUS_COLOR: Record<string, string> = {
  "放電中": "text-[#E8883E]",
  "充電中": "text-[#7D9B7E]",
  "待機":   "text-white/40",
};

export default function HomeBessStats({ siteId }: HomeBessStatsProps) {
  const { stats, loading, isSupported } = useLiveStats(siteId);

  const batteryStatus = isSupported
    ? (loading && !stats ? null : (stats?.batteryStatus ?? "待機"))
    : null;

  const piles = isSupported ? stats?.chargingPiles : null;

  return (
    <div className="flex-1 bg-[#2A1A0F] rounded-2xl p-5 flex flex-col justify-between border border-[#3A2415] overflow-hidden min-h-0">
      {/* 儲能狀態 */}
      <div>
        <p className="text-xs font-medium text-white/50 uppercase tracking-wider mb-3">
          儲能狀態
        </p>
        {batteryStatus !== null ? (
          <span className={`text-3xl font-bold leading-none ${STATUS_COLOR[batteryStatus] ?? "text-white"}`}>
            {batteryStatus}
          </span>
        ) : (
          <span className="text-base text-white/25 italic">
            {!isSupported ? "暫無即時數據" : loading ? "載入中..." : "待機"}
          </span>
        )}
      </div>

      {/* 充電樁使用 — 僅充電站 (neihu) 顯示 */}
      {siteId === "neihu" && (
        <>
          <div className="border-t border-[#3A2415]" />
          <div>
            <p className="text-xs font-medium text-white/50 uppercase tracking-wider mb-3">
              充電樁使用
            </p>
            {piles ? (
              <>
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-3xl font-bold text-[#E8883E] leading-none">
                    {piles.active}
                  </span>
                  <span className="text-xl text-white/30 leading-none mb-0.5">/</span>
                  <span className="text-xl font-semibold text-white/30 leading-none mb-0.5">
                    {piles.total}
                  </span>
                </div>
                <p className="text-xs text-white/30 mt-1">使用中 / 總數</p>
              </>
            ) : (
              <p className="text-base text-white/25 italic">
                {loading ? "載入中..." : "暫無數據"}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
