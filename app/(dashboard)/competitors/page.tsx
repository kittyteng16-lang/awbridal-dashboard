import { Topbar } from "@/components/layout/Topbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fetchCompetitorData } from "@/lib/competitors";
import { getCached } from "@/lib/supabase";
import { analyzeCompetitors } from "@/lib/analytics";
import { TrendingUp, TrendingDown, Minus, AlertCircle, CheckCircle, Info } from "lucide-react";
import type { CompetitorData } from "@/types/dashboard";

const BRAND_COLORS: Record<string, string> = {
  azazie: "#6366F1",
  birdygrey: "#10B981",
  hellomolly: "#F59E0B",
  jjshouse: "#EF4444",
};

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

function TrendIcon({ trend }: { trend: string }) {
  if (trend.includes("↑") || trend.startsWith("+")) return <TrendingUp className="h-3 w-3 text-emerald-500" />;
  if (trend.includes("↓") || trend.startsWith("-")) return <TrendingDown className="h-3 w-3 text-red-500" />;
  return <Minus className="h-3 w-3 text-slate-400" />;
}

async function getCompetitorData(): Promise<CompetitorData> {
  // 尝试从缓存读取
  try {
    const [traffic, merchandising, ads, reputation] = await Promise.all([
      getCached<any[]>("competitors_traffic"),
      getCached<any[]>("competitors_merchandising"),
      getCached<any[]>("competitors_ads"),
      getCached<any[]>("competitors_reputation"),
    ]);

    // 如果所有缓存都存在，返回缓存数据
    if (traffic && merchandising && ads && reputation) {
      console.log("[Competitors Page] Using cached data");
      return {
        traffic: traffic as any,
        merchandising: merchandising as any,
        ads: ads as any,
        reputation: reputation as any
      };
    }
  } catch (error) {
    console.warn("[Competitors Page] Cache read failed:", error);
  }

  // 缓存不存在，实时获取（首次加载或缓存过期）
  console.log("[Competitors Page] Fetching fresh data");
  return await fetchCompetitorData();
}

export default async function CompetitorsPage() {
  const data = await getCompetitorData();
  const insights = analyzeCompetitors(data);

  return (
    <>
      <Topbar
        title="竞品监控"
        subtitle="实时监测 Azazie · BirdyGrey · HelloMolly · JJsHouse"
      />
      <main className="flex-1 p-6 space-y-6">

        {/* 竞品情报分析 */}
        {insights.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-1 w-1 rounded-full bg-primary" />
              <h2 className="text-lg font-semibold">竞品情报与战略建议</h2>
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
                            <div className="font-medium text-foreground">💡 应对策略</div>
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

        {/* 1. 流量与渠道情报 */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-1 w-1 rounded-full bg-primary" />
            <h2 className="text-lg font-semibold">流量与渠道情报</h2>
          </div>

          {/* 流量总览对比 */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {data.traffic.map((t) => (
              <Card key={t.brand}>
                <CardContent className="pt-5">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-medium uppercase text-muted-foreground">
                      {t.brand}
                    </div>
                    <Badge variant={t.visitChange.startsWith("+") ? "default" : "destructive"} className="text-xs">
                      {t.visitChange}
                    </Badge>
                  </div>
                  <div className="mt-2 text-2xl font-bold">
                    {(t.totalVisits / 1000000).toFixed(1)}M
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">月访问量</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* 流量渠道占比 */}
          <Card>
            <CardHeader>
              <CardTitle>流量渠道占比</CardTitle>
              <CardDescription>各品牌流量来源分布（Direct / Organic / Paid / Social / Referral）</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.traffic.map((t) => {
                  const total = Object.values(t.channels).reduce((sum, v) => sum + v, 0);
                  return (
                    <div key={t.brand} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium" style={{ color: BRAND_COLORS[t.brand] }}>
                          {t.brand}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Direct {t.channels.direct}% · Organic {t.channels.organic}% · Paid {t.channels.paid}%
                        </span>
                      </div>
                      <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div className="bg-indigo-500" style={{ width: `${(t.channels.direct / total) * 100}%` }} />
                        <div className="bg-emerald-500" style={{ width: `${(t.channels.organic / total) * 100}%` }} />
                        <div className="bg-amber-500" style={{ width: `${(t.channels.paid / total) * 100}%` }} />
                        <div className="bg-pink-500" style={{ width: `${(t.channels.social / total) * 100}%` }} />
                        <div className="bg-slate-400" style={{ width: `${(t.channels.referral / total) * 100}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 flex flex-wrap gap-3 text-xs">
                <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-indigo-500" />Direct</div>
                <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" />Organic</div>
                <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500" />Paid</div>
                <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-pink-500" />Social</div>
                <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-slate-400" />Referral</div>
              </div>
            </CardContent>
          </Card>

          {/* 搜索词占有率 Share of Voice */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>搜索词占有率 (Share of Voice)</CardTitle>
                <CardDescription>核心关键词的品牌排名与市场份额</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b bg-muted/40">
                        <th className="px-4 py-2 text-left font-semibold">关键词</th>
                        {data.traffic.map((t) => (
                          <th key={t.brand} className="px-3 py-2 text-center font-semibold" style={{ color: BRAND_COLORS[t.brand] }}>
                            {t.brand}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.traffic[0].shareOfVoice.map((_, i) => (
                        <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="px-4 py-2.5 font-medium">
                            {data.traffic[0].shareOfVoice[i]?.keyword}
                          </td>
                          {data.traffic.map((t) => (
                            <td key={t.brand} className="px-3 py-2.5 text-center">
                              <div className="text-xs font-semibold">#{t.shareOfVoice[i]?.rank}</div>
                              <div className="text-[10px] text-muted-foreground">{t.shareOfVoice[i]?.share}</div>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* 热门落地页 */}
            <Card>
              <CardHeader>
                <CardTitle>热门落地页</CardTitle>
                <CardDescription>各品牌流量最高的页面分布</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.traffic.map((t) => (
                    <div key={t.brand} className="space-y-1.5">
                      <div className="text-xs font-semibold" style={{ color: BRAND_COLORS[t.brand] }}>
                        {t.brand}
                      </div>
                      {t.topLandingPages.slice(0, 2).map((page, i) => (
                        <div key={i} className="flex items-center justify-between rounded border px-3 py-1.5 text-xs">
                          <span className="truncate font-mono text-muted-foreground">{page.url}</span>
                          <span className="shrink-0 pl-2 font-semibold">{page.share}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 社交媒体活跃度 */}
          <Card>
            <CardHeader>
              <CardTitle>社交媒体活跃度</CardTitle>
              <CardDescription>Instagram · TikTok · Pinterest 更新频率与互动率</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                {data.traffic.map((t) => (
                  <div key={t.brand} className="space-y-3 rounded-lg border p-3">
                    <div className="text-sm font-semibold" style={{ color: BRAND_COLORS[t.brand] }}>
                      {t.brand}
                    </div>
                    {t.socialActivity.map((s, i) => (
                      <div key={i} className="space-y-0.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{s.platform}</span>
                          <span className="text-muted-foreground">{(s.followers / 1000).toFixed(0)}K</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {s.postFreq} · 互动率 {s.engagement}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* 2. 商品与定价策略 */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-1 w-1 rounded-full bg-primary" />
            <h2 className="text-lg font-semibold">商品与定价策略</h2>
          </div>

          {/* 新品上架速率 */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {data.merchandising.map((m) => (
              <Card key={m.brand}>
                <CardContent className="pt-5">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-medium uppercase" style={{ color: BRAND_COLORS[m.brand] }}>
                      {m.brand}
                    </div>
                    <TrendIcon trend={m.newSKUs.trend} />
                  </div>
                  <div className="mt-2 text-2xl font-bold">{m.newSKUs.thisWeek}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    本周新品 SKU（上周 {m.newSKUs.lastWeek}）
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* 价格区间分布 */}
          <Card>
            <CardHeader>
              <CardTitle>价格区间分布</CardTitle>
              <CardDescription>各品牌商品价位段占比</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.merchandising.map((m) => (
                  <div key={m.brand} className="space-y-2">
                    <div className="text-sm font-semibold" style={{ color: BRAND_COLORS[m.brand] }}>
                      {m.brand}
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {m.priceDistribution.map((p, i) => (
                        <div key={i} className="rounded border p-2 text-center">
                          <div className="text-xs font-medium">{p.range}</div>
                          <div className="mt-1 text-lg font-bold">{p.count}</div>
                          <div className="text-[10px] text-muted-foreground">{p.share}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 折扣活动监控 */}
          <Card>
            <CardHeader>
              <CardTitle>折扣活动监控</CardTitle>
              <CardDescription>各品牌促销策略与频率</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {data.merchandising.map((m) => (
                  <div key={m.brand} className="space-y-2 rounded-lg border p-3">
                    <div className="text-sm font-semibold" style={{ color: BRAND_COLORS[m.brand] }}>
                      {m.brand}
                    </div>
                    {m.promotionActivity.map((p, i) => (
                      <div key={i} className="flex items-start justify-between text-xs">
                        <div className="flex-1">
                          <div className="font-medium">{p.type}</div>
                          <div className="text-muted-foreground">{p.discount}</div>
                        </div>
                        <div className="shrink-0 pl-2 text-right">
                          <div className="text-[10px] text-muted-foreground">{p.frequency}</div>
                          <div className="text-[10px] text-muted-foreground">{p.lastSeen}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* 3. 广告投流策略 */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-1 w-1 rounded-full bg-primary" />
            <h2 className="text-lg font-semibold">广告投流策略</h2>
          </div>

          {/* 在投广告数量 */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {data.ads.map((a) => (
              <Card key={a.brand}>
                <CardContent className="pt-5">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-medium uppercase" style={{ color: BRAND_COLORS[a.brand] }}>
                      {a.brand}
                    </div>
                    <Badge variant={a.adChange.startsWith("+") ? "default" : "secondary"}>
                      {a.adChange}
                    </Badge>
                  </div>
                  <div className="mt-2 text-2xl font-bold">{a.activeAds}</div>
                  <div className="mt-1 text-xs text-muted-foreground">活跃广告素材</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* 广告素材示例 */}
          <Card>
            <CardHeader>
              <CardTitle>在投素材示例</CardTitle>
              <CardDescription>Facebook / Instagram 正在运行的广告创意</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {data.ads.map((a) => (
                  <div key={a.brand} className="space-y-3 rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold" style={{ color: BRAND_COLORS[a.brand] }}>
                        {a.brand}
                      </div>
                      <Badge variant="outline" className="text-xs">{a.activeAds} 条在投</Badge>
                    </div>
                    {a.topCreatives.slice(0, 2).map((c, i) => (
                      <div key={i} className="space-y-1.5 rounded border bg-muted/30 p-3 text-xs">
                        <div className="font-semibold">{c.headline}</div>
                        <div className="text-muted-foreground">{c.copy}</div>
                        <div className="flex flex-wrap gap-2 pt-1">
                          <Badge variant="secondary" className="text-[10px]">{c.format}</Badge>
                          <Badge variant="secondary" className="text-[10px]">{c.countries.join(", ")}</Badge>
                          <Badge variant="secondary" className="text-[10px]">投放 {c.runningDays} 天</Badge>
                        </div>
                      </div>
                    ))}
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {a.keywords.slice(0, 4).map((kw, i) => (
                        <span key={i} className="rounded bg-primary/10 px-2 py-0.5 text-[10px] text-primary">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 投流国家分布 */}
          <Card>
            <CardHeader>
              <CardTitle>投流国家分布</CardTitle>
              <CardDescription>各品牌广告投放的地域重点</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                {data.ads.map((a) => (
                  <div key={a.brand} className="space-y-2 rounded-lg border p-3">
                    <div className="text-sm font-semibold" style={{ color: BRAND_COLORS[a.brand] }}>
                      {a.brand}
                    </div>
                    {a.topCountries.map((c, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span>{c.country}</span>
                        <span className="font-semibold">{c.share}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* 4. 用户反馈与声誉 */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-1 w-1 rounded-full bg-primary" />
            <h2 className="text-lg font-semibold">用户反馈与声誉</h2>
          </div>

          {/* Trustpilot 评分 */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {data.reputation.map((r) => (
              <Card key={r.brand}>
                <CardContent className="pt-5">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-medium uppercase" style={{ color: BRAND_COLORS[r.brand] }}>
                      {r.brand}
                    </div>
                    <Badge variant={r.trustpilot.change.startsWith("+") ? "default" : "destructive"} className="text-xs">
                      {r.trustpilot.change}
                    </Badge>
                  </div>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-2xl font-bold">{r.trustpilot.score.toFixed(1)}</span>
                    <span className="text-xs text-muted-foreground">/ 5.0</span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    基于 {(r.trustpilot.reviews / 1000).toFixed(1)}K 条评价
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* 情感分布 */}
          <Card>
            <CardHeader>
              <CardTitle>用户情感分布</CardTitle>
              <CardDescription>正面 / 中性 / 负面评价占比</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.reputation.map((r) => {
                  const total = r.sentiment.positive + r.sentiment.neutral + r.sentiment.negative;
                  return (
                    <div key={r.brand} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium" style={{ color: BRAND_COLORS[r.brand] }}>
                          {r.brand}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          正面 {r.sentiment.positive}% · 中性 {r.sentiment.neutral}% · 负面 {r.sentiment.negative}%
                        </span>
                      </div>
                      <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div className="bg-emerald-500" style={{ width: `${(r.sentiment.positive / total) * 100}%` }} />
                        <div className="bg-slate-400" style={{ width: `${(r.sentiment.neutral / total) * 100}%` }} />
                        <div className="bg-red-500" style={{ width: `${(r.sentiment.negative / total) * 100}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* 常见问题与痛点 */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>差评关键词聚类</CardTitle>
                <CardDescription>用户投诉最多的问题类型</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.reputation.map((r) => (
                    <div key={r.brand} className="space-y-2">
                      <div className="text-xs font-semibold" style={{ color: BRAND_COLORS[r.brand] }}>
                        {r.brand}
                      </div>
                      {r.commonIssues.slice(0, 3).map((issue, i) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <TrendIcon trend={issue.trend} />
                            <span>{issue.topic}</span>
                          </div>
                          <span className="font-semibold">{issue.mentions}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>用户常问问题 (QA)</CardTitle>
                <CardDescription>商品详情页高频问题</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.reputation.map((r) => (
                    <div key={r.brand} className="space-y-2">
                      <div className="text-xs font-semibold" style={{ color: BRAND_COLORS[r.brand] }}>
                        {r.brand}
                      </div>
                      {r.topQuestions.slice(0, 3).map((q, i) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <span className="flex-1">{q.question}</span>
                          <span className="shrink-0 pl-2 text-muted-foreground">{q.frequency}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* 数据接入状态 */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card className="border-emerald-200 bg-emerald-50/30">
            <CardContent className="pt-5">
              <div className="flex items-start gap-3">
                <span className="text-2xl">✅</span>
                <div className="space-y-2 text-sm">
                  <div className="font-semibold">已接入数据源</div>
                  <ul className="space-y-1 text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      <span className="font-medium">Trustpilot</span> - 评价数据（公开爬虫，无需 API Key）
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      <span className="font-medium">商品爬虫</span> - 价格/库存监控（支持降级）
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                      <span className="font-medium">自动更新</span> - 每 6 小时刷新（Vercel Cron）
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50/30">
            <CardContent className="pt-5">
              <div className="flex items-start gap-3">
                <span className="text-2xl">⚙️</span>
                <div className="space-y-2 text-sm">
                  <div className="font-semibold">待配置数据源</div>
                  <ul className="space-y-1 text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                      <span className="font-medium">Facebook Ad Library</span> - 需配置 Access Token
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                      <span className="font-medium">SimilarWeb API</span> - 需付费订阅（$200-500/月）
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                      <span>查看状态：</span>
                      <a href="/api/competitors/status" target="_blank" className="text-blue-600 hover:underline">
                        /api/competitors/status
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

      </main>
    </>
  );
}
