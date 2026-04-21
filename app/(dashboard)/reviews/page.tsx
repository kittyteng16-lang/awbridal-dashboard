import { Topbar } from "@/components/layout/Topbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fetchRedditMentions } from "@/lib/reddit";
import type { RedditResult } from "@/lib/reddit";

async function getReviews(): Promise<RedditResult[]> {
  try {
    const results = await fetchRedditMentions('"aw bridal" OR "awbridal"', 20);
    return results;
  } catch {
    return [];
  }
}

const SENTIMENT_CONFIG = {
  positive: { label: "正面", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  neutral:  { label: "中性", className: "bg-slate-100 text-slate-600 border-slate-200" },
  negative: { label: "负面", className: "bg-red-100 text-red-600 border-red-200" },
};

export default async function ReviewsPage() {
  const reviews = await getReviews();

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

        {/* Trustpilot 占位 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Trustpilot 评价</CardTitle>
              <Badge variant="warning">待接入</Badge>
            </div>
            <CardDescription>需要在 <a href="https://developers.trustpilot.com" target="_blank" className="text-primary underline">developers.trustpilot.com</a> 注册免费 API Key，添加到 Vercel 环境变量 <code className="bg-muted px-1 rounded">TRUSTPILOT_API_KEY</code></CardDescription>
          </CardHeader>
        </Card>

      </main>
    </>
  );
}
