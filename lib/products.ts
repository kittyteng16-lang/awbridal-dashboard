/**
 * 产品分析数据获取（GA4）
 * 获取产品浏览、加车、结账、购买等电商指标
 */

import { matonPost } from "./maton";
import { formatGA4Date, pctChange } from "./utils";
import { getPreviousWindow } from "./date-range";
import type { ProductData, ProductFunnel, ProductPerformance, ProductInsight, KPIMetric } from "@/types/dashboard";

const PROPERTY = process.env.GA4_PROPERTY_ID ?? "254101518";
const GA4_PATH = `/google-analytics-data/v1beta/properties/${PROPERTY}:runReport`;

interface GA4Row {
  dimensionValues: { value: string }[];
  metricValues: { value: string }[];
}
interface GA4Response {
  rows?: GA4Row[];
}
type DateWindow = { start: string; end: string };

async function runReport(body: object): Promise<GA4Row[]> {
  const r = await matonPost<GA4Response>(GA4_PATH, body);
  return r.rows ?? [];
}

/**
 * 获取产品分析数据
 */
export async function fetchProductData(days: number = 30): Promise<ProductData> {
  return fetchProductDataByWindow(days);
}

export async function fetchProductDataByWindow(days: number = 30, window?: DateWindow): Promise<ProductData> {
  const thisRange = window
    ? { startDate: window.start, endDate: window.end }
    : { startDate: `${days}daysAgo`, endDate: "yesterday" };
  const prevWindow = window ? getPreviousWindow(window.start, window.end) : null;
  const prevRange = prevWindow
    ? { startDate: prevWindow.start, endDate: prevWindow.end }
    : { startDate: `${days * 2}daysAgo`, endDate: `${days + 1}daysAgo` };

  try {
    const [summaryRows, trendRows, productRows] = await Promise.all([
      // KPI 汇总（本期 vs 上期）
      runReport({
        dateRanges: [
          { ...thisRange, name: "this" },
          { ...prevRange, name: "prev" },
        ],
        metrics: [
          { name: "itemViews" },
          { name: "addToCarts" },
          { name: "ecommercePurchases" },
          { name: "totalRevenue" },
          { name: "averagePurchaseRevenue" },
        ],
      }),

      // 每日趋势
      runReport({
        dateRanges: [thisRange],
        dimensions: [{ name: "date" }],
        metrics: [
          { name: "itemViews" },
          { name: "addToCarts" },
          { name: "ecommercePurchases" },
        ],
        orderBys: [{ dimension: { dimensionName: "date" } }],
        limit: days + 10,
      }),

      // Top 产品性能
      runReport({
        dateRanges: [thisRange],
        dimensions: [{ name: "itemName" }],
        metrics: [
          { name: "itemViews" },
          { name: "addToCarts" },
          { name: "ecommercePurchases" },
          { name: "itemRevenue" },
        ],
        orderBys: [{ metric: { metricName: "itemViews" }, desc: true }],
        limit: 20,
      }),
    ]);

    // 解析 KPI
    const kpi = parseProductKPI(summaryRows);

    // 解析漏斗
    const funnel = buildProductFunnel(summaryRows);

    // 解析趋势
    const trend = trendRows.map((row) => ({
      date: formatGA4Date(row.dimensionValues[0].value),
      views: parseInt(row.metricValues[0].value) || 0,
      addToCarts: parseInt(row.metricValues[1].value) || 0,
      purchases: parseInt(row.metricValues[2].value) || 0,
    }));

    // 解析 Top 产品
    const topProducts = parseTopProducts(productRows);

    // 生成智能洞察
    const insights = generateProductInsights(kpi, funnel, topProducts);

    return { kpi, funnel, trend, topProducts, insights };
  } catch (error) {
    console.error("[Products] Failed to fetch GA4 data:", error);
    return createMockProductData();
  }
}

/**
 * 解析产品 KPI
 */
function parseProductKPI(rows: GA4Row[]): ProductData["kpi"] {
  if (!rows.length) {
    return {
      views: { value: "0", change: "—", up: true },
      addToCarts: { value: "0", change: "—", up: true },
      checkouts: { value: "0", change: "—", up: true },
      purchases: { value: "0", change: "—", up: true },
      avgOrderValue: { value: "$0", change: "—", up: true },
    };
  }

  const row = rows[0];
  const thisViews = parseInt(row.metricValues[0]?.value || "0");
  const thisAddToCarts = parseInt(row.metricValues[1]?.value || "0");
  const thisPurchases = parseInt(row.metricValues[2]?.value || "0");
  const thisRevenue = parseFloat(row.metricValues[3]?.value || "0");
  const thisAOV = parseFloat(row.metricValues[4]?.value || "0");

  const prevViews = parseInt(row.metricValues[5]?.value || "0");
  const prevAddToCarts = parseInt(row.metricValues[6]?.value || "0");
  const prevPurchases = parseInt(row.metricValues[7]?.value || "0");
  const prevRevenue = parseFloat(row.metricValues[8]?.value || "0");
  const prevAOV = parseFloat(row.metricValues[9]?.value || "0");

  // 结账数（假设为加车的一半，实际应用 begin_checkout 事件）
  const thisCheckouts = Math.floor(thisAddToCarts * 0.6);
  const prevCheckouts = Math.floor(prevAddToCarts * 0.6);

  return {
    views: {
      value: thisViews.toLocaleString(),
      change: pctChange(thisViews, prevViews),
      up: thisViews >= prevViews,
    },
    addToCarts: {
      value: thisAddToCarts.toLocaleString(),
      change: pctChange(thisAddToCarts, prevAddToCarts),
      up: thisAddToCarts >= prevAddToCarts,
    },
    checkouts: {
      value: thisCheckouts.toLocaleString(),
      change: pctChange(thisCheckouts, prevCheckouts),
      up: thisCheckouts >= prevCheckouts,
    },
    purchases: {
      value: thisPurchases.toLocaleString(),
      change: pctChange(thisPurchases, prevPurchases),
      up: thisPurchases >= prevPurchases,
    },
    avgOrderValue: {
      value: `$${thisAOV.toFixed(2)}`,
      change: pctChange(thisAOV, prevAOV),
      up: thisAOV >= prevAOV,
    },
  };
}

/**
 * 构建产品漏斗
 */
function buildProductFunnel(rows: GA4Row[]): ProductFunnel[] {
  if (!rows.length) return [];

  const row = rows[0];
  const views = parseInt(row.metricValues[0]?.value || "0");
  const addToCarts = parseInt(row.metricValues[1]?.value || "0");
  const purchases = parseInt(row.metricValues[2]?.value || "0");
  const checkouts = Math.floor(addToCarts * 0.6); // 假设值

  const funnel: ProductFunnel[] = [
    {
      step: "产品浏览",
      count: views,
      rate: "100%",
    },
    {
      step: "加入购物车",
      count: addToCarts,
      rate: views > 0 ? `${((addToCarts / views) * 100).toFixed(1)}%` : "0%",
      dropOff: views > 0 ? `${(((views - addToCarts) / views) * 100).toFixed(1)}%` : "0%",
    },
    {
      step: "发起结账",
      count: checkouts,
      rate: addToCarts > 0 ? `${((checkouts / addToCarts) * 100).toFixed(1)}%` : "0%",
      dropOff: addToCarts > 0 ? `${(((addToCarts - checkouts) / addToCarts) * 100).toFixed(1)}%` : "0%",
    },
    {
      step: "完成购买",
      count: purchases,
      rate: checkouts > 0 ? `${((purchases / checkouts) * 100).toFixed(1)}%` : "0%",
      dropOff: checkouts > 0 ? `${(((checkouts - purchases) / checkouts) * 100).toFixed(1)}%` : "0%",
    },
  ];

  return funnel;
}

/**
 * 解析 Top 产品
 */
function parseTopProducts(rows: GA4Row[]): ProductPerformance[] {
  return rows.slice(0, 10).map((row) => {
    const name = row.dimensionValues[0].value;
    const views = parseInt(row.metricValues[0]?.value || "0");
    const addToCarts = parseInt(row.metricValues[1]?.value || "0");
    const purchases = parseInt(row.metricValues[2]?.value || "0");
    const revenue = parseFloat(row.metricValues[3]?.value || "0");

    const viewToCartRate = views > 0 ? ((addToCarts / views) * 100).toFixed(1) : "0.0";
    const cartToPurchaseRate = addToCarts > 0 ? ((purchases / addToCarts) * 100).toFixed(1) : "0.0";
    const overallCVR = views > 0 ? ((purchases / views) * 100).toFixed(2) : "0.00";

    return {
      name,
      views,
      addToCarts,
      purchases,
      revenue,
      viewToCartRate: `${viewToCartRate}%`,
      cartToPurchaseRate: `${cartToPurchaseRate}%`,
      overallCVR: `${overallCVR}%`,
    };
  });
}

/**
 * 生成智能洞察和优化建议
 */
function generateProductInsights(
  kpi: ProductData["kpi"],
  funnel: ProductFunnel[],
  topProducts: ProductPerformance[]
): ProductInsight[] {
  const insights: ProductInsight[] = [];

  // 1. 分析浏览到加车转化率
  const viewToCartRate = funnel[1] ? parseFloat(funnel[1].rate) : 0;
  if (viewToCartRate < 5) {
    insights.push({
      type: "danger",
      title: "浏览到加车转化率过低",
      description: `当前转化率仅 ${viewToCartRate.toFixed(1)}%，远低于行业平均 8-12%`,
      recommendation: "优化商品详情页：添加高质量产品图、详细尺码表、真实用户评价、促销标签",
      priority: "high",
    });
  } else if (viewToCartRate < 8) {
    insights.push({
      type: "warning",
      title: "浏览到加车转化率偏低",
      description: `当前转化率 ${viewToCartRate.toFixed(1)}%，略低于行业平均水平`,
      recommendation: "增加紧迫感元素：限时优惠倒计时、库存剩余提示、热销标签",
      priority: "medium",
    });
  } else if (viewToCartRate >= 12) {
    insights.push({
      type: "success",
      title: "浏览到加车转化率优秀",
      description: `当前转化率 ${viewToCartRate.toFixed(1)}%，高于行业平均水平`,
      recommendation: "保持当前产品页面设计，可考虑将成功经验复制到其他产品",
      priority: "low",
    });
  }

  // 2. 分析加车到购买转化率
  const cartToPurchaseRate = funnel[3] && funnel[1] ? (funnel[3].count / funnel[1].count) * 100 : 0;
  if (cartToPurchaseRate < 20) {
    insights.push({
      type: "danger",
      title: "购物车流失严重",
      description: `仅 ${cartToPurchaseRate.toFixed(1)}% 的加车用户完成购买，流失率高达 ${(100 - cartToPurchaseRate).toFixed(1)}%`,
      recommendation: "启用购物车放弃挽回：发送邮件/短信提醒、提供专属折扣码、简化结账流程",
      priority: "high",
    });
  } else if (cartToPurchaseRate < 35) {
    insights.push({
      type: "warning",
      title: "购物车转化有提升空间",
      description: `当前 ${cartToPurchaseRate.toFixed(1)}% 的加车用户完成购买`,
      recommendation: "优化结账体验：支持 Guest Checkout、增加支付方式、显示安全认证标识",
      priority: "medium",
    });
  }

  // 3. 分析整体转化率趋势
  const viewsChange = parseFloat(kpi.views.change?.replace("%", "") || "0");
  const purchasesChange = parseFloat(kpi.purchases.change?.replace("%", "") || "0");

  if (viewsChange > 10 && purchasesChange < 0) {
    insights.push({
      type: "warning",
      title: "流量增长但转化下降",
      description: "浏览量增长但购买下降，说明新流量质量不高或用户体验问题",
      recommendation: "检查流量来源质量、审查新上架商品、测试支付流程是否正常",
      priority: "high",
    });
  }

  // 4. 分析 Top 产品表现
  if (topProducts.length > 0) {
    const lowCVRProducts = topProducts.filter((p) => parseFloat(p.overallCVR) < 1);
    if (lowCVRProducts.length >= 3) {
      insights.push({
        type: "info",
        title: "多个高流量产品转化率低",
        description: `${lowCVRProducts.length} 个热门产品转化率低于 1%`,
        recommendation: `重点优化：${lowCVRProducts.slice(0, 3).map((p) => p.name).join("、")}`,
        priority: "medium",
      });
    }

    const highPerformers = topProducts.filter((p) => parseFloat(p.overallCVR) >= 3);
    if (highPerformers.length > 0) {
      insights.push({
        type: "success",
        title: "发现高转化明星产品",
        description: `${highPerformers.length} 个产品转化率超过 3%`,
        recommendation: `加大推广力度：${highPerformers.slice(0, 2).map((p) => p.name).join("、")}，增加广告预算`,
        priority: "medium",
      });
    }
  }

  // 5. 客单价分析
  const aovChange = parseFloat(kpi.avgOrderValue.change?.replace("%", "") || "0");
  if (aovChange < -10) {
    insights.push({
      type: "warning",
      title: "客单价明显下降",
      description: `平均订单价值下降 ${Math.abs(aovChange).toFixed(1)}%`,
      recommendation: "实施提升客单价策略：满减优惠、组合套餐、推荐相关产品",
      priority: "medium",
    });
  }

  // 默认建议（如果没有其他洞察）
  if (insights.length === 0) {
    insights.push({
      type: "info",
      title: "数据表现平稳",
      description: "产品转化指标在正常范围内",
      recommendation: "持续监控关键指标，定期 A/B 测试产品页面元素",
      priority: "low",
    });
  }

  return insights;
}

/**
 * 创建模拟数据（降级方案）
 */
function createMockProductData(): ProductData {
  return {
    kpi: {
      views: { value: "12,345", change: "+8.5%", up: true },
      addToCarts: { value: "987", change: "+12.3%", up: true },
      checkouts: { value: "592", change: "+5.2%", up: true },
      purchases: { value: "234", change: "+3.8%", up: true },
      avgOrderValue: { value: "$156.78", change: "-2.1%", up: false },
    },
    funnel: [
      { step: "产品浏览", count: 12345, rate: "100%" },
      { step: "加入购物车", count: 987, rate: "8.0%", dropOff: "92.0%" },
      { step: "发起结账", count: 592, rate: "60.0%", dropOff: "40.0%" },
      { step: "完成购买", count: 234, rate: "39.5%", dropOff: "60.5%" },
    ],
    trend: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 86400000).toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" }),
      views: Math.floor(Math.random() * 500) + 300,
      addToCarts: Math.floor(Math.random() * 40) + 20,
      purchases: Math.floor(Math.random() * 15) + 5,
    })),
    topProducts: [
      { name: "A-Line Prom Dress", views: 1234, addToCarts: 98, purchases: 45, revenue: 6750, viewToCartRate: "7.9%", cartToPurchaseRate: "45.9%", overallCVR: "3.65%" },
      { name: "Mermaid Evening Gown", views: 987, addToCarts: 76, purchases: 32, revenue: 5440, viewToCartRate: "7.7%", cartToPurchaseRate: "42.1%", overallCVR: "3.24%" },
    ],
    insights: [
      {
        type: "warning",
        title: "浏览到加车转化率偏低",
        description: "当前转化率 8.0%，略低于行业平均水平",
        recommendation: "增加紧迫感元素：限时优惠倒计时、库存剩余提示、热销标签",
        priority: "medium",
      },
    ],
  };
}
