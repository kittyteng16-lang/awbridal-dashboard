import { matonPost } from "./maton";
import { formatGA4Date, pctChange, formatDuration, CHANNEL_MAP } from "./utils";
import type { TrafficData, OverviewData, ConversionData } from "@/types/dashboard";

const PROPERTY = process.env.GA4_PROPERTY_ID ?? "254101518";
const GA4_PATH = `/google-analytics-data/v1beta/properties/${PROPERTY}:runReport`;

interface GA4Row {
  dimensionValues: { value: string }[];
  metricValues: { value: string }[];
}
interface GA4Response { rows?: GA4Row[] }

async function runReport(body: object): Promise<GA4Row[]> {
  const r = await matonPost<GA4Response>(GA4_PATH, body);
  return r.rows ?? [];
}

// ── 流量数据 ──────────────────────────────────────────
export async function fetchTrafficData(): Promise<TrafficData> {
  const [dailyRows, summaryRows, sourceRows, pageRows] = await Promise.all([
    // 近30天每日趋势
    runReport({
      dateRanges: [{ startDate: "30daysAgo", endDate: "yesterday" }],
      dimensions: [{ name: "date" }],
      metrics: [
        { name: "screenPageViews" }, { name: "totalUsers" },
        { name: "sessions" },        { name: "bounceRate" },
        { name: "averageSessionDuration" },
      ],
      orderBys: [{ dimension: { dimensionName: "date" } }],
      limit: 30,
    }),
    // 本月 vs 上月汇总
    runReport({
      dateRanges: [
        { startDate: "30daysAgo", endDate: "yesterday", name: "this" },
        { startDate: "60daysAgo", endDate: "31daysAgo", name: "last" },
      ],
      metrics: [
        { name: "screenPageViews" }, { name: "totalUsers" },
        { name: "sessions" },        { name: "bounceRate" },
        { name: "averageSessionDuration" },
      ],
    }),
    // 流量来源
    runReport({
      dateRanges: [{ startDate: "30daysAgo", endDate: "yesterday" }],
      dimensions: [{ name: "sessionDefaultChannelGroup" }],
      metrics: [{ name: "sessions" }],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit: 8,
    }),
    // Top 10 页面
    runReport({
      dateRanges: [{ startDate: "30daysAgo", endDate: "yesterday" }],
      dimensions: [{ name: "pagePath" }],
      metrics: [
        { name: "screenPageViews" }, { name: "totalUsers" }, { name: "bounceRate" },
      ],
      orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
      limit: 10,
    }),
  ]);

  // 本月/上月映射
  const summary: Record<string, string[]> = {};
  for (const row of summaryRows) {
    summary[row.dimensionValues[0].value] = row.metricValues.map((m) => m.value);
  }
  const th = summary["this"] ?? Array(5).fill("0");
  const la = summary["last"] ?? Array(5).fill("1");

  return {
    kpi: {
      pv:       { value: Number(th[0]).toLocaleString(), change: pctChange(+th[0], +la[0]), up: +th[0] >= +la[0] },
      uv:       { value: Number(th[1]).toLocaleString(), change: pctChange(+th[1], +la[1]), up: +th[1] >= +la[1] },
      bounce:   { value: `${(+th[3] * 100).toFixed(1)}%`, change: pctChange(+th[3], +la[3]), up: +th[3] <= +la[3] },
      duration: { value: formatDuration(+th[4]), change: pctChange(+th[4], +la[4]), up: +th[4] >= +la[4] },
    },
    trend: dailyRows.map((row) => ({
      date:     formatGA4Date(row.dimensionValues[0].value),
      pv:       +row.metricValues[0].value,
      uv:       +row.metricValues[1].value,
      sessions: +row.metricValues[2].value,
    })),
    sources: sourceRows.map((row) => ({
      name:  CHANNEL_MAP[row.dimensionValues[0].value] ?? row.dimensionValues[0].value,
      value: +row.metricValues[0].value,
    })),
    topPages: pageRows.map((row) => ({
      path:   row.dimensionValues[0].value.slice(0, 60),
      pv:     +row.metricValues[0].value,
      uv:     +row.metricValues[1].value,
      bounce: `${(+row.metricValues[2].value * 100).toFixed(1)}%`,
    })),
  };
}

// ── 转化漏斗数据 ──────────────────────────────────────
export async function fetchConversionData(): Promise<ConversionData> {
  const FUNNEL_EVENTS = ["view_item", "add_to_cart", "begin_checkout", "checkout", "purchase"];
  const FUNNEL_LABELS = ["浏览商品", "加入购物车", "发起结账", "提交订单", "完成购买"];

  const [summaryRows, trendRows] = await Promise.all([
    // 本期 vs 上期 各转化事件汇总
    runReport({
      dateRanges: [
        { startDate: "30daysAgo", endDate: "yesterday", name: "this" },
        { startDate: "60daysAgo", endDate: "31daysAgo", name: "last" },
      ],
      dimensions: [{ name: "eventName" }],
      metrics: [{ name: "eventCount" }],
      dimensionFilter: {
        filter: {
          fieldName: "isKeyEvent",
          stringFilter: { value: "true" },
        },
      },
    }),
    // 近30天每日 purchase / add_to_cart 趋势
    runReport({
      dateRanges: [{ startDate: "30daysAgo", endDate: "yesterday" }],
      dimensions: [{ name: "date" }, { name: "eventName" }],
      metrics: [{ name: "eventCount" }],
      dimensionFilter: {
        filter: {
          fieldName: "eventName",
          inListFilter: { values: ["purchase", "add_to_cart"] },
        },
      },
      orderBys: [{ dimension: { dimensionName: "date" } }],
      limit: 200,
    }),
  ]);

  // 汇总本期/上期数据
  const thisMap: Record<string, number> = {};
  const lastMap: Record<string, number> = {};
  for (const row of summaryRows) {
    const event = row.dimensionValues[0].value;
    const period = row.dimensionValues[1]?.value ?? "this";
    const count = +row.metricValues[0].value;
    if (period === "this") thisMap[event] = (thisMap[event] ?? 0) + count;
    else lastMap[event] = (lastMap[event] ?? 0) + count;
  }

  // 漏斗步骤
  const funnelCounts = FUNNEL_EVENTS.map((e) => thisMap[e] ?? 0);
  const topCount = funnelCounts[0] || 1;
  const funnel = FUNNEL_LABELS.map((step, i) => ({
    step,
    count: funnelCounts[i],
    rate: `${((funnelCounts[i] / topCount) * 100).toFixed(1)}%`,
  }));

  // 趋势（按日期聚合）
  const trendMap: Record<string, { purchase: number; add_to_cart: number }> = {};
  for (const row of trendRows) {
    const date = formatGA4Date(row.dimensionValues[0].value);
    const event = row.dimensionValues[1].value;
    const count = +row.metricValues[0].value;
    if (!trendMap[date]) trendMap[date] = { purchase: 0, add_to_cart: 0 };
    if (event === "purchase") trendMap[date].purchase += count;
    if (event === "add_to_cart") trendMap[date].add_to_cart += count;
  }
  const trend = Object.entries(trendMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date, ...v }));

  const thisPurchase = thisMap["purchase"] ?? 0;
  const lastPurchase = lastMap["purchase"] ?? 0;
  const thisCart = thisMap["add_to_cart"] ?? 0;
  const lastCart = lastMap["add_to_cart"] ?? 0;
  const thisCheckout = thisMap["begin_checkout"] ?? 0;
  const lastCheckout = lastMap["begin_checkout"] ?? 0;
  const thisViews = thisMap["view_item"] ?? 1;
  const lastViews = lastMap["view_item"] ?? 1;
  const thisCvr = (thisPurchase / thisViews) * 100;
  const lastCvr = (lastPurchase / lastViews) * 100;

  return {
    kpi: {
      purchases:  { value: thisPurchase.toLocaleString(),  change: pctChange(thisPurchase, lastPurchase),   up: thisPurchase >= lastPurchase },
      checkouts:  { value: thisCheckout.toLocaleString(),  change: pctChange(thisCheckout, lastCheckout),   up: thisCheckout >= lastCheckout },
      addToCarts: { value: thisCart.toLocaleString(),       change: pctChange(thisCart, lastCart),           up: thisCart >= lastCart },
      cvr:        { value: `${thisCvr.toFixed(2)}%`,        change: pctChange(thisCvr, lastCvr),             up: thisCvr >= lastCvr },
    },
    funnel,
    trend,
  };
}

// ── 总览健康度雷达数据 ────────────────────────────────
export async function fetchOverviewHealth(): Promise<OverviewData["health"]> {
  const rows = await runReport({
    dateRanges: [{ startDate: "30daysAgo", endDate: "yesterday" }],
    metrics: [
      { name: "screenPageViews" }, { name: "totalUsers" },
      { name: "bounceRate" },      { name: "averageSessionDuration" },
      { name: "sessions" },
    ],
  });
  if (!rows.length) return [];
  const [pv, uv, bounce, duration, sessions] = rows[0].metricValues.map((m) => +m.value);
  return [
    { subject: "流量规模",  score: Math.min(100, Math.round(pv / 50000)) },
    { subject: "用户数量",  score: Math.min(100, Math.round(uv / 15000)) },
    { subject: "内容深度",  score: Math.round((1 - bounce) * 100) },
    { subject: "访问时长",  score: Math.min(100, Math.round(duration / 3)) },
    { subject: "互动频次",  score: Math.min(100, Math.round(sessions / 20000)) },
    { subject: "粘性",      score: Math.round(Math.min(100, (uv / (sessions || 1)) * 80)) },
  ];
}
