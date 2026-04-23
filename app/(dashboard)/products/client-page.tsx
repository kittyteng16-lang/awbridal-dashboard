"use client";

import { useState, useMemo } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KPICard } from "@/components/dashboard/KPICard";
import { Sparkline } from "@/components/charts/Sparkline";
import { DateRangeSelector } from "@/components/common/DateRangeSelector";
import { AlertCircle, TrendingUp, CheckCircle, Info, AlertTriangle, Search, ArrowUpDown } from "lucide-react";
import type { ProductData, ProductPerformance } from "@/types/dashboard";

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

type SortColumn = "views" | "addToCarts" | "addToCartRate" | "checkouts" | "purchases" | "conversionRate" | "revenue";
type SortDirection = "asc" | "desc";

interface ProductsPageClientProps {
  initialData: ProductData;
  timeLabel: string;
}

export default function ProductsPageClient({ initialData, timeLabel }: ProductsPageClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortColumn, setSortColumn] = useState<SortColumn>("revenue");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [displayLimit, setDisplayLimit] = useState(100);

  // 筛选和排序
  const filteredAndSortedProducts = useMemo(() => {
    let products = initialData.topProducts;

    // 搜索过滤
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.sku.toLowerCase().includes(term) ||
          p.category?.toLowerCase().includes(term)
      );
    }

    // 排序
    products = [...products].sort((a, b) => {
      let aValue: number;
      let bValue: number;

      switch (sortColumn) {
        case "addToCartRate":
          aValue = parseFloat(a.addToCartRate);
          bValue = parseFloat(b.addToCartRate);
          break;
        case "conversionRate":
          aValue = parseFloat(a.conversionRate);
          bValue = parseFloat(b.conversionRate);
          break;
        default:
          aValue = a[sortColumn] as number;
          bValue = b[sortColumn] as number;
      }

      return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
    });

    return products;
  }, [initialData.topProducts, searchTerm, sortColumn, sortDirection]);

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("desc");
    }
  };

  const SortIcon = ({ column }: { column: SortColumn }) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="h-3 w-3 text-muted-foreground" />;
    }
    return sortDirection === "asc" ? <span>↑</span> : <span>↓</span>;
  };

  return (
    <>
      <Topbar title="产品分析" subtitle={`SKU 维度性能监控 · GA4 数据 · ${timeLabel}`} />
      <main className="flex-1 p-6 space-y-5">

        <div className="flex justify-end">
          <DateRangeSelector />
        </div>

        {/* KPI 指标卡 */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <KPICard label="产品浏览量" metric={initialData.kpi.views} icon="👁️" accent="purple" />
          <KPICard label="加入购物车" metric={initialData.kpi.addToCarts} icon="🛒" accent="blue" />
          <KPICard label="发起结账" metric={initialData.kpi.checkouts} icon="💳" accent="orange" />
          <KPICard label="完成购买" metric={initialData.kpi.purchases} icon="✅" accent="green" />
          <KPICard label="客单价" metric={initialData.kpi.avgOrderValue} icon="💰" accent="blue" />
        </div>

        {/* 智能洞察 */}
        {initialData.insights.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-1 w-1 rounded-full bg-primary" />
              <h2 className="text-lg font-semibold">智能诊断与优化建议</h2>
            </div>

            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {initialData.insights.map((insight, i) => {
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
        )}

        {/* SKU 明细表 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>SKU 明细</CardTitle>
                <CardDescription>按 SKU 维度展示产品性能数据</CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="搜索 SKU..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-9 w-64 rounded-md border border-input bg-background pl-10 pr-3 text-sm outline-none focus:border-primary"
                  />
                </div>
                <Badge variant="outline">{filteredAndSortedProducts.length} 个 SKU</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="px-4 py-3 text-left font-semibold">SKU</th>
                    <th className="px-4 py-3 text-center font-semibold">出单趋势</th>
                    <th
                      className="cursor-pointer px-4 py-3 text-right font-semibold hover:bg-muted/20"
                      onClick={() => handleSort("views")}
                    >
                      <div className="flex items-center justify-end gap-1">
                        浏览量 <SortIcon column="views" />
                      </div>
                    </th>
                    <th
                      className="cursor-pointer px-4 py-3 text-right font-semibold hover:bg-muted/20"
                      onClick={() => handleSort("addToCarts")}
                    >
                      <div className="flex items-center justify-end gap-1">
                        加购数 <SortIcon column="addToCarts" />
                      </div>
                    </th>
                    <th
                      className="cursor-pointer px-4 py-3 text-right font-semibold hover:bg-muted/20"
                      onClick={() => handleSort("addToCartRate")}
                    >
                      <div className="flex items-center justify-end gap-1">
                        加购率 <SortIcon column="addToCartRate" />
                      </div>
                    </th>
                    <th
                      className="cursor-pointer px-4 py-3 text-right font-semibold hover:bg-muted/20"
                      onClick={() => handleSort("checkouts")}
                    >
                      <div className="flex items-center justify-end gap-1">
                        发起结账 <SortIcon column="checkouts" />
                      </div>
                    </th>
                    <th
                      className="cursor-pointer px-4 py-3 text-right font-semibold hover:bg-muted/20"
                      onClick={() => handleSort("purchases")}
                    >
                      <div className="flex items-center justify-end gap-1">
                        购买数 <SortIcon column="purchases" />
                      </div>
                    </th>
                    <th
                      className="cursor-pointer px-4 py-3 text-right font-semibold hover:bg-muted/20"
                      onClick={() => handleSort("conversionRate")}
                    >
                      <div className="flex items-center justify-end gap-1">
                        转化率 <SortIcon column="conversionRate" />
                      </div>
                    </th>
                    <th
                      className="cursor-pointer px-4 py-3 text-right font-semibold hover:bg-muted/20"
                      onClick={() => handleSort("revenue")}
                    >
                      <div className="flex items-center justify-end gap-1">
                        收入 <SortIcon column="revenue" />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedProducts.slice(0, displayLimit).map((product, i) => (
                    <tr key={i} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-mono font-semibold text-primary">{product.sku}</div>
                        <div className="text-[10px] text-muted-foreground">{product.name}</div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Sparkline data={product.trend || []} width={80} height={24} color="#3B82F6" />
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">{product.views.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{product.addToCarts.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="font-semibold">{product.addToCartRate}</div>
                        <div className="text-[10px] text-emerald-600">{product.addToCartRateChange}</div>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">{product.checkouts.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="font-semibold">{product.purchases.toLocaleString()}</div>
                        <div className="text-[10px] text-emerald-600">{product.purchasesChange}</div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="font-semibold">{product.conversionRate}</div>
                        <div className="text-[10px] text-emerald-600">{product.conversionRateChange}</div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="font-semibold">${product.revenue.toLocaleString()}</div>
                        <div className="text-[10px] text-emerald-600">{product.revenueChange}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredAndSortedProducts.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                  <Search className="h-12 w-12 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">
                    {searchTerm ? `未找到匹配 "${searchTerm}" 的 SKU` : "暂无产品数据"}
                  </p>
                </div>
              )}
            </div>

            {/* 加载更多 / 数据统计 */}
            {filteredAndSortedProducts.length > 0 && (
              <div className="border-t p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    显示 {Math.min(displayLimit, filteredAndSortedProducts.length)} / {filteredAndSortedProducts.length} 个 SKU
                    {searchTerm && ` (从总计 ${initialData.topProducts.length} 个中筛选)`}
                  </div>
                  {displayLimit < filteredAndSortedProducts.length && (
                    <button
                      onClick={() => setDisplayLimit((prev) => prev + 100)}
                      className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
                    >
                      加载更多 100 条
                    </button>
                  )}
                  {displayLimit >= filteredAndSortedProducts.length && filteredAndSortedProducts.length > 100 && (
                    <button
                      onClick={() => setDisplayLimit(100)}
                      className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
                    >
                      收起显示
                    </button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

      </main>
    </>
  );
}
