"use client";

import type { ReactNode } from "react";

interface DateRangeSearchProps {
  startDate: string;
  endDate: string;
  min?: string;
  max?: string;
  loading?: boolean;
  /** Optional helper text shown on the right (e.g. selectable range). */
  hint?: string;
  /** Optional trailing element (e.g. CSV export button). */
  rightSlot?: ReactNode;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
  onSearch: () => void;
}

const inputClass =
  "cursor-pointer border border-[#3A2415] rounded-lg px-3 py-2 text-sm bg-[#1E1208] text-white focus:outline-none focus:ring-1 focus:ring-[#E8883E]";

/** Consistent start～end date range selector + 查詢 button used across search pages. */
export function DateRangeSearch({
  startDate,
  endDate,
  min,
  max,
  loading,
  hint,
  rightSlot,
  onStartChange,
  onEndChange,
  onSearch,
}: DateRangeSearchProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <input
        type="date"
        value={startDate}
        min={min}
        max={max}
        onChange={(e) => onStartChange(e.target.value)}
        onClick={(e) => (e.currentTarget as HTMLInputElement).showPicker?.()}
        style={{ colorScheme: "dark" }}
        className={inputClass}
      />
      <span className="text-white/40">～</span>
      <input
        type="date"
        value={endDate}
        min={startDate || min}
        max={max}
        onChange={(e) => onEndChange(e.target.value)}
        onClick={(e) => (e.currentTarget as HTMLInputElement).showPicker?.()}
        style={{ colorScheme: "dark" }}
        className={inputClass}
      />
      <button
        onClick={onSearch}
        disabled={!startDate || !endDate || loading}
        className="px-5 py-2 text-sm font-medium bg-[#E8883E] text-white rounded-lg hover:bg-[#d4762e] transition-colors disabled:opacity-50"
      >
        {loading ? "查詢中…" : "查詢"}
      </button>
      {rightSlot && <div className="ml-auto">{rightSlot}</div>}
      {hint && !rightSlot && (
        <span className="text-xs text-white/30 ml-auto hidden sm:inline">{hint}</span>
      )}
    </div>
  );
}
