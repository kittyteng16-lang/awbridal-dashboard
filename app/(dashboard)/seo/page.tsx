import { Topbar } from "@/components/layout/Topbar";
import { KPICard } from "@/components/dashboard/KPICard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AreaLineChart } from "@/components/charts/AreaLineChart";
import { Badge } from "@/components/ui/badge";
import type { SEOData } from "@/types/dashboard";

async function getSEO(): Promise<SEOData | null> {
  try {
    const base = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000";
    const res = await fetch(`${base}/api/dashboard/seo`, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

export default async function SEOPage() {
  const data = await getSEO();

  return (
    <>
      <Topbar title="SEO 监控" subtitle="关键词排名 · 搜索流量 · Google Search Console" />
      <main className="flex-1 p-6 space-y-5">

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KPICard label="自然搜索点击" metric={data?.kpi.clicks      ?? { value:"—", change:"—", up:true }} icon="🖱️" accent="purple" />
          <KPICard label="搜索展现量"   metric={data?.kpi.impressions ?? { value:"—", change:"—", up:true }} icon="👁️" accent="blue"   />
          <KPICard label="点击率 CTR"   metric={data?.kpi.ctr         ?? { value:"—", change:"—", up:true }} icon="📊" accent="green"  />
          <KPICard label="平均排名"     metric={data?.kpi.position    ?? { value:"—", change:"—", up:true }} icon="🏆" accent="orange" />
        </div>

        {/* 搜索趋势 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>自然搜索趋势（近30天）</CardTitle>
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

        {/* 关键词排名表 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Top 关键词排名</CardTitle>
              <Badge variant="outline">近30天点击量排序</Badge>
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
