import { TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { KPIMetric } from "@/types/dashboard";

interface KPICardProps {
  label: string;
  metric: KPIMetric;
  icon: string;
  accent?: "purple" | "green" | "orange" | "blue";
}

const ACCENT = {
  purple: { bar: "bg-primary",         icon: "bg-indigo-50 text-primary" },
  green:  { bar: "bg-emerald-500",     icon: "bg-emerald-50 text-emerald-600" },
  orange: { bar: "bg-amber-500",       icon: "bg-amber-50 text-amber-600" },
  blue:   { bar: "bg-blue-500",        icon: "bg-blue-50 text-blue-600" },
};

export function KPICard({ label, metric, icon, accent = "purple" }: KPICardProps) {
  const colors = ACCENT[accent];
  return (
    <Card className="relative overflow-hidden">
      {/* top accent bar */}
      <div className={cn("absolute inset-x-0 top-0 h-0.5", colors.bar)} />
      <CardContent className="pt-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold text-foreground leading-none">{metric.value}</p>
          </div>
          <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl text-lg", colors.icon)}>
            {icon}
          </span>
        </div>
        <div className="mt-3 flex items-center gap-1.5">
          {metric.up ? (
            <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5 text-red-500" />
          )}
          <span className={cn("text-xs font-semibold", metric.up ? "text-emerald-600" : "text-red-600")}>
            {metric.change}
          </span>
          <span className="text-xs text-muted-foreground">vs 上月</span>
        </div>
      </CardContent>
    </Card>
  );
}
