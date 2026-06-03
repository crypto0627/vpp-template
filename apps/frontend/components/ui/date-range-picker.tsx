"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { zhTW } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DateRangePickerProps {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  onRangeChange: (start: string, end: string) => void;
  maxDate?: string;
}

export function DateRangePicker({
  startDate,
  endDate,
  onRangeChange,
  maxDate,
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false);

  const range: DateRange = {
    from: parseISO(startDate),
    to: parseISO(endDate),
  };

  const handleSelect = (selected: DateRange | undefined) => {
    if (!selected) return;
    const from = selected.from ? format(selected.from, "yyyy-MM-dd") : startDate;
    const to = selected.to ? format(selected.to, "yyyy-MM-dd") : from;
    onRangeChange(from, to);
    if (selected.from && selected.to) setOpen(false);
  };

  const label =
    range.from && range.to
      ? `${format(range.from, "yyyy/MM/dd")} – ${format(range.to, "yyyy/MM/dd")}`
      : "選擇日期區間";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          "flex items-center gap-2 px-3 py-2 text-xs rounded-xl border transition-colors w-full cursor-pointer",
          "bg-[#1E1208] border-[#3A2415] text-white hover:border-[#E8883E] focus:outline-none",
        )}
      >
        <CalendarIcon size={13} className="text-[#E8883E] shrink-0" />
        <span className="truncate">{label}</span>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 bg-[#241508] border-[#3A2415]"
        align="start"
      >
        <Calendar
          mode="range"
          selected={range}
          onSelect={handleSelect}
          numberOfMonths={2}
          locale={zhTW}
          disabled={maxDate ? { after: parseISO(maxDate) } : undefined}
          defaultMonth={range.from}
        />
      </PopoverContent>
    </Popover>
  );
}
