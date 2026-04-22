"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";

export type DateRange = "7d" | "30d" | "90d" | "1y";

const DATE_RANGES = [
  { value: "7d" as DateRange, label: "近7天" },
  { value: "30d" as DateRange, label: "近30天" },
  { value: "90d" as DateRange, label: "近90天" },
  { value: "1y" as DateRange, label: "近一年" },
];

export function DateRangeSelector() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentRange = (searchParams.get("range") as DateRange) || "30d";

  const handleChange = (range: DateRange) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", range);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">时间范围：</span>
      <div className="flex gap-1.5">
        {DATE_RANGES.map((range) => (
          <Badge
            key={range.value}
            variant={currentRange === range.value ? "default" : "outline"}
            className="cursor-pointer hover:bg-primary/90 transition-colors"
            onClick={() => handleChange(range.value)}
          >
            {range.label}
          </Badge>
        ))}
      </div>
    </div>
  );
}

// 辅助函数：根据时间范围获取对应的天数
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

// 辅助函数：根据时间范围获取标签
export function getRangeLabel(range: DateRange): string {
  const found = DATE_RANGES.find((r) => r.value === range);
  return found?.label || "近30天";
}

// 辅助函数：Reddit 时间参数映射
export function getRedditTimeParam(range: DateRange): string {
  switch (range) {
    case "7d":
      return "week";
    case "30d":
      return "month";
    case "90d":
      return "year"; // Reddit 没有3个月选项，用year
    case "1y":
      return "year";
    default:
      return "month";
  }
}
