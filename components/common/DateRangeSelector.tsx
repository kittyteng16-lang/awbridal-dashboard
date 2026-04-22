"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { DATE_RANGES, type DateRange } from "@/lib/date-range";

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
