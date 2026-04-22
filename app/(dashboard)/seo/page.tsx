import { Topbar } from "@/components/layout/Topbar";
import { KPICard } from "@/components/dashboard/KPICard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AreaLineChart } from "@/components/charts/AreaLineChart";
import { Badge } from "@/components/ui/badge";
import { DateRangeSelector } from "@/components/common/DateRangeSelector";
import { resolveDateRange } from "@/lib/date-range";
import { fetchSEODataByWindow } from "@/lib/gsc";
import { fetchSEOGA4SignalsByWindow } from "@/lib/ga4";
import { getCached, setCached } from "@/lib/supabase";
import type { SEOData } from "@/types/dashboard";

type SEOPageData = SEOData;

async function getSEO(days: number, cacheKey: string, window?: { start: string; end: string }): Promise<SEOPageData | null> {
  try {
    const cached = await getCached<SEOPageData>(cacheKey);
    if (cached) return cached;

    const [gscData, ga4Signals] = await Promise.all([
      fetchSEODataByWindow(days, window),
      fetchSEOGA4SignalsByWindow(days, window),
    ]);

    const merged: SEOPageData = {
      ...gscData,
      indexing: {
        indexedPages: gscData.indexing?.indexedPages ?? 0,
        landingBounce: ga4Signals.indexing.landingBounce,
        topLandingPages: ga4Signals.indexing.topLandingPages,
      },
      backlinks: ga4Signals.backlinks,
      geo: ga4Signals.geo,
    };

    await setCached(cacheKey, merged);
    return merged;
  } catch {
    return null;
  }
}

export default async function SEOPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; start?: string; end?: string }>;
}) {
  const params = await searchParams;
  const resolved = resolveDateRange(params, "30d");
  const cacheVersion = "v3";
  const cacheKey = resolved.isCustom
    ? `seo_${cacheVersion}_custom_${resolved.start}_${resolved.end}`
    : `seo_${cacheVersion}_${resolved.range}`;

  const data = await getSEO(
    resolved.days,
    cacheKey,
    resolved.start && resolved.end ? { start: resolved.start, end: resolved.end } : undefined
  );

  const brand = data?.brandVsNonBrand;
  const indexing = data?.indexing;
  const backlinks = data?.backlinks;
  const geo = data?.geo;

  return (
    <>
      <Topbar title="SEO 监控" subtitle={`关键词排名 · 搜索流量 · GSC + GA4 · ${resolved.label}`} />
      <main className="flex-1 p-6 space-y-5">

        <div className="flex justify-end">
          <DateRangeSelector />
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KPICard label="自然搜索点击" metric={data?.kpi.clicks ?? { value: "—", change: "—", up: true }} icon="🖱️" accent="purple" />
          <KPICard label="搜索展现量" metric={data?.kpi.impressions ?? { value: "—", change: "—", up: true }} icon="👁️" accent="blue" />
          <KPICard label="点击率 CTR" metric={data?.kpi.ctr ?? { value: "—", change: "—", up: true }} icon="📊" accent="green" />
          <KPICard label="平均排名" metric={data?.kpi.position ?? { value: "—", change: "—", up: true }} icon="🏆" accent="orange" />
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>品牌词 vs 非品牌词流量</CardTitle>
                <CardDescription className="mt-1">按 Query 口径统计自然搜索点击（GSC）</CardDescription>
              </div>
              <Badge variant="secondary">GSC</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="pt-5">
                  <div className="text-sm text-muted-foreground">品牌词点击</div>
                  <div className="mt-1 text-2xl font-semibold">{(brand?.brandClicks ?? 0).toLocaleString()}</div>
                  <div className="mt-1 text-xs text-muted-foreground">环比 {brand?.brandChange ?? "—"}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-5">
                  <div className="text-sm text-muted-foreground">非品牌词点击</div>
                  <div className="mt-1 text-2xl font-semibold">{(brand?.nonBrandClicks ?? 0).toLocaleString()}</div>
                  <div className="mt-1 text-xs text-muted-foreground">环比 {brand?.nonBrandChange ?? "—"}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-5">
                  <div className="text-sm text-muted-foreground">品牌词占比</div>
                  <div className="mt-1 text-2xl font-semibold">{brand?.brandShare ?? 0}%</div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-indigo-500" style={{ width: `${brand?.brandShare ?? 0}%` }} />
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>自然搜索趋势（{resolved.label}）</CardTitle>
                <CardDescription className="mt-1">展现量 / 点击量每日变化</CardDescription>
              </div>
              <Badge variant="secondary">GSC 数据</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {data?.trend?.length ? (
              <AreaLineChart
                data={data.trend}
                series={[{ key: "clicks", label: "点击量", color: "#6366F1" }]}
                yAxisRight={[{ key: "impressions", label: "展现量", color: "#10B981", type: "line" }]}
              />
            ) : <div className="h-60 flex items-center justify-center text-sm text-muted-foreground">加载中…</div>}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>收录监控</CardTitle>
                <Badge variant="outline">GSC + GA4</Badge>
              </div>
              <CardDescription>Google 索引页数（代理）+ 核心 Landing Page 跳出率</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground">Google 索引页数（代理）</div>
                  <div className="mt-1 text-2xl font-semibold">{(indexing?.indexedPages ?? 0).toLocaleString()}</div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground">核心 Landing Page 平均跳出率</div>
                  <div className="mt-1 text-2xl font-semibold">{indexing?.landingBounce ?? "—"}</div>
                </div>
              </div>
              <div className="space-y-2">
                {(indexing?.topLandingPages ?? []).slice(0, 5).map((row, i) => (
                  <div key={i} className="flex items-center justify-between rounded border px-3 py-2 text-xs">
                    <span className="truncate pr-2 font-mono text-muted-foreground">{row.path}</span>
                    <span>{row.sessions.toLocaleString()} sessions · {row.bounce}</span>
                  </div>
                ))}
                {!(indexing?.topLandingPages?.length) && (
                  <div className="text-sm text-muted-foreground">暂无 Landing Page 数据</div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>外链指标</CardTitle>
                <Badge variant="outline">GA4 Referral</Badge>
              </div>
              <CardDescription>新增 Domain 数量 + 引流质量（Engagement Rate）</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground">新增 Domain 数</div>
                  <div className="mt-1 text-2xl font-semibold">{(backlinks?.newDomains ?? 0).toLocaleString()}</div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground">引流质量</div>
                  <div className="mt-1 text-2xl font-semibold">{backlinks?.qualityRate ?? "0.0%"}</div>
                </div>
              </div>
              <div className="space-y-2">
                {(backlinks?.topReferrals ?? []).slice(0, 6).map((row, i) => (
                  <div key={i} className="flex items-center justify-between rounded border px-3 py-2 text-xs">
                    <span className="truncate pr-2">{row.domain}</span>
                    <span>{row.sessions.toLocaleString()} · {row.engagementRate}</span>
                  </div>
                ))}
                {!(backlinks?.topReferrals?.length) && (
                  <div className="text-sm text-muted-foreground">暂无外链引流数据</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>GEO 优化（AI 搜索）</CardTitle>
                <CardDescription className="mt-1">在 AI 来源中的提及频率/推荐曝光代理指标（Perplexity/Claude/ChatGPT 等）</CardDescription>
              </div>
              <Badge variant="outline">Experimental</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-lg border p-4">
                <div className="text-xs text-muted-foreground">AI 来源会话数（提及频率代理）</div>
                <div className="mt-1 text-3xl font-semibold">{(geo?.aiMentions ?? 0).toLocaleString()}</div>
                <div className="mt-1 text-xs text-muted-foreground">占全部 referral 比例：{geo?.aiShare ?? "0.0%"}</div>
              </div>
              <div className="space-y-2">
                {(geo?.topAISources ?? []).slice(0, 6).map((row, i) => (
                  <div key={i} className="flex items-center justify-between rounded border px-3 py-2 text-xs">
                    <span className="truncate pr-2">{row.source}</span>
                    <span>{row.sessions.toLocaleString()}</span>
                  </div>
                ))}
                {!(geo?.topAISources?.length) && (
                  <div className="text-sm text-muted-foreground">当前周期暂无可识别的 AI 来源流量</div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Top 关键词排名</CardTitle>
              <Badge variant="outline">{resolved.label}点击量排序</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-muted/40">
                    {["#", "关键词", "平均排名", "点击量", "展现量", "CTR"].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-left font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(data?.keywords ?? []).map((kw, i) => {
                    const rankColor = kw.position <= 3 ? "text-emerald-600 font-bold"
                      : kw.position <= 10 ? "text-amber-600 font-semibold"
                        : "text-red-500";
                    return (
                      <tr key={i} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-2.5 text-muted-foreground">{i + 1}</td>
                        <td className="px-4 py-2.5 font-medium text-foreground">{kw.word}</td>
                        <td className={`px-4 py-2.5 ${rankColor}`}>#{kw.position}</td>
                        <td className="px-4 py-2.5 font-medium">{kw.clicks.toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{kw.impressions.toLocaleString()}</td>
                        <td className="px-4 py-2.5">{kw.ctr}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

      </main>
    </>
  );
}
