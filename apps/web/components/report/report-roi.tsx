import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Summary } from "@/types/report-type";

export function ReportROI({
  summary,
  dayCount,
}: {
  summary: Summary;
  dayCount: number;
}) {
  const monthlyEst =
    dayCount > 0 ? Math.round((summary.savings / dayCount) * 30) : 0;
  const annualEst =
    dayCount > 0 ? Math.round((summary.savings / dayCount) * 365) : 0;

  const items = [
    { label: "選定期間省費", value: summary.savings, unit: `${dayCount} 日` },
    { label: "估算月均省費", value: monthlyEst, unit: "NT$/月" },
    { label: "估算年省費", value: annualEst, unit: "NT$/年" },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">效益推算</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {items.map((item) => (
            <div
              key={item.label}
              className="text-center p-5 bg-[#7D9B7E]/10 rounded-xl border border-[#7D9B7E]/20"
            >
              <p className="text-sm text-[#7D9B7E] mb-1">{item.label}</p>
              <p className="text-3xl font-bold text-[#6B8B6C]">
                ${item.value.toLocaleString()}
              </p>
              <p className="text-sm text-[#8FAB90] mt-0.5">{item.unit}</p>
            </div>
          ))}
        </div>
        <p className="text-sm text-gray-400 mt-4 text-center">
          * 以選定期間日均省費推算。儲能系統規格：370 kWh / 100 kW PCS，可用容量
          259 kWh，充放電效率各 95%。
        </p>
      </CardContent>
    </Card>
  );
}
