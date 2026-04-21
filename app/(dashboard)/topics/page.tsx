import { Topbar } from "@/components/layout/Topbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function TopicsPage() {
  return (
    <>
      <Topbar title="热门话题" subtitle="外部热点与品牌声量" />
      <main className="flex-1 p-6 space-y-5">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>热门话题</CardTitle>
                <CardDescription className="mt-1">接入微博热搜 / Brand24 / Mention 等舆情 API</CardDescription>
              </div>
              <Badge variant="warning">待接入</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
              <span className="text-5xl">🔥</span>
              <div>
                <p className="font-semibold text-foreground">待接入舆情监控平台</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  推荐接入以下平台追踪品牌话题与行业趋势
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 max-w-xs w-full text-xs">
                {["微博热搜 API", "Brand24", "Mention.com", "Google Trends"].map((p) => (
                  <div key={p} className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                    {p}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
