import { Topbar } from "@/components/layout/Topbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DateRangeSelector } from "@/components/common/DateRangeSelector";
import { AreaLineChart } from "@/components/charts/AreaLineChart";
import { getRedditTimeParamByDays, getTrendsTimeParamByDays, resolveDateRange } from "@/lib/date-range";
import { fetchAllTrendGroups, fetchRedditTrends } from "@/lib/trends";
import type { TrendingTopic } from "@/lib/trends";

const GROUP_COLORS = [
  ["#6366F1", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"],
  ["#3B82F6", "#14B8A6", "#F97316", "#EC4899", "#A78BFA"],
  ["#06B6D4", "#22C55E", "#EAB308", "#F43F5E", "#7C3AED"],
];

export default async function TopicsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; start?: string; end?: string }>;
}) {
  const params = await searchParams;
  const resolved = resolveDateRange(params, "30d");
  const trendsTime = getTrendsTimeParamByDays(resolved.days);
  const redditTime = getRedditTimeParamByDays(resolved.days);

  const [trendGroups, reddit] = await Promise.all([
    fetchAllTrendGroups(trendsTime).catch(() => []),
    fetchRedditTrends("", 20, redditTime).catch(() => [] as TrendingTopic[]),
  ]);

  return (
    <>
      <Topbar title="热门话题" subtitle={`外部热点与品牌声量 · Google Trends + Reddit · ${resolved.label}`} />
      <main className="flex-1 p-6 space-y-5">

        <div className="flex justify-end">
          <DateRangeSelector />
        </div>

        {/* Google Trends 分组折线图 */}
        {trendGroups.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center gap-3 py-10">
              <span className="text-4xl">📊</span>
              <p className="text-sm text-muted-foreground">Google Trends 数据暂时不可用</p>
            </CardContent>
          </Card>
        ) : (
          trendGroups.map((group, gi) => {
            const colors = GROUP_COLORS[gi % GROUP_COLORS.length];
            // 构建图表数据：每个时间点一行，每个关键词一列
            const allDates = group.keywords[0]?.timeline.map((p) => p.date) ?? [];
            const chartData = allDates.map((date, di) => {
              const row: Record<string, string | number> = { date };
              group.keywords.forEach((kw) => {
                row[kw.keyword] = kw.timeline[di]?.value ?? 0;
              });
              return row;
            });
            const series = group.keywords.map((kw, ki) => ({
              key: kw.keyword,
              label: kw.keyword,
              color: colors[ki % colors.length],
            }));

            return (
              <Card key={group.groupName}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{group.groupName} · 搜索热度趋势</CardTitle>
                      <CardDescription className="mt-1">
                        {resolved.label} Google Trends 指数（0–100）
                      </CardDescription>
                    </div>
                    <Badge variant="outline">Google Trends</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* 趋势折线图 */}
                  {chartData.length > 0 ? (
                    <AreaLineChart data={chartData} series={series} height={220} />
                  ) : (
                    <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
                      当前时间范围无趋势数据
                    </div>
                  )}
                  {/* 关键词平均热度排名 */}
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {group.keywords
                      .slice()
                      .sort((a, b) => b.avgInterest - a.avgInterest)
                      .map((kw, ki) => (
                        <div key={kw.keyword} className="flex items-center justify-between rounded border px-3 py-2 text-xs">
                          <div className="flex items-center gap-2 truncate">
                            <span
                              className="h-2.5 w-2.5 shrink-0 rounded-full"
                              style={{ background: colors[group.keywords.indexOf(kw) % colors.length] }}
                            />
                            <span className="truncate">{kw.keyword}</span>
                          </div>
                          <span className={`shrink-0 pl-2 font-semibold tabular-nums ${ki === 0 ? "text-indigo-600" : ""}`}>
                            {kw.avgInterest > 0 ? kw.avgInterest : "—"}
                          </span>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}

        {/* Reddit 热门话题 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>婚纱 / Prom Reddit 热帖</CardTitle>
                <CardDescription className="mt-1">
                  {resolved.label} · r/weddingplanning r/weddingdress r/bridal r/prom r/PromDresses 等
                </CardDescription>
              </div>
              <Badge variant="outline">Reddit</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {reddit.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
                <span className="text-4xl">💬</span>
                <p className="text-sm text-muted-foreground">暂无数据</p>
              </div>
            ) : (
              <div className="divide-y">
                {reddit.map((topic, i) => (
                  <div key={i} className="px-4 py-3 hover:bg-muted/30 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <a
                          href={topic.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-foreground hover:text-primary line-clamp-2 leading-snug"
                        >
                          {topic.title}
                        </a>
                        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                          {topic.relatedQueries.map((q) => (
                            <span key={q} className="rounded bg-muted px-1.5 py-0.5">{q}</span>
                          ))}
                        </div>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground whitespace-nowrap">{topic.traffic}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mention.com 占位 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Mention.com 舆情监控</CardTitle>
              <Badge variant="warning">待接入</Badge>
            </div>
            <CardDescription>Mention.com 需要付费订阅，接入后可监控全网品牌提及</CardDescription>
          </CardHeader>
        </Card>

      </main>
    </>
  );
}
