export type DateRange = "7d" | "30d" | "90d" | "1y";

export type DateRangeParams = {
  range?: string;
  start?: string;
  end?: string;
};

export type ResolvedDateRange = {
  range: DateRange;
  days: number;
  label: string;
  start?: string;
  end?: string;
  isCustom: boolean;
};

export const DATE_RANGES = [
  { value: "7d" as DateRange, label: "近7天" },
  { value: "30d" as DateRange, label: "近30天" },
  { value: "90d" as DateRange, label: "近90天" },
  { value: "1y" as DateRange, label: "近一年" },
];

const DATE_RANGE_DAYS: Record<DateRange, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  "1y": 365,
};

function isValidISODate(value?: string): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function toDate(date: string): Date {
  return new Date(`${date}T00:00:00Z`);
}

function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function diffDaysInclusive(start: string, end: string): number {
  const s = toDate(start).getTime();
  const e = toDate(end).getTime();
  return Math.floor((e - s) / (24 * 60 * 60 * 1000)) + 1;
}

export function getPreviousWindow(start: string, end: string): { start: string; end: string } {
  const len = Math.max(diffDaysInclusive(start, end), 1);
  const prevEnd = new Date(toDate(start).getTime() - 24 * 60 * 60 * 1000);
  const prevStart = new Date(prevEnd.getTime() - (len - 1) * 24 * 60 * 60 * 1000);
  return { start: toISODate(prevStart), end: toISODate(prevEnd) };
}

export function getRangeDays(range: DateRange): number {
  return DATE_RANGE_DAYS[range] ?? 30;
}

export function getRangeLabel(range: DateRange): string {
  const found = DATE_RANGES.find((item) => item.value === range);
  return found?.label || "近30天";
}

export function resolveDateRange(params: DateRangeParams, defaultRange: DateRange = "30d"): ResolvedDateRange {
  const range = (params.range as DateRange) || defaultRange;
  const presetDays = getRangeDays(range);

  if (isValidISODate(params.start) && isValidISODate(params.end) && params.start <= params.end) {
    const days = Math.min(Math.max(diffDaysInclusive(params.start, params.end), 1), 365);
    const customLabel = `${params.start.replace(/-/g, "/")} - ${params.end.replace(/-/g, "/")}`;
    return {
      range,
      days,
      label: customLabel,
      start: params.start,
      end: params.end,
      isCustom: true,
    };
  }

  return {
    range,
    days: presetDays,
    label: getRangeLabel(range),
    isCustom: false,
  };
}

export function getRedditTimeParam(range: DateRange): string {
  return getRedditTimeParamByDays(getRangeDays(range));
}

export function getRedditTimeParamByDays(days: number): string {
  if (days <= 7) return "week";
  if (days <= 31) return "month";
  return "year";
}

export function getTrendsTimeParamByDays(days: number): string {
  if (days <= 7) return "now 7-d";
  if (days <= 31) return "today 1-m";
  if (days <= 93) return "today 3-m";
  return "today 12-m";
}
