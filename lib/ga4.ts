import { matonPost } from "./maton";
import { formatGA4Date, pctChange, formatDuration, CHANNEL_MAP } from "./utils";
import type { TrafficData, OverviewData } from "@/types/dashboard";

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
