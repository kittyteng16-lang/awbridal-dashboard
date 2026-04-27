import { Topbar } from "@/components/layout/Topbar";
import { KPICard } from "@/components/dashboard/KPICard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AreaLineChart } from "@/components/charts/AreaLineChart";
import { DonutChart } from "@/components/charts/DonutChart";
import { Badge } from "@/components/ui/badge";
import { DateRangeSelector } from "@/components/common/DateRangeSelector";
import { resolveDateRange } from "@/lib/date-range";
import { fetchTrafficDataByWindow } from "@/lib/ga4";
import { getCached, setCached } from "@/lib/supabase";
import { analyzeTraffic } from "@/lib/analytics";
import type { TrafficData } from "@/types/dashboard";
import { AlertCircle, TrendingUp, CheckCircle, Info } from "lucide-react";

const INSIGHT_ICONS = {
  success: CheckCircle,
  warning: AlertCircle,
  danger: AlertCircle,
  info: Info,
};

const INSIGHT_COLORS = {
  success: "border-emerald-200 bg-emerald-50/30",
  warning: "border-amber-200 bg-amber-50/30",
  danger: "border-red-200 bg-red-50/30",
  info: "border-blue-200 bg-blue-50/30",
};

const INSIGHT_ICON_COLORS = {
  success: "text-emerald-600",
  warning: "text-amber-600",
  danger: "text-red-600",
  info: "text-blue-600",
};

const PRIORITY_BADGES = {
  high: { label: "高优先级", className: "bg-red-100 text-red-700 border-red-200" },
  medium: { label: "中优先级", className: "bg-amber-100 text-amber-700 border-amber-200" },
  low: { label: "低优先级", className: "bg-slate-100 text-slate-600 border-slate-200" },
};

async function getTraffic(days: number, cacheKey: string, window?: { start: string; end: string }): Promise<TrafficData | null> {
  try {
    const cached = await getCached<TrafficData>(cacheKey);
    if (cached) return cached;
    const data = await fetchTrafficDataByWindow(days, window);
    await setCached(cacheKey, data);
    return data;
  } catch { return null; }
}

export default async function TrafficPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; start?: string; end?: string }>;
}) {
  const params = await searchParams;
  const resolved = resolveDateRange(params, "30d");
  const cacheKey = resolved.isCustom
    ? `traffic_custom_${resolved.start}_${resolved.end}`
    : `traffic_${resolved.range}`;

  const data = await getTraffic(
    resolved.days,
    cacheKey,
    resolved.start && resolved.end ? { start: resolved.start, end: resolved.end } : undefined
  );

  const insights = analyzeTraffic(data);

  return (
    <>
      <Topbar title="流量分析" subtitle={`访问量与渠道分布 · GA4 · ${resolved.label}`} />
      <main className="flex-1 p-6 space-y-5">

        <div className="flex justify-end">
          <DateRangeSelector />
        </div>

        {/* 智能诊断 */}
        {insights.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-1 w-1 rounded-full bg-primary" />
              <h2 className="text-lg font-semibold">流量诊断与优化建议</h2>
            </div>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {insights.map((insight, i) => {
                const Icon = INSIGHT_ICONS[insight.type];
                const colorClass = INSIGHT_COLORS[insight.type];
                const iconColor = INSIGHT_ICON_COLORS[insight.type];
                const priorityBadge = PRIORITY_BADGES[insight.priority];
                return (
                  <Card key={i} className={colorClass}>
                    <CardContent className="pt-5">
                      <div className="flex items-start gap-3">
                        <Icon className={`h-5 w-5 shrink-0 ${iconColor}`} />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="font-semibold">{insight.title}</div>
                            <Badge variant="outline" className={`shrink-0 text-xs ${priorityBadge.className}`}>
                              {priorityBadge.label}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">{insight.description}</div>
                          <div className="rounded-md bg-white/60 p-3 text-sm">
                            <div className="font-medium text-foreground">💡 优化建议</div>
                            <div className="mt-1 text-muted-foreground">{insight.recommendation}</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        )}

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KPICard label="页面浏览量 PV" metric={data?.kpi.pv       ?? { value:"—", change:"—", up:true }} icon="📄" accent="purple" />
          <KPICard label="独立访客 UV"   metric={data?.kpi.uv       ?? { value:"—", change:"—", up:true }} icon="👤" accent="green"  />
          <KPICard label="跳出率"        metric={data?.kpi.bounce   ?? { value:"—", change:"—", up:true }} icon="🚪" accent="orange" />
          <KPICard label="平均会话时长"  metric={data?.kpi.duration ?? { value:"—", change:"—", up:true }} icon="⏱️" accent="blue"   />
        </div>

        {/* PV/UV 趋势 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>PV / UV 趋势（{resolved.label}）</CardTitle>
                <CardDescription className="mt-1">每日访问量变化</CardDescription>
              </div>
              <Badge>GA4 数据</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {data?.trend?.length ? (
              <AreaLineChart
                data={data.trend}
                series={[
                  { key: "pv", label: "PV", color: "#6366F1" },
                  { key: "uv", label: "UV", color: "#10B981" },
                ]}
              />
            ) : <div className="h-60 flex items-center justify-center text-sm text-muted-foreground">加载中…</div>}
          </CardContent>
        </Card>

        {/* 来源 + Top 页面 */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>流量来源渠道</CardTitle>
              <CardDescription>各渠道 Sessions 占比</CardDescription>
            </CardHeader>
            <CardContent>
              {data?.sources?.length ? <DonutChart data={data.sources} /> : <div className="h-60 flex items-center justify-center text-sm text-muted-foreground">加载中…</div>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top 10 热门页面</CardTitle>
              <CardDescription>按页面浏览量排序</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground uppercase tracking-wide">#</th>
                      <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground uppercase tracking-wide">页面</th>
                      <th className="px-4 py-2.5 text-right font-semibold text-muted-foreground uppercase tracking-wide">PV</th>
                      <th className="px-4 py-2.5 text-right font-semibold text-muted-foreground uppercase tracking-wide">跳出率</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.topPages ?? []).map((p, i) => (
                      <tr key={i} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-2.5">
                          <span className={`inline-flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold ${i===0?"bg-amber-100 text-amber-700":i===1?"bg-slate-100 text-slate-600":i===2?"bg-orange-100 text-orange-700":"bg-muted text-muted-foreground"}`}>
                            {i + 1}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 font-mono text-primary">{p.path}</td>
                        <td className="px-4 py-2.5 text-right font-medium">{p.pv.toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-right text-muted-foreground">{p.bounce}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

      </main>
    </>
  );
}
