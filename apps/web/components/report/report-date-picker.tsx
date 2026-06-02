import { Card, CardContent } from "@/components/ui/card";

export function ReportDatePicker({
  dateMode,
  startDate,
  endDate,
  onDateModeChange,
  onStartDateChange,
  onEndDateChange,
  showExport,
  onExport,
}: {
  dateMode: "single" | "range";
  startDate: string;
  endDate: string;
  onDateModeChange: (mode: "single" | "range") => void;
  onStartDateChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onEndDateChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  showExport: boolean;
  onExport: () => void;
}) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            {(["single", "range"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => onDateModeChange(mode)}
                className={`px-4 py-2 text-base font-medium transition-colors ${
                  dateMode === mode
                    ? "bg-[#DA7756] text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                {mode === "single" ? "某一天" : "選定區間"}
              </button>
            ))}
          </div>

          <input
            type="date"
            value={startDate}
            onChange={onStartDateChange}
            className="border border-gray-200 rounded-lg px-3 py-2 text-base bg-white focus:outline-none focus:ring-2 focus:ring-[#DA7756] focus:border-transparent"
          />

          {dateMode === "range" && (
            <>
              <span className="text-gray-400 font-medium">～</span>
              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={onEndDateChange}
                className="border border-gray-200 rounded-lg px-3 py-2 text-base bg-white focus:outline-none focus:ring-2 focus:ring-[#DA7756] focus:border-transparent"
              />
            </>
          )}

          {showExport && (
            <button
              onClick={onExport}
              className="ml-auto px-4 py-2 text-base bg-white border border-gray-300 text-gray-900 rounded-md hover:bg-gray-100 transition-colors whitespace-nowrap"
            >
              CSV 匯出
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
