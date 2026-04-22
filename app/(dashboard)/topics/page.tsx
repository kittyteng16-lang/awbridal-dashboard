import { Topbar } from "@/components/layout/Topbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DateRangeSelector, getRedditTimeParam, getRangeLabel, type DateRange } from "@/components/common/DateRangeSelector";
import { fetchGoogleTrends, fetchRedditTrends } from "@/lib/trends";
import type { TrendingTopic } from "@/lib/trends";

async function getTopicsData(trendsTime: string, redditTime: string) {
  const [trendsData, redditTopics] = await Promise.allSettled([
    fetchGoogleTrends(["aw bridal", "wedding dress", "bridal gown", "wedding shop"], trendsTime),
    fetchRedditTrends("wedding dress bride", 10, redditTime),
  ]);

  return {
    trends: trendsData.status === "fulfilled" ? trendsData.value : [],
    reddit: redditTopics.status === "fulfilled" ? redditTopics.value : [] as TrendingTopic[],
  };
}

// 转换时间范围到 Google Trends 格式
function getTrendsTimeParam(range: DateRange): string {
  switch (range) {
    case "7d":
      return "now 7-d";
    case "30d":
      return "today 1-m";
    case "90d":
      return "today 3-m";
    case "1y":
      return "today 12-m";
    default:
      return "today 1-m";
  }
}

export default async function TopicsPage({
  searchParams,
}: {
  searchParams: { range?: string };
}) {
  const range = (searchParams.range as DateRange) || "30d";
  const rangeLabel = getRangeLabel(range);
  const trendsTime = getTrendsTimeParam(range);
  const redditTime = getRedditTimeParam(range);

  const { trends, reddit } = await getTopicsData(trendsTime, redditTime);

  const maxInterest = Math.max(...trends.map((t) => t.interest), 1);

  return (
    <>
      <Topbar title="热门话题" subtitle={`外部热点与品牌声量 · Google Trends + Reddit · ${rangeLabel}`} />
      <main className="flex-1 p-6 space-y-5">

        <div className="flex justify-end">
          <DateRangeSelector />
        </div>

        {/* Google Trends */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>关键词搜索热度</CardTitle>
                <CardDescription className="mt-1">近30天 Google Trends 搜索指数（0–100）</CardDescription>
              </div>
              <Badge variant="outline">Google Trends</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {trends.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
                <span className="text-4xl">📊</span>
                <p className="text-sm text-muted-foreground">Google Trends 数据暂时不可用</p>
              </div>
            ) : (
              <div className="space-y-4">
                {trends.map((t) => (
                  <div key={t.keyword} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{t.keyword}</span>
                      <span className="text-muted-foreground font-mono">{t.interest}</span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${(t.interest / maxInterest) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reddit 热门话题 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>婚纱行业 Reddit 热帖</CardTitle>
                <CardDescription className="mt-1">本周 wedding dress / bride 热门讨论</CardDescription>
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
                        <a href={topic.url} target="_blank" rel="noopener noreferrer"
                          className="text-sm font-medium text-foreground hover:text-primary line-clamp-2 leading-snug">
                          {topic.title}
                        </a>
                        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                          {topic.relatedQueries.map((q) => (
                            <span key={q} className="bg-muted rounded px-1.5 py-0.5">{q}</span>
                          ))}
                        </div>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">{topic.traffic}</span>
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
