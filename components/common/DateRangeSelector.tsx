"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { DATE_RANGES, getRangeLabel, type DateRange } from "@/lib/date-range";

function getTodayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function getPresetStartISO(days: number): string {
  const end = new Date();
  end.setUTCDate(end.getUTCDate() - (days - 1));
  return end.toISOString().slice(0, 10);
}

export function DateRangeSelector() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentRange = (searchParams.get("range") as DateRange) || "30d";
  const currentStart = searchParams.get("start") || "";
  const currentEnd = searchParams.get("end") || "";

  const defaultDates = useMemo(() => {
    const today = getTodayISO();
    if (currentStart && currentEnd) {
      return { start: currentStart, end: currentEnd };
    }
    const presetDays = currentRange === "7d" ? 7 : currentRange === "90d" ? 90 : currentRange === "1y" ? 365 : 30;
    return { start: getPresetStartISO(presetDays), end: today };
  }, [currentStart, currentEnd, currentRange]);

  const [start, setStart] = useState(defaultDates.start);
  const [end, setEnd] = useState(defaultDates.end);

  useEffect(() => {
    setStart(defaultDates.start);
    setEnd(defaultDates.end);
  }, [defaultDates.end, defaultDates.start]);

  const pushParams = (next: URLSearchParams) => {
    const query = next.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  const handlePresetChange = (range: DateRange) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", range);
    params.delete("start");
    params.delete("end");
    pushParams(params);
  };

  const applyCustomRange = () => {
    if (!start || !end || start > end) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", currentRange);
    params.set("start", start);
    params.set("end", end);
    pushParams(params);
  };

  const currentLabel = currentStart && currentEnd
    ? `${currentStart.replace(/-/g, "/")} - ${currentEnd.replace(/-/g, "/")}`
    : getRangeLabel(currentRange);

  return (
    <div className="w-full rounded-xl border bg-white p-3 shadow-sm md:max-w-[560px]">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700">时间范围</span>
          <span className="text-xs text-slate-500">{currentLabel}</span>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {DATE_RANGES.map((range) => {
            const active = !currentStart && !currentEnd && currentRange === range.value;
            return (
              <button
                type="button"
                key={range.value}
                onClick={() => handlePresetChange(range.value)}
                className={[
                  "h-9 rounded-md border text-sm transition-colors",
                  active
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                ].join(" ")}
              >
                {range.label}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto_1fr_auto] sm:items-center">
          <input
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="h-9 rounded-md border border-slate-200 px-3 text-sm text-slate-700 outline-none focus:border-blue-500"
          />
          <span className="hidden text-center text-slate-400 sm:block">~</span>
          <input
            type="date"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="h-9 rounded-md border border-slate-200 px-3 text-sm text-slate-700 outline-none focus:border-blue-500"
          />
          <button
            type="button"
            onClick={applyCustomRange}
            className="h-9 rounded-md bg-blue-600 px-3 text-sm font-medium text-white hover:bg-blue-700"
          >
            应用自定义日期
          </button>
        </div>
      </div>
    </div>
  );
}
