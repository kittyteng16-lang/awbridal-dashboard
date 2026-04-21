import { Topbar } from "@/components/layout/Topbar";
import { KPICard } from "@/components/dashboard/KPICard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AreaLineChart } from "@/components/charts/AreaLineChart";
import { DonutChart } from "@/components/charts/DonutChart";
import { Badge } from "@/components/ui/badge";
import { fetchTrafficData } from "@/lib/ga4";
import { getCached, setCached } from "@/lib/supabase";
import type { TrafficData } from "@/types/dashboard";

async function getTraffic(): Promise<TrafficData | null> {
  try {
    const cached = await getCached<TrafficData>("traffic");
    if (cached) return cached;
    const data = await fetchTrafficData();
    await setCached("traffic", data);
    return data;
  } catch { return null; }
}

export default async function TrafficPage() {
  const data = await getTraffic();

  return (
    <>
      <Topbar title="流量分析" subtitle="访问量与渠道分布 · Google Analytics 4" />
      <main className="flex-1 p-6 space-y-5">

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
                <CardTitle>PV / UV 趋势（近30天）</CardTitle>
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
