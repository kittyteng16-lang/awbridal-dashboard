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
  const req = keywords.map((keyword) => ({
    keyword,
    geo: "",
    time: timeRange,
  }));
  const params = new URLSearchParams({
    hl: "en-US",
    tz: "480",
    req: JSON.stringify({ comparisonItem: req, category: 0, property: "" }),
  });
  const res = await fetch(`https://trends.google.com/trends/api/explore?${params}`, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      Accept: "application/json",
    },
    next: { revalidate: 7200 },
  });
  if (!res.ok) throw new Error(`Google Trends explore ${res.status}`);
  const text = await res.text();
  // Strip ")]}'\n" prefix
  const json = JSON.parse(text.replace(/^\)\]\}'\n/, ""));
  const widgets = json.widgets as { id: string; token: string }[];
  const timeWidget = widgets.find((w) => w.id === "TIMESERIES");
  if (!timeWidget) return [];

  // Get interest over time
  const dataParams = new URLSearchParams({
    hl: "en-US",
    tz: "480",
    req: JSON.stringify({ time: timeRange, resolution: "WEEK", locale: "en-US", comparisonItem: req.map((r) => ({ ...r, complexKeywordsRestriction: null })), requestOptions: { property: "", backend: "IZG", category: 0 } }),
    token: timeWidget.token,
    csv: "0",
  });
  const dataRes = await fetch(`https://trends.google.com/trends/api/widgetdata/multiline?${dataParams}`, {
    headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" },
    next: { revalidate: 7200 },
  });
  if (!dataRes.ok) throw new Error(`Google Trends data ${dataRes.status}`);
  const dataText = await dataRes.text();
  const dataJson = JSON.parse(dataText.replace(/^\)\]\}'\n/, ""));
  const timelineData = dataJson.default?.timelineData ?? [];
  if (!timelineData.length) return [];

  // Return average interest per keyword
  return keywords.map((keyword, i) => {
    const values = timelineData.map((d: { value: number[] }) => d.value[i] ?? 0);
    const avg = Math.round(values.reduce((a: number, b: number) => a + b, 0) / values.length);
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
