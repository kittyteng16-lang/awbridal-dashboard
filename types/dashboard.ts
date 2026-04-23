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
  brandVsNonBrand?: {
    brandClicks: number;
    nonBrandClicks: number;
    brandShare: number;
    brandChange: string;
    nonBrandChange: string;
  };
  indexing?: {
    indexedPages: number;
    landingBounce: string;
    topLandingPages: {
      path: string;
      sessions: number;
      bounce: string;
    }[];
  };
  backlinks?: {
    newDomains: number;
    qualityRate: string;
    topReferrals: {
      domain: string;
      sessions: number;
      engagementRate: string;
    }[];
  };
  geo?: {
    aiMentions: number;
    aiShare: string;
    topAISources: {
      source: string;
      sessions: number;
    }[];
    aiLandingPages: {
      path: string;
      sessions: number;
      source: string;
    }[];
    aiReferrerKeywords: {
      keyword: string;
      source: string;
      count: number;
    }[];
  };
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

// ── 转化 ──────────────────────────────────────────────
export interface ConversionData {
  kpi: {
    purchases: KPIMetric;
    checkouts: KPIMetric;
    addToCarts: KPIMetric;
    cvr: KPIMetric;
  };
  funnel: { step: string; count: number; rate: string }[];
  trend: TimeSeriesPoint[];   // date, purchase, add_to_cart
}

// ── 竞品监控 ──────────────────────────────────────────
export interface CompetitorTraffic {
  brand: string;
  totalVisits: number;
  visitChange: string;
  channels: {
    direct: number;
    organic: number;
    paid: number;
    social: number;
    referral: number;
  };
  topLandingPages: {
    url: string;
    visits: number;
    share: string;
  }[];
  shareOfVoice: {
    keyword: string;
    rank: number;
    share: string;
  }[];
  socialActivity: {
    platform: string;
    followers: number;
    postFreq: string;
    engagement: string;
  }[];
}

export interface CompetitorMerchandising {
  brand: string;
  newSKUs: {
    thisWeek: number;
    lastWeek: number;
    trend: string;
  };
  priceDistribution: {
    range: string;
    count: number;
    share: string;
  }[];
  topProducts: {
    name: string;
    price: string;
    stockStatus: string;
  }[];
  promotionActivity: {
    type: string;
    discount: string;
    frequency: string;
    lastSeen: string;
  }[];
}

export interface CompetitorAds {
  brand: string;
  activeAds: number;
  adChange: string;
  topCreatives: {
    headline: string;
    copy: string;
    format: string;
    countries: string[];
    runningDays: number;
  }[];
  keywords: string[];
  topCountries: {
    country: string;
    share: string;
  }[];
}

export interface CompetitorReputation {
  brand: string;
  trustpilot: {
    score: number;
    reviews: number;
    change: string;
  };
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
  };
  commonIssues: {
    topic: string;
    mentions: number;
    trend: string;
  }[];
  topQuestions: {
    question: string;
    frequency: number;
  }[];
}

export interface CompetitorData {
  traffic: CompetitorTraffic[];
  merchandising: CompetitorMerchandising[];
  ads: CompetitorAds[];
  reputation: CompetitorReputation[];
}

// ── 产品分析 ──────────────────────────────────────────
export interface ProductMetrics {
  views: number;
  addToCarts: number;
  checkouts: number;
  purchases: number;
  revenue: number;
}

export interface ProductFunnel {
  step: string;
  count: number;
  rate: string;
  dropOff?: string;
}

export interface ProductPerformance {
  name: string;
  sku?: string;
  views: number;
  addToCarts: number;
  purchases: number;
  revenue: number;
  viewToCartRate: string;
  cartToPurchaseRate: string;
  overallCVR: string;
}

export interface ProductInsight {
  type: "success" | "warning" | "danger" | "info";
  title: string;
  description: string;
  recommendation: string;
  priority: "high" | "medium" | "low";
}

export interface ProductData {
  kpi: {
    views: KPIMetric;
    addToCarts: KPIMetric;
    checkouts: KPIMetric;
    purchases: KPIMetric;
    avgOrderValue: KPIMetric;
  };
  funnel: ProductFunnel[];
  trend: TimeSeriesPoint[];
  topProducts: ProductPerformance[];
  insights: ProductInsight[];
}

// ── Supabase 缓存行 ────────────────────────────────────
export interface CacheRow {
  id: string;
  section: string;
  data: unknown;
  fetched_at: string;
  expires_at: string;
}
