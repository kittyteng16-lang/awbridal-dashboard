import { Topbar } from "@/components/layout/Topbar";
import { KPICard } from "@/components/dashboard/KPICard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AreaLineChart } from "@/components/charts/AreaLineChart";
import { DonutChart } from "@/components/charts/DonutChart";
import { RadarChart } from "@/components/charts/RadarChart";
import { Badge } from "@/components/ui/badge";
import { DateRangeSelector } from "@/components/common/DateRangeSelector";
import { getRangeDays, getRangeLabel, type DateRange } from "@/lib/date-range";
import { fetchTrafficData, fetchOverviewHealth } from "@/lib/ga4";
import { fetchSEOData } from "@/lib/gsc";
import { getCached, setCached } from "@/lib/supabase";
import type { OverviewData } from "@/types/dashboard";

async function getOverview(days: number): Promise<OverviewData | null> {
  try {
    const cacheKey = `overview_${days}d`;
    const cached = await getCached<OverviewData>(cacheKey);
    if (cached) return cached;
    const [traffic, seo, health] = await Promise.all([
      fetchTrafficData(days),
      fetchSEOData(days),
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
    await setCached(cacheKey, data);
    return data;
  } catch {
    return null;
  }
}

// 生成业务诊断
function generateBusinessInsights(data: OverviewData | null) {
  if (!data) {
    return {
      insights: ["正在获取业务数据..."],
      status: "neutral" as const
    };
  }

  const insights: string[] = [];
  let status: "good" | "warning" | "neutral" = "neutral";

  // KPI 分析
  const pvChange = typeof data.kpi?.pv?.change === 'string' ? 0 : parseFloat(String(data.kpi?.pv?.change || 0));
  const uvChange = typeof data.kpi?.uv?.change === 'string' ? 0 : parseFloat(String(data.kpi?.uv?.change || 0));
  const clicksChange = typeof data.kpi?.organicClicks?.change === 'string' ? 0 : parseFloat(String(data.kpi?.organicClicks?.change || 0));
  const positionChange = typeof data.kpi?.avgPosition?.change === 'string' ? 0 : parseFloat(String(data.kpi?.avgPosition?.change || 0));

  // 流量趋势分析
  if (pvChange > 10 || uvChange > 10) {
    insights.push(`📈 流量增长强劲：PV ${pvChange > 0 ? '+' : ''}${pvChange}%，UV ${uvChange > 0 ? '+' : ''}${uvChange}%`);
    status = "good";
  } else if (pvChange < -10 || uvChange < -10) {
    insights.push(`⚠️ 流量下降明显：PV ${pvChange}%，UV ${uvChange}%，建议检查渠道质量`);
    status = "warning";
  } else {
    insights.push(`📊 流量表现平稳：PV ${pvChange > 0 ? '+' : ''}${pvChange}%，UV ${uvChange > 0 ? '+' : ''}${uvChange}%`);
  }

  // SEO 表现
  if (clicksChange > 15) {
    insights.push(`🔍 SEO 表现优秀：自然搜索点击量增长 ${clicksChange}%`);
  } else if (clicksChange < -15) {
    insights.push(`⚠️ SEO 需优化：自然搜索点击量下降 ${clicksChange}%`);
    status = "warning";
  }

  // 搜索排名
  if (positionChange < -2) {
    insights.push(`✅ 搜索排名提升：平均位置上升 ${Math.abs(positionChange).toFixed(1)} 位`);
  } else if (positionChange > 2) {
    insights.push(`⚠️ 搜索排名下降：平均位置下滑 ${positionChange.toFixed(1)} 位`);
  }

  // 流量来源分析
  if (data.sources && Array.isArray(data.sources) && data.sources.length > 0) {
    const organicSource = data.sources.find(s => s?.name?.includes('Organic') || s?.name?.includes('自然'));
    if (organicSource && organicSource.value > 40) {
      insights.push(`💡 自然流量占比健康（${organicSource.value}%），继续保持 SEO 优化`);
    } else if (organicSource && organicSource.value < 20) {
      insights.push(`💡 建议：加强 SEO 投入，当前自然流量占比仅 ${organicSource.value}%`);
    }
  }

  // 健康度分析
  if (data.health && Array.isArray(data.health) && data.health.length > 0) {
    const avgHealth = data.health.reduce((sum, h) => sum + (h?.score || 0), 0) / data.health.length;
    if (avgHealth >= 80) {
      insights.push(`✅ 业务板块整体健康，平均得分 ${avgHealth.toFixed(0)} 分`);
    } else if (avgHealth < 60) {
      insights.push(`⚠️ 业务板块需要关注，平均得分 ${avgHealth.toFixed(0)} 分`);
      status = "warning";
    }

    const weakest = data.health.reduce((min, h) => (h?.score || 100) < (min?.score || 100) ? h : min);
    if (weakest?.score && weakest.score < 70) {
      insights.push(`💡 重点优化：${weakest.subject} 板块评分较低（${weakest.score}分）`);
    }
  }

  return { insights, status };
}

export default async function OverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const params = await searchParams;
  const range = (params.range as DateRange) || "30d";
  const days = getRangeDays(range);
  const rangeLabel = getRangeLabel(range);

  const data = await getOverview(days);
  const analysis = generateBusinessInsights(data);

  return (
    <>
      <Topbar title="总览" subtitle={`业务数据全景 · GA4 + GSC · ${rangeLabel}`} />
      <main className="flex-1 p-6 space-y-5">

        {/* 时间范围选择器 */}
        <div className="flex justify-end">
          <DateRangeSelector />
        </div>

        {/* 业务诊断分析 */}
        <Card className={
          analysis.status === "good" ? "border-emerald-200 bg-emerald-50/30" :
          analysis.status === "warning" ? "border-amber-200 bg-amber-50/30" :
          "border-blue-200 bg-blue-50/30"
        }>
          <CardHeader>
            <div className="flex items-center gap-2">
              <span className="text-2xl">
                {analysis.status === "good" ? "🎯" : analysis.status === "warning" ? "⚡" : "📊"}
              </span>
              <div>
                <CardTitle>业务诊断分析</CardTitle>
                <CardDescription className="mt-1">{rangeLabel}数据总览 · {analysis.insights.length} 项关键发现</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analysis.insights.map((insight, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-muted-foreground">•</span>
                  <span>{insight}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

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
                <CardTitle>核心指标趋势（{rangeLabel}）</CardTitle>
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
