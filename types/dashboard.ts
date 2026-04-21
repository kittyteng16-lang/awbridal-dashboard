// ── 通用 ──────────────────────────────────────────────
export interface KPIMetric {
  value: string;
  change: string;
  up: boolean;
}

export interface TimeSeriesPoint {
  date: string;   // "MM/DD"
  [key: string]: number | string;
}

// ── 流量 ──────────────────────────────────────────────
export interface TrafficData {
  kpi: {
    pv: KPIMetric;
    uv: KPIMetric;
    bounce: KPIMetric;
    duration: KPIMetric;
  };
  trend: TimeSeriesPoint[];          // date, pv, uv, sessions
  sources: { name: string; value: number }[];
  topPages: {
    path: string;
    pv: number;
    uv: number;
    bounce: string;
  }[];
}

// ── SEO ──────────────────────────────────────────────
export interface SEOData {
  kpi: {
    clicks: KPIMetric;
    impressions: KPIMetric;
    ctr: KPIMetric;
    position: KPIMetric;
  };
  trend: TimeSeriesPoint[];          // date, clicks, impressions
  keywords: {
    word: string;
    clicks: number;
    impressions: number;
    ctr: string;
    position: number;
  }[];
}

// ── 总览 ──────────────────────────────────────────────
export interface OverviewData {
  kpi: {
    pv: KPIMetric;
    uv: KPIMetric;
    organicClicks: KPIMetric;
    avgPosition: KPIMetric;
  };
  trend: TimeSeriesPoint[];          // date, pv, uv
  sources: { name: string; value: number }[];
  health: { subject: string; score: number }[];
}

// ── Supabase 缓存行 ────────────────────────────────────
export interface CacheRow {
  id: string;
  section: string;
  data: unknown;
  fetched_at: string;
  expires_at: string;
}
