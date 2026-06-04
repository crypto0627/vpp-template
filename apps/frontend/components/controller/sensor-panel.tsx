"use client";

import { Thermometer, Droplets } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useControllerStore } from "@/stores/controller-store";
import type { SiteId } from "@/types/data-type";

const RACK_WARN_THRESHOLD = 35;
const PCS_WARN_THRESHOLD = 45;
const BMS_WARN_THRESHOLD = 40;
const AMBIENT_WARN_THRESHOLD = 35;

interface SensorRowProps {
  label: string;
  value: string;
  warn?: boolean;
}

function SensorRow({ label, value, warn }: SensorRowProps) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-[#3A2415] last:border-0">
      <span className="text-xs text-white/50">{label}</span>
      <span className={`text-sm font-medium tabular-nums ${warn ? "text-[#E8883E]" : "text-white/80"}`}>
        {value}
        {warn && <span className="ml-1 text-[10px] text-[#E8883E]/80">⚠</span>}
      </span>
    </div>
  );
}

interface SensorPanelProps {
  siteId: SiteId;
}

export function SensorPanel({ siteId }: SensorPanelProps) {
  const sensors = useControllerStore((s) => s.siteStates[siteId].sensors);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-white/60 uppercase tracking-wider flex items-center gap-1.5">
          <Thermometer size={14} />
          感測器
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
          {/* Battery rack temperatures */}
          <div>
            <p className="text-[11px] text-white/30 uppercase tracking-wider mb-1 mt-1">電池架溫度</p>
            {sensors.batteryRacks.map((rack) => (
              <SensorRow
                key={rack.id}
                label={rack.id}
                value={`${rack.tempC.toFixed(1)} °C`}
                warn={rack.tempC >= RACK_WARN_THRESHOLD}
              />
            ))}
          </div>

          {/* System sensors */}
          <div>
            <p className="text-[11px] text-white/30 uppercase tracking-wider mb-1 mt-1">系統感測器</p>
            <SensorRow
              label="PCS 機箱溫度"
              value={`${sensors.pcsCabinetTempC.toFixed(1)} °C`}
              warn={sensors.pcsCabinetTempC >= PCS_WARN_THRESHOLD}
            />
            <SensorRow
              label="BMS 模組溫度"
              value={`${sensors.bmsModuleTempC.toFixed(1)} °C`}
              warn={sensors.bmsModuleTempC >= BMS_WARN_THRESHOLD}
            />
            <SensorRow
              label="環境溫度"
              value={`${sensors.ambientTempC.toFixed(1)} °C`}
              warn={sensors.ambientTempC >= AMBIENT_WARN_THRESHOLD}
            />
            <div className="flex items-center justify-between py-2">
              <span className="text-xs text-white/50 flex items-center gap-1">
                <Droplets size={11} />
                濕度
              </span>
              <span className="text-sm font-medium tabular-nums text-white/80">
                {sensors.humidity.toFixed(1)} %
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
