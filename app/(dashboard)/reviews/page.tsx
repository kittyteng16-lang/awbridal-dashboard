import { Topbar } from "@/components/layout/Topbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ReviewsPage() {
  return (
    <>
      <Topbar title="用户评价" subtitle="多平台口碑监控" />
      <main className="flex-1 p-6 space-y-5">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>用户评价</CardTitle>
                <CardDescription className="mt-1">接入 App Store / Google Play / Trustpilot 评价 API</CardDescription>
              </div>
              <Badge variant="warning">待接入</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
              <span className="text-5xl">⭐</span>
              <div>
                <p className="font-semibold text-foreground">待接入评价平台</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  通过 Maton API Gateway 可接入以下平台的评价数据
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 max-w-xs w-full text-xs">
                {["App Store", "Google Play", "Trustpilot", "大众点评"].map((p) => (
                  <div key={p} className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
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
