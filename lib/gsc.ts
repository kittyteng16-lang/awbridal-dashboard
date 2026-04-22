import { matonPost } from "./maton";
import { pctChange } from "./utils";
import type { SEOData } from "@/types/dashboard";
import { subDays, format } from "date-fns";

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

async function queryGSC(body: object): Promise<GSCRow[]> {
  const r = await matonPost<GSCResponse>(GSC_PATH, body);
  return r.rows ?? [];
}

function gscDate(daysAgo: number): string {
  return format(subDays(new Date(), daysAgo), "yyyy-MM-dd");
}

export async function fetchSEOData(days: number = 30): Promise<SEOData> {
  const startDaysAgo = days + 1; // GSC 有2天延迟
  const doubleDays = days * 2;

  const [dailyRows, thisRows, lastRows, keywordRows] = await Promise.all([
    // 近N天每日趋势（GSC 有2天延迟）
    queryGSC({
      startDate: gscDate(startDaysAgo), endDate: gscDate(2),
      dimensions: ["date"], rowLimit: days + 10,
    }),
    // 本期汇总
    queryGSC({ startDate: gscDate(startDaysAgo), endDate: gscDate(2), dimensions: [] }),
    // 上期汇总
    queryGSC({ startDate: gscDate(doubleDays + 1), endDate: gscDate(days + 2), dimensions: [] }),
    // Top 关键词
    queryGSC({
      startDate: gscDate(startDaysAgo), endDate: gscDate(2),
      dimensions: ["query"],
      orderBy: [{ fieldName: "clicks", sortOrder: "DESCENDING" }],
      rowLimit: 15,
    }),
  ]);

  const th = thisRows[0] ?? { clicks: 0, impressions: 0, ctr: 0, position: 0 };
  const la = lastRows[0] ?? { clicks: 1, impressions: 1, ctr: 0.001, position: th.position + 1 };

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
  };
}
