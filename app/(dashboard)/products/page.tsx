import { Topbar } from "@/components/layout/Topbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KPICard } from "@/components/dashboard/KPICard";
import { AreaLineChart } from "@/components/charts/AreaLineChart";
import { DateRangeSelector } from "@/components/common/DateRangeSelector";
import { resolveDateRange } from "@/lib/date-range";
import { fetchProductDataByWindow } from "@/lib/products";
import { AlertCircle, TrendingUp, CheckCircle, Info, AlertTriangle } from "lucide-react";

const INSIGHT_ICONS = {
  success: CheckCircle,
  warning: AlertTriangle,
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

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; start?: string; end?: string }>;
}) {
  const params = await searchParams;
  const resolved = resolveDateRange(params, "30d");

  const data = await fetchProductDataByWindow(
    resolved.days,
    resolved.start && resolved.end ? { start: resolved.start, end: resolved.end } : undefined
  );

  // 计算整体转化率
  const overallCVR = data.funnel[3] && data.funnel[0]
    ? ((data.funnel[3].count / data.funnel[0].count) * 100).toFixed(2)
    : "0.00";

  return (
    <>
      <Topbar title="产品分析" subtitle={`电商漏斗 · 转化优化 · GA4 数据 · ${resolved.label}`} />
      <main className="flex-1 p-6 space-y-5">

        <div className="flex justify-end">
          <DateRangeSelector />
        </div>

        {/* KPI 指标卡 */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <KPICard label="产品浏览量" metric={data.kpi.views} icon="👁️" accent="purple" />
          <KPICard label="加入购物车" metric={data.kpi.addToCarts} icon="🛒" accent="blue" />
          <KPICard label="发起结账" metric={data.kpi.checkouts} icon="💳" accent="orange" />
          <KPICard label="完成购买" metric={data.kpi.purchases} icon="✅" accent="green" />
          <KPICard label="客单价" metric={data.kpi.avgOrderValue} icon="💰" accent="blue" />
        </div>

        {/* 整体转化率 */}
        <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50/50 to-purple-50/30">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-muted-foreground">整体转化率（浏览→购买）</div>
                <div className="mt-1 text-4xl font-bold text-indigo-600">{overallCVR}%</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  行业基准：1.5% - 3.0%（礼服类）
                </div>
              </div>
              <TrendingUp className="h-12 w-12 text-indigo-400" />
            </div>
          </CardContent>
        </Card>

        {/* 智能洞察 */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-1 w-1 rounded-full bg-primary" />
            <h2 className="text-lg font-semibold">智能诊断与优化建议</h2>
          </div>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {data.insights.map((insight, i) => {
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
                          <div className="font-medium text-foreground">💡 优化建议</div>
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

        {/* 转化漏斗 */}
        <Card>
          <CardHeader>
            <CardTitle>产品转化漏斗</CardTitle>
            <CardDescription>从浏览到购买的用户行为路径分析</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.funnel.map((step, i) => {
                const isLast = i === data.funnel.length - 1;
                const dropOffRate = parseFloat(step.dropOff || "0");
                const needsAttention = dropOffRate > 60;

                return (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                          {i + 1}
                        </div>
                        <div>
                          <div className="font-medium">{step.step}</div>
                          <div className="text-xs text-muted-foreground">
                            {step.count.toLocaleString()} 人次
                            {step.dropOff && (
                              <span className={needsAttention ? "text-red-600" : ""}>
                                {" "}· 流失 {step.dropOff}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">{step.rate}</div>
                        <div className="text-xs text-muted-foreground">转化率</div>
                      </div>
                    </div>

                    {/* 进度条 */}
                    <div className="relative">
                      <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full transition-all ${
                            parseFloat(step.rate) >= 50
                              ? "bg-emerald-500"
                              : parseFloat(step.rate) >= 20
                              ? "bg-amber-500"
                              : "bg-red-500"
                          }`}
                          style={{ width: step.rate }}
                        />
                      </div>
                    </div>

                    {!isLast && needsAttention && (
                      <div className="flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
                        <AlertCircle className="h-3 w-3" />
                        <span>该环节流失严重，建议优先优化</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* 趋势图 */}
        <Card>
          <CardHeader>
            <CardTitle>每日转化趋势</CardTitle>
            <CardDescription>{resolved.label}浏览量、加车数、购买数变化</CardDescription>
          </CardHeader>
          <CardContent>
            {data.trend.length > 0 ? (
              <AreaLineChart
                data={data.trend}
                series={[
                  { key: "purchases", label: "购买数", color: "#10B981" },
                  { key: "addToCarts", label: "加车数", color: "#F59E0B" },
                ]}
                yAxisRight={[{ key: "views", label: "浏览量", color: "#6366F1", type: "line" }]}
              />
            ) : (
              <div className="flex h-60 items-center justify-center text-sm text-muted-foreground">
                加载中...
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top 产品性能 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>产品性能排行</CardTitle>
                <CardDescription>按浏览量排序的 Top 产品转化表现</CardDescription>
              </div>
              <Badge variant="outline">{data.topProducts.length} 个产品</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="px-4 py-2.5 text-left font-semibold">#</th>
                    <th className="px-4 py-2.5 text-left font-semibold">产品名称</th>
                    <th className="px-4 py-2.5 text-right font-semibold">浏览</th>
                    <th className="px-4 py-2.5 text-right font-semibold">加车</th>
                    <th className="px-4 py-2.5 text-right font-semibold">购买</th>
                    <th className="px-4 py-2.5 text-right font-semibold">收入</th>
                    <th className="px-4 py-2.5 text-right font-semibold">浏览→加车</th>
                    <th className="px-4 py-2.5 text-right font-semibold">加车→购买</th>
                    <th className="px-4 py-2.5 text-right font-semibold">整体CVR</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topProducts.map((product, i) => {
                    const cvr = parseFloat(product.overallCVR);
                    const cvrBadge = cvr >= 3 ? "bg-emerald-100 text-emerald-700" : cvr >= 1.5 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700";

                    return (
                      <tr key={i} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-2.5 text-muted-foreground">{i + 1}</td>
                        <td className="px-4 py-2.5 font-medium">{product.name}</td>
                        <td className="px-4 py-2.5 text-right">{product.views.toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-right">{product.addToCarts.toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-right font-medium">{product.purchases.toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-right">${product.revenue.toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-right">{product.viewToCartRate}</td>
                        <td className="px-4 py-2.5 text-right">{product.cartToPurchaseRate}</td>
                        <td className="px-4 py-2.5 text-right">
                          <span className={`inline-block rounded px-2 py-0.5 font-semibold ${cvrBadge}`}>
                            {product.overallCVR}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* 优化检查清单 */}
        <Card className="border-blue-200 bg-blue-50/30">
          <CardContent className="pt-5">
            <div className="flex items-start gap-3">
              <span className="text-2xl">📋</span>
              <div className="space-y-3 text-sm">
                <div className="font-semibold">产品转化优化检查清单</div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded" />
                    <span>✅ 商品详情页是否有高质量产品图（至少 5 张不同角度）</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded" />
                    <span>✅ 是否提供详细的尺码表和测量指南</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded" />
                    <span>✅ 是否显示真实用户评价和照片</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded" />
                    <span>✅ 是否有明确的促销信息和优惠券</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded" />
                    <span>✅ 结账流程是否支持 Guest Checkout</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded" />
                    <span>✅ 是否启用购物车放弃挽回邮件</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded" />
                    <span>✅ 是否提供多种支付方式（信用卡、PayPal、分期付款）</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded" />
                    <span>✅ 是否有相关产品推荐和交叉销售</span>
                  </label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

      </main>
    </>
  );
}
