"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useControllerStore } from "@/stores/controller-store";
import type { SiteId } from "@/types/data-type";

function socColor(soc: number): string {
  if (soc > 50) return "text-[#4A9EDB]";
  if (soc > 20) return "text-[#E8883E]";
  return "text-[#E05454]";
}

interface KpiBlockProps {
  label: string;
  value: string;
  unit: string;
  valueClass?: string;
  subLabel?: string;
}

function KpiBlock({ label, value, unit, valueClass = "text-white", subLabel }: KpiBlockProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 px-4 py-3 min-w-[100px]">
      <p className="text-xs text-white/50 uppercase tracking-wider text-center">{label}</p>
      <p className={`text-3xl font-bold tabular-nums leading-none ${valueClass}`}>{value}</p>
      <p className="text-xs text-white/30">{unit}</p>
      {subLabel && <p className="text-xs text-white/40 mt-0.5">{subLabel}</p>}
    </div>
  );
}

interface BESSMonitoringPanelProps {
  siteId: SiteId;
}

export function BESSMonitoringPanel({ siteId }: BESSMonitoringPanelProps) {
  const metrics = useControllerStore((s) => s.siteStates[siteId].bessMetrics);

  const powerLabel =
    metrics.powerKW > 0 ? "充電中" : metrics.powerKW < 0 ? "放電中" : "待機";
  const powerColor =
    metrics.powerKW > 0
      ? "text-[#7D9B7E]"
      : metrics.powerKW < 0
        ? "text-[#E8883E]"
        : "text-white/40";

  return (
    <Card>
      <CardHeader className="pb-0">
        <CardTitle className="text-sm text-white/60 uppercase tracking-wider">
          BESS 監控
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="flex flex-wrap divide-x divide-[#3A2415] overflow-x-auto">
          <KpiBlock
            label="SOC"
            value={`${metrics.soc.toFixed(1)}`}
            unit="%"
            valueClass={socColor(metrics.soc)}
          />
          <KpiBlock label="SOH" value={`${metrics.soh.toFixed(1)}`} unit="%" />
          <KpiBlock
            label="功率"
            value={`${Math.abs(metrics.powerKW).toFixed(0)}`}
            unit="kW"
            valueClass={powerColor}
            subLabel={powerLabel}
          />
          <KpiBlock
            label="剩餘容量"
            value={`${metrics.capacityKWh.toFixed(1)}`}
            unit="kWh"
            valueClass="text-[#4A9EDB]"
          />
          <KpiBlock
            label="執行率"
            value={`${metrics.executionRate.toFixed(1)}`}
            unit="%"
            valueClass={metrics.executionRate >= 90 ? "text-[#7D9B7E]" : "text-[#E8883E]"}
          />
          <KpiBlock
            label="電壓"
            value={`${metrics.voltageV.toFixed(1)}`}
            unit="V"
            valueClass="text-white/80"
          />
        </div>
      </CardContent>
    </Card>
  );
}
