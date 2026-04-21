import { Topbar } from "@/components/layout/Topbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ConversionPage() {
  return (
    <>
      <Topbar title="转化分析" subtitle="转化漏斗与渠道效果" />
      <main className="flex-1 p-6 space-y-5">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>转化分析</CardTitle>
                <CardDescription className="mt-1">需在 GA4 中配置转化事件后自动接入</CardDescription>
              </div>
              <Badge variant="warning">待配置</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
              <span className="text-5xl">🎯</span>
              <div>
                <p className="font-semibold text-foreground">需要在 GA4 中配置转化事件</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  前往 GA4 管理 → 转化 → 标记关键事件（如 purchase、add_to_cart）<br />
                  配置后，转化数据将自动出现在此处。
                </p>
              </div>
              <div className="mt-2 rounded-lg border bg-muted/40 p-4 text-left text-xs font-mono text-muted-foreground max-w-sm w-full">
                <p className="font-semibold text-foreground mb-1">推荐配置的转化事件：</p>
                <p>• purchase（购买完成）</p>
                <p>• add_to_cart（加入购物车）</p>
                <p>• begin_checkout（发起结账）</p>
                <p>• sign_up（用户注册）</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
