import { Topbar } from "@/components/layout/Topbar";
import { KPICard } from "@/components/dashboard/KPICard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AreaLineChart } from "@/components/charts/AreaLineChart";
import { Badge } from "@/components/ui/badge";
import { DateRangeSelector } from "@/components/common/DateRangeSelector";
import { resolveDateRange } from "@/lib/date-range";
import { fetchConversionDataByWindow } from "@/lib/ga4";
import { getCached, setCached } from "@/lib/supabase";
import type { ConversionData } from "@/types/dashboard";

async function getConversion(days: number, cacheKey: string, window?: { start: string; end: string }): Promise<ConversionData | null> {
  try {
    const cached = await getCached<ConversionData>(cacheKey);
    if (cached) return cached;
    const data = await fetchConversionDataByWindow(days, window);
    await setCached(cacheKey, data);
    return data;
  } catch { return null; }
}

export default async function ConversionPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; start?: string; end?: string }>;
}) {
  const params = await searchParams;
  const resolved = resolveDateRange(params, "30d");
  const cacheKey = resolved.isCustom
    ? `conversion_custom_${resolved.start}_${resolved.end}`
    : `conversion_${resolved.range}`;

  const data = await getConversion(
    resolved.days,
    cacheKey,
    resolved.start && resolved.end ? { start: resolved.start, end: resolved.end } : undefined
  );

  return (
    <>
      <Topbar title="转化分析" subtitle={`转化漏斗与渠道效果 · GA4 · ${resolved.label}`} />
      <main className="flex-1 p-6 space-y-5">

        <div className="flex justify-end">
          <DateRangeSelector />
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KPICard label="完成购买"    metric={data?.kpi.purchases  ?? { value:"—", change:"—", up:true }} icon="🛍️" accent="purple" />
          <KPICard label="发起结账"    metric={data?.kpi.checkouts  ?? { value:"—", change:"—", up:true }} icon="💳" accent="blue"   />
          <KPICard label="加入购物车"  metric={data?.kpi.addToCarts ?? { value:"—", change:"—", up:true }} icon="🛒" accent="green"  />
          <KPICard label="整体转化率"  metric={data?.kpi.cvr        ?? { value:"—", change:"—", up:true }} icon="🎯" accent="orange" />
        </div>

        {/* 转化漏斗 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>转化漏斗（{resolved.label}）</CardTitle>
                <CardDescription className="mt-1">各环节流失率分析</CardDescription>
              </div>
              <Badge>GA4 数据</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {data?.funnel?.length ? (
              <div className="space-y-3">
                {data.funnel.map((step, i) => {
                  const pct = parseFloat(step.rate);
                  const prev = i > 0 ? parseFloat(data.funnel[i - 1].rate) : 100;
                  const dropRate = prev > 0 ? (((prev - pct) / prev) * 100).toFixed(1) : "0";
                  return (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{i + 1}</span>
                          <span className="font-medium">{step.step}</span>
                          {i > 0 && <span className="text-xs text-red-500">（流失 {dropRate}%）</span>}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-muted-foreground">{step.count.toLocaleString()} 次</span>
                          <span className="font-semibold text-primary w-14 text-right">{step.rate}</span>
                        </div>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: step.rate }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">加载中…</div>
            )}
          </CardContent>
        </Card>

        {/* 购买趋势 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>购买 / 加购趋势（{resolved.label}）</CardTitle>
                <CardDescription className="mt-1">每日转化事件数量变化</CardDescription>
              </div>
              <Badge variant="secondary">GA4 事件</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {data?.trend?.length ? (
              <AreaLineChart
                data={data.trend}
                series={[
                  { key: "purchase",    label: "完成购买",   color: "#6366F1" },
                  { key: "add_to_cart", label: "加入购物车", color: "#10B981" },
                ]}
              />
            ) : (
              <div className="h-60 flex items-center justify-center text-sm text-muted-foreground">加载中…</div>
            )}
          </CardContent>
        </Card>

      </main>
    </>
  );
}
