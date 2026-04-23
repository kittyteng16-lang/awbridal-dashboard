import { Topbar } from "@/components/layout/Topbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DateRangeSelector } from "@/components/common/DateRangeSelector";
import { getRedditTimeParamByDays, resolveDateRange } from "@/lib/date-range";
import { fetchRedditMentions } from "@/lib/reddit";
import type { RedditResult } from "@/lib/reddit";

async function getReviews(timeParam: string): Promise<RedditResult[]> {
  try {
    const results = await fetchRedditMentions("", 50, timeParam);
    return results;
  } catch {
    return [];
  }
}

// 生成诊断性分析
function generateInsights(reviews: RedditResult[]) {
  if (reviews.length === 0) {
    return {
      summary: "暂无数据",
      insights: ["近期没有抓取到婚礼相关 Reddit 热帖"],
      sentiment: "neutral" as const
    };
  }

  const positive = reviews.filter((r) => r.sentiment === "positive").length;
  const negative = reviews.filter((r) => r.sentiment === "negative").length;
  const neutral = reviews.filter((r) => r.sentiment === "neutral").length;
  const total = reviews.length;

  const posRate = Math.round((positive / total) * 100);
  const negRate = Math.round((negative / total) * 100);

  // 计算平均互动
  const avgScore = Math.round(reviews.reduce((sum, r) => sum + r.score, 0) / total);
  const avgComments = Math.round(reviews.reduce((sum, r) => sum + r.comments, 0) / total);

  // 找出高互动帖子
  const highEngagement = reviews.filter(r => r.score > avgScore * 1.5 || r.comments > avgComments * 1.5);

  const insights: string[] = [];
  let overallSentiment: "positive" | "neutral" | "negative" = "neutral";

  // 情感分析
  if (posRate >= 60) {
    insights.push(`✅ 婚礼话题整体情绪积极，${posRate}% 的帖子为正面内容`);
    overallSentiment = "positive";
  } else if (posRate >= 40) {
    insights.push(`📊 婚礼话题情绪良好，${posRate}% 的帖子为正面内容`);
    overallSentiment = "neutral";
  } else if (negRate >= 40) {
    insights.push(`⚠️ 需要关注，${negRate}% 的帖子反馈负面情绪`);
    overallSentiment = "negative";
  } else {
    insights.push(`📊 婚礼话题以中性为主，正面帖子占 ${posRate}%`);
  }

  // 互动分析
  if (highEngagement.length >= 3) {
    insights.push(`🔥 发现 ${highEngagement.length} 条高互动帖子，平均获得 ${Math.round(highEngagement.reduce((sum, r) => sum + r.score, 0) / highEngagement.length)} 个赞`);
  }

  if (avgComments >= 10) {
    insights.push(`💬 用户参与度高，平均每条帖子有 ${avgComments} 条评论`);
  } else if (avgComments < 3) {
    insights.push(`💬 用户参与度较低，建议增加社区互动`);
  }

  // 负面预警
  if (negative >= 3) {
    const recentNegative = reviews.filter(r => r.sentiment === "negative").slice(0, 3);
    insights.push(`⚠️ 发现 ${negative} 条负面反馈，建议及时查看并回应`);
  }

  // 趋势建议
  if (posRate >= 70) {
    insights.push(`💡 建议：保持当前服务质量，可考虑邀请满意客户分享更多正面评价`);
  } else if (negRate >= 30) {
    insights.push(`💡 建议：重点关注负面反馈中的共性问题，优先改进服务体验`);
  }

  const summary = `共 ${total} 条婚礼热帖 · 正面 ${posRate}% · 负面 ${negRate}% · 平均互动 ${avgScore}⬆ ${avgComments}💬`;

  return { summary, insights, sentiment: overallSentiment };
}

const SENTIMENT_CONFIG = {
  positive: { label: "正面", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  neutral:  { label: "中性", className: "bg-slate-100 text-slate-600 border-slate-200" },
  negative: { label: "负面", className: "bg-red-100 text-red-600 border-red-200" },
};

export default async function ReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; start?: string; end?: string }>;
}) {
  const params = await searchParams;
  const resolved = resolveDateRange(params, "1y");
  const timeParam = getRedditTimeParamByDays(resolved.days);

  const reviews = await getReviews(timeParam);

  const positive = reviews.filter((r) => r.sentiment === "positive").length;
  const negative = reviews.filter((r) => r.sentiment === "negative").length;
  const neutral  = reviews.filter((r) => r.sentiment === "neutral").length;
  const total = reviews.length || 1;

  const analysis = generateInsights(reviews);

  return (
    <>
      <Topbar title="用户评价" subtitle={`多平台口碑监控 · Reddit · ${resolved.label}`} />
      <main className="flex-1 p-6 space-y-5">

        <div className="flex justify-end">
          <DateRangeSelector />
        </div>

        {/* 诊断性分析 */}
        <Card className={
          analysis.sentiment === "positive" ? "border-emerald-200 bg-emerald-50/30" :
          analysis.sentiment === "negative" ? "border-red-200 bg-red-50/30" :
          "border-blue-200 bg-blue-50/30"
        }>
          <CardHeader>
            <div className="flex items-center gap-2">
              <span className="text-2xl">
                {analysis.sentiment === "positive" ? "📈" : analysis.sentiment === "negative" ? "📉" : "📊"}
              </span>
              <div>
                <CardTitle>口碑诊断分析</CardTitle>
                <CardDescription className="mt-1">{analysis.summary}</CardDescription>
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

        {/* 情感汇总 */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "正面评价", count: positive, color: "text-emerald-600", bg: "bg-emerald-50", pct: Math.round(positive / total * 100) },
            { label: "中性提及", count: neutral,  color: "text-slate-600",   bg: "bg-slate-50",   pct: Math.round(neutral  / total * 100) },
            { label: "负面反馈", count: negative, color: "text-red-500",     bg: "bg-red-50",     pct: Math.round(negative / total * 100) },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="pt-5">
                <div className={`text-3xl font-bold ${s.color}`}>{s.count}</div>
                <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
                <div className="mt-3 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div className={`h-full rounded-full ${s.bg.replace("bg-", "bg-").replace("-50", "-400")}`} style={{ width: `${s.pct}%` }} />
                </div>
                <div className="text-xs text-muted-foreground mt-1">{s.pct}%</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Reddit 评价列表 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Reddit 婚礼热帖</CardTitle>
                <CardDescription className="mt-1">{resolved.label}来自 r/wedding、r/weddingplanning、r/prom 等的热门讨论</CardDescription>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline">Reddit</Badge>
                <Badge>{reviews.length} 条</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {reviews.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                <span className="text-4xl">🔍</span>
                <p className="text-sm text-muted-foreground">暂无婚礼相关热帖</p>
              </div>
            ) : (
              <div className="divide-y">
                {reviews.map((r, i) => {
                  const cfg = SENTIMENT_CONFIG[r.sentiment];
                  return (
                    <div key={i} className="px-4 py-3 hover:bg-muted/30 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <a href={r.url} target="_blank" rel="noopener noreferrer"
                            className="text-sm font-medium text-foreground hover:text-primary line-clamp-2 leading-snug">
                            {r.title}
                          </a>
                          {r.text && (
                            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{r.text}</p>
                          )}
                          <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
                            <span>r/{r.subreddit}</span>
                            <span>⬆ {r.score}</span>
                            <span>💬 {r.comments}</span>
                            <span>{r.date}</span>
                          </div>
                        </div>
                        <span className={`shrink-0 text-xs border rounded-full px-2 py-0.5 ${cfg.className}`}>
                          {cfg.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

      </main>
    </>
  );
}
