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
  "PromdressAdvice",
  "PromDresses",
];

function parseRSSEntries(xml: string, subreddit: string): TrendingTopic[] {
  const entries: TrendingTopic[] = [];
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let match;
  while ((match = entryRegex.exec(xml)) !== null) {
    const block = match[1];
    const title = (/<title>([\s\S]*?)<\/title>/.exec(block)?.[1] ?? "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();
    const link = /<link href="([^"]+)"/.exec(block)?.[1] ?? "";
    if (title && link) {
      entries.push({
        title,
        traffic: `r/${subreddit}`,
        relatedQueries: [`r/${subreddit}`],
        source: "reddit" as const,
        url: link,
      });
    }
  }
  return entries;
}

export async function fetchRedditTrends(_topic: string, limit = 25, timeRange = "month"): Promise<TrendingTopic[]> {
  const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
  const results = await Promise.allSettled(
    BRIDAL_SUBREDDITS.map((sub) =>
      fetch(`https://www.reddit.com/r/${sub}/top/.rss?t=${timeRange}&limit=10`, {
        headers: { "User-Agent": UA, Accept: "application/atom+xml,application/xml,text/xml" },
        next: { revalidate: 3600 },
      }).then((r) => {
        if (!r.ok) throw new Error(`RSS ${sub} ${r.status}`);
        return r.text();
      }).then((xml) => parseRSSEntries(xml, sub))
    )
  );

  const all: TrendingTopic[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") all.push(...r.value);
  }
  // shuffle to mix subreddits, return top N
  all.sort(() => Math.random() - 0.5);
  return all.slice(0, limit);
}
