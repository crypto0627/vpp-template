import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Summary } from "@/types/report-type";

function ProgressBar({
  label,
  value,
  total,
  variant,
}: {
  label: string;
  value: number;
  total: number;
  variant: "peak" | "offpeak";
}) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-base mb-1.5">
        <span
          className={`font-semibold ${variant === "peak" ? "text-gray-800" : "text-gray-600"}`}
        >
          {label}
        </span>
        <span className="text-gray-700 font-semibold">
          {value.toLocaleString()} kWh
        </span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-3">
        <div
          className={`h-3 rounded-full ${variant === "peak" ? "bg-[#4A4540]" : "bg-[#BEA98F]"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function ReportEnergyBreakdown({ summary }: { summary: Summary }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">用電分佈與省費細目</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ProgressBar
          label="尖峰用電"
          value={summary.totalPeakKWh}
          total={summary.totalKWh}
          variant="peak"
        />
        <ProgressBar
          label="離峰用電"
          value={summary.totalOffPeakKWh}
          total={summary.totalKWh}
          variant="offpeak"
        />

        <div className="pt-3 border-t border-gray-100">
          <div className="flex justify-between text-base">
            <span className="text-[#7D9B7E] font-semibold">儲能抵消尖峰</span>
            <span className="text-[#6B8B6C] font-semibold">
              {summary.peakSavingsKWh.toLocaleString()} kWh
            </span>
          </div>
        </div>

        <div className="pt-3 border-t border-gray-100">
          <p className="text-sm text-gray-400 mb-2 font-semibold uppercase tracking-wide">
            台電高壓電價 (NT$/kWh)
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>夏月尖峰</span>
              <span className="font-semibold text-gray-800">12.47</span>
            </div>
            <div className="flex justify-between">
              <span>夏月離峰</span>
              <span className="font-semibold text-gray-800">3.05</span>
            </div>
            <div className="flex justify-between">
              <span>非夏月尖峰</span>
              <span className="font-semibold text-gray-800">12.14</span>
            </div>
            <div className="flex justify-between">
              <span>非夏月離峰</span>
              <span className="font-semibold text-gray-800">2.90</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
