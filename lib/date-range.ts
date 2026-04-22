export type DateRange = "7d" | "30d" | "90d" | "1y";

export const DATE_RANGES = [
  { value: "7d" as DateRange, label: "近7天" },
  { value: "30d" as DateRange, label: "近30天" },
  { value: "90d" as DateRange, label: "近90天" },
  { value: "1y" as DateRange, label: "近一年" },
];

export function getRangeDays(range: DateRange): number {
  switch (range) {
    case "7d":
      return 7;
    case "30d":
      return 30;
    case "90d":
      return 90;
    case "1y":
      return 365;
    default:
      return 30;
  }
}

export function getRangeLabel(range: DateRange): string {
  const found = DATE_RANGES.find((item) => item.value === range);
  return found?.label || "近30天";
}

export function getRedditTimeParam(range: DateRange): string {
  switch (range) {
    case "7d":
      return "week";
    case "30d":
      return "month";
    case "90d":
      return "year";
    case "1y":
      return "year";
    default:
      return "month";
  }
}
