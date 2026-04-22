/**
 * Google Trends 非官方 API
 */

export interface TrendingTopic {
  title: string;
  traffic: string;
  relatedQueries: string[];
  source: "google_trends" | "reddit";
  url?: string;
}

export async function fetchGoogleTrends(keywords: string[], timeRange = "today 1-m"): Promise<{ keyword: string; interest: number }[]> {
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
    next: { revalidate: 7200 },
  });
  if (!res.ok) throw new Error(`SerpAPI Google Trends ${res.status}`);
  const data = await res.json();

  const timeline: { date: string; values: { query: string; value: string }[] }[] =
    data.interest_over_time?.timeline_data ?? [];
  if (!timeline.length) return [];

  return keywords.map((keyword) => {
    const values = timeline.map((point) => {
      const entry = point.values.find((v) => v.query === keyword);
      return parseInt(entry?.value ?? "0", 10);
    });
    const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
    return { keyword, interest: avg };
  });
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
