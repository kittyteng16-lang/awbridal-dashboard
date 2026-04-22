import { matonPost } from "./maton";
import { pctChange } from "./utils";
import type { SEOData } from "@/types/dashboard";
import { subDays, format } from "date-fns";
import { getPreviousWindow } from "./date-range";

const SITE = process.env.GSC_SITE_URL ?? "sc-domain:awbridal.com";
const GSC_PATH = `/google-search-console/webmasters/v3/sites/${encodeURIComponent(SITE)}/searchAnalytics/query`;

interface GSCRow {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}
interface GSCResponse { rows?: GSCRow[] }
type DateWindow = { start: string; end: string };
const BRAND_TERMS = (process.env.BRAND_TERMS || "aw bridal,awbridal")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

function isBrandQuery(query: string): boolean {
  const q = query.toLowerCase();
  return BRAND_TERMS.some((term) => q.includes(term));
}

async function queryGSC(body: object): Promise<GSCRow[]> {
  const r = await matonPost<GSCResponse>(GSC_PATH, body);
  return r.rows ?? [];
}

function gscDate(daysAgo: number): string {
  return format(subDays(new Date(), daysAgo), "yyyy-MM-dd");
}

export async function fetchSEOData(days: number = 30): Promise<SEOData> {
  return fetchSEODataByWindow(days);
}

export async function fetchSEODataByWindow(days: number = 30, window?: DateWindow): Promise<SEOData> {
  const startDaysAgo = days + 1; // GSC 有2天延迟
  const doubleDays = days * 2;
  const currentStart = window?.start ?? gscDate(startDaysAgo);
  const currentEnd = window?.end ?? gscDate(2);
  const prevWindow = window ? getPreviousWindow(window.start, window.end) : null;
  const prevStart = prevWindow?.start ?? gscDate(doubleDays + 1);
  const prevEnd = prevWindow?.end ?? gscDate(days + 2);

  const [dailyRows, thisRows, lastRows, keywordRows, queryRows, lastQueryRows, pageRows] = await Promise.all([
    // 近N天每日趋势（GSC 有2天延迟）
    queryGSC({
      startDate: currentStart, endDate: currentEnd,
      dimensions: ["date"], rowLimit: days + 10,
    }),
    // 本期汇总
    queryGSC({ startDate: currentStart, endDate: currentEnd, dimensions: [] }),
    // 上期汇总
    queryGSC({ startDate: prevStart, endDate: prevEnd, dimensions: [] }),
    // Top 关键词
    queryGSC({
      startDate: currentStart, endDate: currentEnd,
      dimensions: ["query"],
      orderBy: [{ fieldName: "clicks", sortOrder: "DESCENDING" }],
      rowLimit: 15,
    }),
    // 品牌词 vs 非品牌词
    queryGSC({
      startDate: currentStart, endDate: currentEnd,
      dimensions: ["query"],
      rowLimit: 500,
    }),
    queryGSC({
      startDate: prevStart, endDate: prevEnd,
      dimensions: ["query"],
      rowLimit: 500,
    }),
    // 索引页数代理：有展现的 landing page 数量
    queryGSC({
      startDate: currentStart, endDate: currentEnd,
      dimensions: ["page"],
      rowLimit: 1000,
    }),
  ]);

  const th = thisRows[0] ?? { clicks: 0, impressions: 0, ctr: 0, position: 0 };
  const la = lastRows[0] ?? { clicks: 1, impressions: 1, ctr: 0.001, position: th.position + 1 };

  const brandClicks = queryRows
    .filter((row) => isBrandQuery(row.keys[0] || ""))
    .reduce((sum, row) => sum + row.clicks, 0);
  const nonBrandClicks = Math.max(
    0,
    queryRows.reduce((sum, row) => sum + row.clicks, 0) - brandClicks
  );
  const lastBrandClicks = lastQueryRows
    .filter((row) => isBrandQuery(row.keys[0] || ""))
    .reduce((sum, row) => sum + row.clicks, 0);
  const lastNonBrandClicks = Math.max(
    1,
    lastQueryRows.reduce((sum, row) => sum + row.clicks, 0) - lastBrandClicks
  );
  const totalClicks = brandClicks + nonBrandClicks;
  const indexedPages = pageRows.filter((row) => row.impressions > 0).length;

  return {
    kpi: {
      clicks:      { value: th.clicks.toLocaleString(),       change: pctChange(th.clicks, la.clicks),           up: th.clicks >= la.clicks },
      impressions: { value: th.impressions.toLocaleString(),  change: pctChange(th.impressions, la.impressions),  up: th.impressions >= la.impressions },
      ctr:         { value: `${(th.ctr * 100).toFixed(2)}%`,  change: pctChange(th.ctr, la.ctr),                 up: th.ctr >= la.ctr },
      position:    { value: th.position.toFixed(1),            change: pctChange(la.position, th.position),       up: th.position <= la.position },
    },
    trend: dailyRows.map((row) => ({
      date:        row.keys[0].slice(5),   // "YYYY-MM-DD" → "MM-DD"
      clicks:      row.clicks,
      impressions: row.impressions,
    })),
    keywords: keywordRows.map((row) => ({
      word:        row.keys[0],
      clicks:      row.clicks,
      impressions: row.impressions,
      ctr:         `${(row.ctr * 100).toFixed(1)}%`,
      position:    Math.round(row.position * 10) / 10,
    })),
    brandVsNonBrand: {
      brandClicks,
      nonBrandClicks,
      brandShare: totalClicks ? Math.round((brandClicks / totalClicks) * 100) : 0,
      brandChange: pctChange(brandClicks, Math.max(lastBrandClicks, 1)),
      nonBrandChange: pctChange(nonBrandClicks, lastNonBrandClicks),
    },
    indexing: {
      indexedPages,
      landingBounce: "—",
      topLandingPages: [],
    },
  };
}
