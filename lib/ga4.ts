import { matonPost } from "./maton";
import { formatGA4Date, pctChange, formatDuration, CHANNEL_MAP } from "./utils";
import { getPreviousWindow } from "./date-range";
import type { TrafficData, OverviewData, ConversionData } from "@/types/dashboard";

const PROPERTY = process.env.GA4_PROPERTY_ID ?? "254101518";
const GA4_PATH = `/google-analytics-data/v1beta/properties/${PROPERTY}:runReport`;

interface GA4Row {
  dimensionValues: { value: string }[];
  metricValues: { value: string }[];
}
interface GA4Response { rows?: GA4Row[] }
type DateWindow = { start: string; end: string };
const AI_SOURCE_PATTERNS = ["perplexity", "claude", "chatgpt", "openai", "gemini", "copilot", "poe"];

async function runReport(body: object): Promise<GA4Row[]> {
  const r = await matonPost<GA4Response>(GA4_PATH, body);
  return r.rows ?? [];
}

// ── 流量数据 ──────────────────────────────────────────
export async function fetchTrafficData(days: number = 30): Promise<TrafficData> {
  return fetchTrafficDataByWindow(days);
}

export async function fetchTrafficDataByWindow(days: number = 30, window?: DateWindow): Promise<TrafficData> {
  const doubleDays = days * 2;
  const thisRange = window
    ? { startDate: window.start, endDate: window.end }
    : { startDate: `${days}daysAgo`, endDate: "yesterday" };
  const prevWindow = window ? getPreviousWindow(window.start, window.end) : null;

  const [dailyRows, summaryRows, sourceRows, pageRows] = await Promise.all([
    // 近N天每日趋势
    runReport({
      dateRanges: [thisRange],
      dimensions: [{ name: "date" }],
      metrics: [
        { name: "screenPageViews" }, { name: "totalUsers" },
        { name: "sessions" },        { name: "bounceRate" },
        { name: "averageSessionDuration" },
      ],
      orderBys: [{ dimension: { dimensionName: "date" } }],
      limit: days + 10,
    }),
    // 本期 vs 上期汇总
    runReport({
      dateRanges: [
        { ...thisRange, name: "this" },
        prevWindow
          ? { startDate: prevWindow.start, endDate: prevWindow.end, name: "last" }
          : { startDate: `${doubleDays}daysAgo`, endDate: `${days + 1}daysAgo`, name: "last" },
      ],
      metrics: [
        { name: "screenPageViews" }, { name: "totalUsers" },
        { name: "sessions" },        { name: "bounceRate" },
        { name: "averageSessionDuration" },
      ],
    }),
    // 流量来源
    runReport({
      dateRanges: [thisRange],
      dimensions: [{ name: "sessionDefaultChannelGroup" }],
      metrics: [{ name: "sessions" }],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit: 8,
    }),
    // Top 10 页面
    runReport({
      dateRanges: [thisRange],
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
export async function fetchConversionData(days: number = 30): Promise<ConversionData> {
  return fetchConversionDataByWindow(days);
}

export async function fetchConversionDataByWindow(days: number = 30, window?: DateWindow): Promise<ConversionData> {
  const FUNNEL_EVENTS = ["view_item", "add_to_cart", "begin_checkout", "checkout", "purchase"];
  const FUNNEL_LABELS = ["浏览商品", "加入购物车", "发起结账", "提交订单", "完成购买"];
  const doubleDays = days * 2;
  const thisRange = window
    ? { startDate: window.start, endDate: window.end }
    : { startDate: `${days}daysAgo`, endDate: "yesterday" };
  const prevWindow = window ? getPreviousWindow(window.start, window.end) : null;

  const [summaryRows, trendRows] = await Promise.all([
    // 本期 vs 上期 各转化事件汇总
    runReport({
      dateRanges: [
        { ...thisRange, name: "this" },
        prevWindow
          ? { startDate: prevWindow.start, endDate: prevWindow.end, name: "last" }
          : { startDate: `${doubleDays}daysAgo`, endDate: `${days + 1}daysAgo`, name: "last" },
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
    // 近N天每日 purchase / add_to_cart 趋势
    runReport({
      dateRanges: [thisRange],
      dimensions: [{ name: "date" }, { name: "eventName" }],
      metrics: [{ name: "eventCount" }],
      dimensionFilter: {
        filter: {
          fieldName: "eventName",
          inListFilter: { values: ["purchase", "add_to_cart"] },
        },
      },
      orderBys: [{ dimension: { dimensionName: "date" } }],
      limit: days * 10,
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
  return fetchOverviewHealthByWindow();
}

export async function fetchOverviewHealthByWindow(days: number = 30, window?: DateWindow): Promise<OverviewData["health"]> {
  const dateRange = window
    ? { startDate: window.start, endDate: window.end }
    : { startDate: `${days}daysAgo`, endDate: "yesterday" };
  const rows = await runReport({
    dateRanges: [dateRange],
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

export async function fetchSEOGA4SignalsByWindow(days: number = 30, window?: DateWindow): Promise<{
  indexing: {
    landingBounce: string;
    topLandingPages: { path: string; sessions: number; bounce: string }[];
  };
  backlinks: {
    newDomains: number;
    qualityRate: string;
    topReferrals: { domain: string; sessions: number; engagementRate: string }[];
  };
  geo: {
    aiMentions: number;
    aiShare: string;
    topAISources: { source: string; sessions: number }[];
    aiLandingPages: { path: string; sessions: number; source: string }[];
    aiReferrerKeywords: { keyword: string; source: string; count: number }[];
  };
}> {
  try {
    const doubleDays = days * 2;
    const thisRange = window
      ? { startDate: window.start, endDate: window.end }
      : { startDate: `${days}daysAgo`, endDate: "yesterday" };
    const prevWindow = window ? getPreviousWindow(window.start, window.end) : null;

    const [landingRows, referralRows, aiLandingRows, aiReferrerRows] = await Promise.all([
      runReport({
        dateRanges: [thisRange],
        dimensions: [{ name: "landingPagePlusQueryString" }],
        metrics: [{ name: "sessions" }, { name: "bounceRate" }],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
        limit: 10,
      }),
      runReport({
        dateRanges: [
          { ...thisRange, name: "this" },
          prevWindow
            ? { startDate: prevWindow.start, endDate: prevWindow.end, name: "last" }
            : { startDate: `${doubleDays}daysAgo`, endDate: `${days + 1}daysAgo`, name: "last" },
        ],
        dimensions: [{ name: "sessionSource" }],
        metrics: [{ name: "sessions" }, { name: "engagedSessions" }],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
        limit: 200,
      }),
      // AI 来源落地页（推断话题）
      runReport({
        dateRanges: [thisRange],
        dimensions: [{ name: "sessionSource" }, { name: "landingPage" }],
        metrics: [{ name: "sessions" }],
        dimensionFilter: {
          orGroup: {
            expressions: AI_SOURCE_PATTERNS.map((p) => ({
              filter: { fieldName: "sessionSource", stringFilter: { matchType: "CONTAINS", value: p } },
            })),
          },
        },
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
        limit: 30,
      }),
      // Perplexity pageReferrer 关键词提取
      runReport({
        dateRanges: [thisRange],
        dimensions: [{ name: "sessionSource" }, { name: "pageReferrer" }],
        metrics: [{ name: "sessions" }],
        dimensionFilter: {
          orGroup: {
            expressions: AI_SOURCE_PATTERNS.map((p) => ({
              filter: { fieldName: "sessionSource", stringFilter: { matchType: "CONTAINS", value: p } },
            })),
          },
        },
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
        limit: 50,
      }),
    ]);

    const topLandingPages = landingRows.map((row) => ({
      path: (row.dimensionValues[0]?.value || "/").slice(0, 70),
      sessions: +row.metricValues[0].value,
      bounce: `${(+row.metricValues[1].value * 100).toFixed(1)}%`,
    }));

    const landingBounceRaw = topLandingPages.length
      ? topLandingPages.reduce((sum, p) => sum + parseFloat(p.bounce), 0) / topLandingPages.length
      : 0;

    const byPeriod: Record<"this" | "last", Record<string, { sessions: number; engaged: number }>> = {
      this: {},
      last: {},
    };

    for (const row of referralRows) {
      const source = (row.dimensionValues[0]?.value || "(direct)").toLowerCase();
      const periodRaw = row.dimensionValues[row.dimensionValues.length - 1]?.value;
      const period: "this" | "last" = periodRaw === "last" ? "last" : "this";
      const sessions = +row.metricValues[0].value;
      const engaged = +row.metricValues[1].value;
      if (!source || source === "(not set)" || source === "(direct)") continue;
      if (!byPeriod[period][source]) byPeriod[period][source] = { sessions: 0, engaged: 0 };
      byPeriod[period][source].sessions += sessions;
      byPeriod[period][source].engaged += engaged;
    }

    const currentSources = Object.keys(byPeriod.this);
    const lastSourceSet = new Set(Object.keys(byPeriod.last));
    const newDomains = currentSources.filter((s) => !lastSourceSet.has(s)).length;

    const allReferrals = Object.entries(byPeriod.this)
      .map(([domain, v]) => ({
        domain,
        sessions: v.sessions,
        engagementRate: `${v.sessions ? ((v.engaged / v.sessions) * 100).toFixed(1) : "0.0"}%`,
      }))
      .sort((a, b) => b.sessions - a.sessions);

    const topReferrals = allReferrals.slice(0, 8);

    const totalReferralSessions = allReferrals.reduce((sum, r) => sum + r.sessions, 0);
    const totalEngaged = allReferrals.reduce(
      (sum, r) => sum + (parseFloat(r.engagementRate) / 100) * r.sessions,
      0
    );
    const qualityRate = `${totalReferralSessions ? ((totalEngaged / totalReferralSessions) * 100).toFixed(1) : "0.0"}%`;

    // AI sources filtered from all referrals (not just top 8)
    const aiSources = allReferrals
      .filter((r) => AI_SOURCE_PATTERNS.some((p) => r.domain.includes(p)))
      .sort((a, b) => b.sessions - a.sessions);
    const aiMentions = aiSources.reduce((sum, r) => sum + r.sessions, 0);
    const aiShare = `${totalReferralSessions ? ((aiMentions / totalReferralSessions) * 100).toFixed(1) : "0.0"}%`;

    // AI 落地页
    const aiLandingPages = aiLandingRows.map((row) => ({
      source: row.dimensionValues[0]?.value || "",
      path: (row.dimensionValues[1]?.value || "/").split("?")[0].slice(0, 80),
      sessions: +row.metricValues[0].value,
    })).filter((r) => r.sessions > 0);

    // 从 pageReferrer URL 提取关键词（Perplexity/ChatGPT 有时带 ?q= 或 /search/）
    const aiReferrerKeywords: { keyword: string; source: string; count: number }[] = [];
    for (const row of aiReferrerRows) {
      const source = row.dimensionValues[0]?.value || "";
      const referrer = row.dimensionValues[1]?.value || "";
      const count = +row.metricValues[0].value;
      if (!referrer || referrer === "(not set)") continue;
      // 提取 ?q=、?query=、/search/ 后的词
      const qMatch = referrer.match(/[?&](?:q|query|search)=([^&]+)/i);
      const pathMatch = referrer.match(/\/search\/([^/?#]+)/i);
      const raw = qMatch?.[1] || pathMatch?.[1];
      if (raw) {
        try {
          const keyword = decodeURIComponent(raw.replace(/\+/g, " ")).trim().slice(0, 100);
          if (keyword) aiReferrerKeywords.push({ keyword, source, count });
        } catch { /* ignore malformed */ }
      }
    }

    return {
      indexing: {
        landingBounce: `${landingBounceRaw.toFixed(1)}%`,
        topLandingPages,
      },
      backlinks: {
        newDomains,
        qualityRate,
        topReferrals,
      },
      geo: {
        aiMentions,
        aiShare,
        topAISources: aiSources.map((s) => ({ source: s.domain, sessions: s.sessions })),
        aiLandingPages,
        aiReferrerKeywords,
      },
    };
  } catch {
    return {
      indexing: { landingBounce: "—", topLandingPages: [] },
      backlinks: { newDomains: 0, qualityRate: "0.0%", topReferrals: [] },
      geo: { aiMentions: 0, aiShare: "0.0%", topAISources: [], aiLandingPages: [], aiReferrerKeywords: [] },
    };
  }
}
