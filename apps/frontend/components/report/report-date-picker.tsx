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
          <div className="flex rounded-lg border border-[#3A2415] overflow-hidden">
            {(["single", "range"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => onDateModeChange(mode)}
                className={`px-4 py-2 text-base font-medium transition-colors ${
                  dateMode === mode
                    ? "bg-[#DA7756] text-white"
                    : "bg-[#241508] text-white/60 hover:bg-[#2A1A0F]"
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
            onClick={(e) => (e.currentTarget as HTMLInputElement).showPicker?.()}
            style={{ colorScheme: "dark" }}
            className="cursor-pointer border border-[#3A2415] rounded-lg px-3 py-2 text-base bg-[#1E1208] text-white focus:outline-none focus:ring-1 focus:ring-[#E8883E]"
          />

          {dateMode === "range" && (
            <>
              <span className="text-white/40 font-medium">～</span>
              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={onEndDateChange}
                onClick={(e) => (e.currentTarget as HTMLInputElement).showPicker?.()}
                style={{ colorScheme: "dark" }}
                className="cursor-pointer border border-[#3A2415] rounded-lg px-3 py-2 text-base bg-[#1E1208] text-white focus:outline-none focus:ring-1 focus:ring-[#E8883E]"
              />
            </>
          )}

          {showExport && (
            <button
              onClick={onExport}
              className="ml-auto px-4 py-2 text-sm font-medium bg-[#E8883E] text-white rounded-lg hover:bg-[#d4762e] transition-colors whitespace-nowrap"
            >
              CSV 匯出
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
