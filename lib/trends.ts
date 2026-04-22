export interface TrendingTopic {
  title: string;
  traffic: string;
  relatedQueries: string[];
  source: "google_trends" | "reddit";
  url?: string;
}

export interface KeywordTrend {
  keyword: string;
  avgInterest: number;
  timeline: { date: string; value: number }[];
}

export interface TrendGroup {
  groupName: string;
  keywords: KeywordTrend[];
}

// 3 groups × 5 keywords = 15 keywords, ~90 SerpAPI calls/month with 24h cache
export const TREND_GROUPS: { groupName: string; keywords: string[] }[] = [
  {
    groupName: "核心婚纱",
    keywords: ["wedding dress", "bridal gown", "wedding gown", "prom dress", "bridesmaid dress"],
  },
  {
    groupName: "婚纱款式",
    keywords: ["lace wedding dress", "mermaid wedding dress", "ball gown wedding dress", "bohemian wedding dress", "plus size wedding dress"],
  },
  {
    groupName: "Prom & 礼服",
    keywords: ["prom dress 2025", "homecoming dress", "evening gown", "formal dress", "cheap prom dress"],
  },
];

async function fetchTrendGroup(keywords: string[], timeRange: string): Promise<KeywordTrend[]> {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) throw new Error("SERPAPI_KEY not configured");

  const params = new URLSearchParams({
    engine: "google_trends",
    q: keywords.join(","),
    date: timeRange,
    hl: "en",
    tz: "480",
    api_key: apiKey,
  });

  const res = await fetch(`https://serpapi.com/search.json?${params}`, {
    next: { revalidate: 86400 }, // 24h cache
  });
  if (!res.ok) throw new Error(`SerpAPI ${res.status}`);
  const data = await res.json();

  const timeline: { date: string; values: { query: string; value: string | number }[] }[] =
    data.interest_over_time?.timeline_data ?? [];

  return keywords.map((keyword) => {
    const points = timeline.map((point) => {
      const entry = point.values.find((v) => v.query === keyword);
      const raw = entry?.value ?? 0;
      const value = typeof raw === "number" ? raw : parseInt(String(raw), 10);
      return { date: point.date?.slice(0, 10) ?? "", value: isNaN(value) ? 0 : value };
    });
    const nonZero = points.filter((p) => p.value > 0);
    const avg = nonZero.length
      ? Math.round(nonZero.reduce((a, b) => a + b.value, 0) / nonZero.length)
      : 0;
    return { keyword, avgInterest: avg, timeline: points };
  });
}

export async function fetchAllTrendGroups(timeRange = "today 1-m"): Promise<TrendGroup[]> {
  const results = await Promise.allSettled(
    TREND_GROUPS.map((g) => fetchTrendGroup(g.keywords, timeRange))
  );
  return TREND_GROUPS.map((g, i) => ({
    groupName: g.groupName,
    keywords: results[i].status === "fulfilled" ? results[i].value : [],
  }));
}

// Legacy export kept for compatibility
export async function fetchGoogleTrends(keywords: string[], timeRange = "today 1-m"): Promise<{ keyword: string; interest: number }[]> {
  const rows = await fetchTrendGroup(keywords, timeRange);
  return rows.map((r) => ({ keyword: r.keyword, interest: r.avgInterest }));
}

const BRIDAL_SUBREDDITS = [
  "weddingplanning",
  "weddingdress",
  "bridal",
  "wedding",
  "weddingwow",
  "prom",
  "Prom",
  "PromdressAdvice",
  "PromDresses",
];

export async function fetchRedditTrends(_topic: string, limit = 20, timeRange = "month"): Promise<TrendingTopic[]> {
  const subredditStr = BRIDAL_SUBREDDITS.join("+");
  const url = `https://www.reddit.com/r/${subredditStr}/top.json?t=${timeRange}&limit=${limit}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; awbridal-dashboard/1.0; +https://awbridal.com)",
      Accept: "application/json",
    },
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`Reddit trends ${res.status}`);
  const data = await res.json();
  return data.data.children.map((c: { data: { title: string; score: number; subreddit: string; permalink: string; num_comments: number } }) => ({
    title: c.data.title,
    traffic: `${c.data.score.toLocaleString()} upvotes · ${c.data.num_comments} comments`,
    relatedQueries: [`r/${c.data.subreddit}`],
    source: "reddit" as const,
    url: `https://www.reddit.com${c.data.permalink}`,
  }));
}
