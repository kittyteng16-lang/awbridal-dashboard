import { Topbar } from "@/components/layout/Topbar";
import { KPICard } from "@/components/dashboard/KPICard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AreaLineChart } from "@/components/charts/AreaLineChart";
import { DonutChart } from "@/components/charts/DonutChart";
import { RadarChart } from "@/components/charts/RadarChart";
import { Badge } from "@/components/ui/badge";
import { fetchTrafficData, fetchOverviewHealth } from "@/lib/ga4";
import { fetchSEOData } from "@/lib/gsc";
import { getCached, setCached } from "@/lib/supabase";
import type { OverviewData } from "@/types/dashboard";

async function getOverview(): Promise<OverviewData | null> {
  try {
    const cached = await getCached<OverviewData>("overview");
    if (cached) return cached;
    const [traffic, seo, health] = await Promise.all([
      fetchTrafficData(),
      fetchSEOData(),
      fetchOverviewHealth(),
    ]);
    const data: OverviewData = {
      kpi: {
        pv: traffic.kpi.pv,
        uv: traffic.kpi.uv,
        organicClicks: seo.kpi.clicks,
        avgPosition: seo.kpi.position,
      },
      trend: traffic.trend,
      sources: traffic.sources,
      health,
    };
    await setCached("overview", data);
    return data;
  } catch {
    return null;
  }
}

export default async function OverviewPage() {
  const data = await getOverview();

  return (
    <>
      <Topbar title="总览" subtitle="业务数据全景 · GA4 + GSC 实时数据" />
      <main className="flex-1 p-6 space-y-5">

        {/* KPI 卡片 */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KPICard label="页面浏览量 PV" metric={data?.kpi.pv      ?? { value: "—", change: "—", up: true }} icon="👁️" accent="purple" />
          <KPICard label="独立用户 UV"   metric={data?.kpi.uv      ?? { value: "—", change: "—", up: true }} icon="👤" accent="green"  />
          <KPICard label="SEO 点击量"    metric={data?.kpi.organicClicks ?? { value: "—", change: "—", up: true }} icon="🔍" accent="orange" />
          <KPICard label="平均搜索排名"  metric={data?.kpi.avgPosition   ?? { value: "—", change: "—", up: true }} icon="📈" accent="blue"   />
        </div>

        {/* 趋势图 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>核心指标趋势（近30天）</CardTitle>
                <CardDescription className="mt-1">PV / UV 每日走势</CardDescription>
              </div>
              <Badge variant="default">GA4 实时</Badge>
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
            ) : (
              <div className="h-60 flex items-center justify-center text-sm text-muted-foreground">
                数据加载中…
              </div>
            )}
          </CardContent>
        </Card>

        {/* 来源 + 健康度 */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>流量来源分布</CardTitle>
              <CardDescription>各渠道 Sessions 占比</CardDescription>
            </CardHeader>
            <CardContent>
              {data?.sources?.length ? (
                <DonutChart data={data.sources} />
              ) : (
                <div className="h-60 flex items-center justify-center text-sm text-muted-foreground">数据加载中…</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>业务板块健康度</CardTitle>
              <CardDescription>各维度综合评分（满分100）</CardDescription>
            </CardHeader>
            <CardContent>
              {data?.health?.length ? (
                <RadarChart data={data.health} />
              ) : (
                <div className="h-60 flex items-center justify-center text-sm text-muted-foreground">数据加载中…</div>
              )}
            </CardContent>
          </Card>
        </div>

      </main>
    </>
  );
}
