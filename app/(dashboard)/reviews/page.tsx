import { Topbar } from "@/components/layout/Topbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fetchRedditMentions } from "@/lib/reddit";
import { fetchTrustpilotReviews } from "@/lib/trustpilot";
import type { RedditResult } from "@/lib/reddit";
import type { TrustpilotStats } from "@/lib/trustpilot";

async function getReviews(): Promise<RedditResult[]> {
  try {
    const results = await fetchRedditMentions('"aw bridal" OR "awbridal"', 20);
    return results;
  } catch {
    return [];
  }
}

async function getTrustpilot(): Promise<TrustpilotStats> {
  try {
    // 替换为您的 Trustpilot 业务单元名称
    // 通常是您的域名，如 "awbridal.com" 或 "www.awbridal.com"
    const stats = await fetchTrustpilotReviews("www.awbridal.com", 15);
    return stats;
  } catch {
    return {
      averageRating: 0,
      totalReviews: 0,
      reviews: [],
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    };
  }
}

const SENTIMENT_CONFIG = {
  positive: { label: "正面", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  neutral:  { label: "中性", className: "bg-slate-100 text-slate-600 border-slate-200" },
  negative: { label: "负面", className: "bg-red-100 text-red-600 border-red-200" },
};

export default async function ReviewsPage() {
  const [reviews, trustpilot] = await Promise.all([
    getReviews(),
    getTrustpilot(),
  ]);

  const positive = reviews.filter((r) => r.sentiment === "positive").length;
  const negative = reviews.filter((r) => r.sentiment === "negative").length;
  const neutral  = reviews.filter((r) => r.sentiment === "neutral").length;
  const total = reviews.length || 1;

  return (
    <>
      <Topbar title="用户评价" subtitle="多平台口碑监控 · Reddit 品牌提及" />
      <main className="flex-1 p-6 space-y-5">

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
                <CardTitle>Reddit 品牌提及</CardTitle>
                <CardDescription className="mt-1">近30天提及"aw bridal"的帖子</CardDescription>
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
                <p className="text-sm text-muted-foreground">暂无近期 Reddit 提及</p>
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

        {/* Trustpilot 评分统计 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Trustpilot 评分统计</CardTitle>
                <CardDescription className="mt-1">总评分及星级分布</CardDescription>
              </div>
              <div className="flex gap-2 items-center">
                <Badge variant="outline">Trustpilot</Badge>
                {trustpilot.totalReviews > 0 && (
                  <div className="flex items-center gap-1 text-lg font-semibold">
                    <span className="text-yellow-500">★</span>
                    <span>{trustpilot.averageRating.toFixed(1)}</span>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {trustpilot.totalReviews === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
                <span className="text-4xl">⚠️</span>
                <p className="text-sm text-muted-foreground">无法获取 Trustpilot 数据</p>
                <p className="text-xs text-muted-foreground">请确认业务单元名称是否正确（在代码中设置为 "www.awbridal.com"）</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* 星级分布 */}
                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = trustpilot.ratingDistribution[star as keyof typeof trustpilot.ratingDistribution];
                    const percentage = trustpilot.totalReviews > 0
                      ? Math.round((count / trustpilot.totalReviews) * 100)
                      : 0;
                    return (
                      <div key={star} className="flex items-center gap-3">
                        <div className="flex items-center gap-1 w-16 text-sm text-muted-foreground">
                          <span>{star}</span>
                          <span className="text-yellow-500">★</span>
                        </div>
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-yellow-400 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="w-16 text-right text-sm text-muted-foreground">
                          {count} ({percentage}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="pt-2 border-t text-sm text-muted-foreground">
                  共 {trustpilot.totalReviews} 条评价
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Trustpilot 最新评价 */}
        {trustpilot.reviews.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Trustpilot 最新评价</CardTitle>
                  <CardDescription className="mt-1">用户真实评价</CardDescription>
                </div>
                <Badge>{trustpilot.reviews.length} 条</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {trustpilot.reviews.map((review) => (
                  <div key={review.id} className="px-4 py-3 hover:bg-muted/30 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span
                                key={star}
                                className={star <= review.rating ? "text-yellow-500" : "text-gray-300"}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                          {review.verified && (
                            <Badge variant="outline" className="text-xs">✓ 已验证</Badge>
                          )}
                        </div>
                        {review.title && (
                          <h4 className="mt-1 text-sm font-medium text-foreground">
                            {review.title}
                          </h4>
                        )}
                        {review.text && (
                          <p className="mt-1 text-xs text-muted-foreground line-clamp-3">
                            {review.text}
                          </p>
                        )}
                        <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{review.author}</span>
                          <span>{review.date}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

      </main>
    </>
  );
}
