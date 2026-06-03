"use client";

import { Activity, Cpu, Battery } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useControllerStore } from "@/stores/controller-store";
import type { SiteId } from "@/types/data-type";
import type { SystemStatus, PCSStatus, BMSStatus } from "@/types/controller-types";

type AnyStatus = SystemStatus | PCSStatus | BMSStatus;

const STATUS_COLOR: Record<AnyStatus, string> = {
  NORMAL: "text-[#7D9B7E]",
  RUNNING: "text-[#7D9B7E]",
  CHARGING: "text-[#4A9EDB]",
  DISCHARGING: "text-[#E8883E]",
  STANDBY: "text-white/50",
  WARNING: "text-[#E8883E]",
  FAULT: "text-[#E05454]",
  OFFLINE: "text-white/30",
};

const STATUS_BG: Record<AnyStatus, string> = {
  NORMAL: "bg-[#7D9B7E]/10 border-[#7D9B7E]/20",
  RUNNING: "bg-[#7D9B7E]/10 border-[#7D9B7E]/20",
  CHARGING: "bg-[#4A9EDB]/10 border-[#4A9EDB]/20",
  DISCHARGING: "bg-[#E8883E]/10 border-[#E8883E]/20",
  STANDBY: "bg-[#2A1A0F] border-[#3A2415]",
  WARNING: "bg-[#E8883E]/10 border-[#E8883E]/20",
  FAULT: "bg-[#E05454]/10 border-[#E05454]/20",
  OFFLINE: "bg-[#2A1A0F] border-[#3A2415]",
};

const STATUS_LABEL: Record<AnyStatus, string> = {
  NORMAL: "正常",
  RUNNING: "運行中",
  CHARGING: "充電中",
  DISCHARGING: "放電中",
  STANDBY: "待機",
  WARNING: "警告",
  FAULT: "故障",
  OFFLINE: "離線",
};

interface StatusCardProps {
  label: string;
  icon: React.ReactNode;
  status: AnyStatus;
}

function StatusCard({ label, icon, status }: StatusCardProps) {
  return (
    <Card className={`${STATUS_BG[status]} border`}>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center gap-2 mb-3">
          <span className={STATUS_COLOR[status]}>{icon}</span>
          <span className="text-xs text-white/50 uppercase tracking-wider">{label}</span>
        </div>
        <p className={`text-2xl font-bold ${STATUS_COLOR[status]}`}>{STATUS_LABEL[status]}</p>
        <p className="text-xs text-white/30 mt-1 font-mono">{status}</p>
      </CardContent>
    </Card>
  );
}

interface SystemStatusOverviewProps {
  siteId: SiteId;
}

export function SystemStatusOverview({ siteId }: SystemStatusOverviewProps) {
  const siteState = useControllerStore((s) => s.siteStates[siteId]);

  return (
    <div className="grid grid-cols-1 xs:grid-cols-3 gap-4">
      <StatusCard
        label="系統狀態"
        icon={<Activity size={16} />}
        status={siteState.systemStatus}
      />
      <StatusCard
        label="PCS 狀態"
        icon={<Cpu size={16} />}
        status={siteState.pcsStatus}
      />
      <StatusCard
        label="BMS 狀態"
        icon={<Battery size={16} />}
        status={siteState.bmsStatus}
      />
    </div>
  );
}
