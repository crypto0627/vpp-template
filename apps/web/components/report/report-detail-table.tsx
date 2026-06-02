import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Summary, DailyRecord } from "@/types/report-type";

export function ReportDetailTable({
  summary,
  dailyReport,
}: {
  summary: Summary;
  dailyReport: DailyRecord[];
}) {
  if (dailyReport.length > 31) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">每日電費明細</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-base">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-4 text-gray-600 font-semibold">
                  日期
                </th>
                <th className="text-right py-3 px-4 text-gray-600 font-semibold">
                  尖峰 kWh
                </th>
                <th className="text-right py-3 px-4 text-gray-600 font-semibold">
                  離峰 kWh
                </th>
                <th className="text-right py-3 px-4 text-gray-600 font-semibold">
                  無儲能
                </th>
                <th className="text-right py-3 px-4 text-gray-600 font-semibold">
                  有儲能
                </th>
                <th className="text-right py-3 px-4 text-[#7D9B7E] font-semibold">
                  省費
                </th>
              </tr>
            </thead>
            <tbody>
              {dailyReport.map((d) => (
                  <tr
                    key={d.date}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-2.5 px-4 text-gray-700">{d.date}</td>
                    <td className="py-2.5 px-4 text-right text-gray-700">
                      {d.peakKWh}
                    </td>
                    <td className="py-2.5 px-4 text-right text-gray-500">
                      {d.offPeakKWh}
                    </td>
                    <td className="py-2.5 px-4 text-right text-gray-700">
                      ${d.withoutBESS.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 text-right text-gray-700">
                      ${d.withBESS.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 text-right text-[#7D9B7E] font-semibold">
                      ${d.savings.toLocaleString()}
                    </td>
                  </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-200 bg-gray-50 font-semibold">
                <td className="py-3 px-4 text-gray-800">合計</td>
                <td className="py-3 px-4 text-right text-gray-800">
                  {summary.totalPeakKWh.toLocaleString()}
                </td>
                <td className="py-3 px-4 text-right text-gray-800">
                  {summary.totalOffPeakKWh.toLocaleString()}
                </td>
                <td className="py-3 px-4 text-right text-gray-800">
                  ${summary.costWithoutBESS.toLocaleString()}
                </td>
                <td className="py-3 px-4 text-right text-gray-800">
                  ${summary.costWithBESS.toLocaleString()}
                </td>
                <td className="py-3 px-4 text-right text-[#6B8B6C]">
                  ${summary.savings.toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
