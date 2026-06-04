"use client";

import { useRef, useState } from "react";
import { Binary, ChevronDown } from "lucide-react";
import { LiveClock } from "@/components/ui/live-clock";
import { useControllerStore } from "@/stores/controller-store";
import type { SiteId } from "@/types/data-type";
import type { User } from "@/types/auth";

const SITE_META: Record<SiteId, string> = {
  neihu: "內湖 Evalue 旗艦站",
  etai: "億泰電纜儲能站",
};

const MODE_LABEL: Record<string, string> = {
  AUTO: "自動模式",
  MANUAL: "手動模式",
  EMERGENCY_STOP: "緊急停機",
};

const MODE_COLOR: Record<string, string> = {
  AUTO: "bg-[#7D9B7E]/20 text-[#7D9B7E] border-[#7D9B7E]/30",
  MANUAL: "bg-[#E8883E]/20 text-[#E8883E] border-[#E8883E]/30",
  EMERGENCY_STOP: "bg-[#E05454]/20 text-[#E05454] border-[#E05454]/30",
};

const OPERATION_LABELS: Record<string, string> = {
  STARTUP: "系統啟動",
  SHUTDOWN: "停機作業",
  EMERGENCY_STOP: "緊急停機",
  CLEAR_ERRORS: "消除錯誤碼",
  SET_MANUAL: "切換手動模式",
  SET_AUTO: "恢復自動模式",
  FAULT_ISOLATE: "故障隔離",
};

interface ControllerHeaderProps {
  user: User;
}

export function ControllerHeader({ user }: ControllerHeaderProps) {
  const { selectedSite, setSelectedSite, siteStates } = useControllerStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const allowedSites: SiteId[] =
    user.role === "admin"
      ? (["neihu", "etai"] as SiteId[])
      : ((user.sitePermissions ?? []) as SiteId[]);

  const currentSite = selectedSite ?? allowedSites[0] ?? "neihu";
  const siteState = siteStates[currentSite];
  const lastOp = siteState?.lastOperation;
  const operationMode = siteState?.operationMode ?? "AUTO";

  const showDropdown = allowedSites.length > 1;

  return (
    <div className="shrink-0 flex flex-col gap-2 px-1">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        {/* Left: title + site selector */}
        <div className="flex items-center gap-2 flex-wrap">
          <Binary size={18} className="text-[#E8883E] shrink-0" />
          <h1 className="text-lg font-bold shrink-0">維運操作面板</h1>
          <span className="text-white/20">/</span>

          {showDropdown ? (
            <div className="relative" ref={dropdownRef}>
              <div
                onClick={() => setDropdownOpen((o) => !o)}
                className="w-52 h-9 cursor-pointer flex items-center justify-between gap-2 border border-[#3A2415] rounded-lg px-3 text-sm bg-[#2A1A0F] text-white hover:border-[#E8883E]/50 transition-colors select-none"
              >
                <span className="truncate">{SITE_META[currentSite]}</span>
                <ChevronDown
                  size={14}
                  className={`text-white/40 shrink-0 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
                />
              </div>
              {dropdownOpen && (
                <div className="absolute top-full left-0 mt-1 z-50 w-52 bg-[#2A1A0F] border border-[#3A2415] rounded-lg overflow-hidden shadow-xl">
                  {allowedSites.map((siteId) => (
                    <div
                      key={siteId}
                      onClick={() => {
                        setSelectedSite(siteId);
                        setDropdownOpen(false);
                      }}
                      className={`px-3 py-2.5 text-sm cursor-pointer transition-colors truncate ${
                        currentSite === siteId
                          ? "bg-[#E8883E]/20 text-[#E8883E]"
                          : "text-white/70 hover:bg-[#3A2415] hover:text-white"
                      }`}
                    >
                      {SITE_META[siteId]}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <span className="text-white/80 text-sm font-medium">{SITE_META[currentSite]}</span>
          )}
        </div>

        {/* Right: clock + mode badge */}
        <div className="flex items-center gap-2 flex-wrap">
          <LiveClock />
          <span className="text-white/20">|</span>
          <span
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${MODE_COLOR[operationMode] ?? MODE_COLOR.AUTO}`}
          >
            {MODE_LABEL[operationMode] ?? operationMode}
          </span>
        </div>
      </div>

      {/* Last operation log */}
      {lastOp && (
        <p className="text-xs text-white/30 px-0.5">
          上次操作：{OPERATION_LABELS[lastOp.operation] ?? lastOp.operation} —{" "}
          <span className={lastOp.result === "SUCCESS" ? "text-[#7D9B7E]" : "text-[#E05454]"}>
            {lastOp.result === "SUCCESS" ? "成功" : "失敗"}
          </span>
          　{lastOp.timestamp.toLocaleTimeString("zh-TW")}
        </p>
      )}
    </div>
  );
}
