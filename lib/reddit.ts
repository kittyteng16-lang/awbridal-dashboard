/**
 * Reddit 公开 JSON API（无需授权）
 * 搜索品牌相关帖子/评价
 */

interface RedditPost {
  title: string;
  selftext: string;
  score: number;
  num_comments: number;
  subreddit: string;
  permalink: string;
  created_utc: number;
  url: string;
}

export interface RedditResult {
  title: string;
  text: string;
  score: number;
  comments: number;
  subreddit: string;
  url: string;
  date: string;
  sentiment: "positive" | "neutral" | "negative";
}

function guessSentiment(title: string, text: string): "positive" | "neutral" | "negative" {
  const content = (title + " " + text).toLowerCase();
  const pos = ["love", "great", "amazing", "beautiful", "perfect", "recommend", "excellent", "gorgeous", "stunning", "happy", "best", "wonderful"];
  const neg = ["bad", "terrible", "awful", "scam", "fraud", "fake", "horrible", "worst", "disappoint", "refund", "problem", "issue", "wrong", "late", "never"];
  const posScore = pos.filter((w) => content.includes(w)).length;
  const negScore = neg.filter((w) => content.includes(w)).length;
  if (posScore > negScore) return "positive";
  if (negScore > posScore) return "negative";
  return "neutral";
}

export async function fetchRedditMentions(query: string, limit = 15, timeRange = "year"): Promise<RedditResult[]> {
  const encoded = encodeURIComponent(query);
  const url = `https://www.reddit.com/search.json?q=${encoded}&sort=new&limit=${limit}&t=${timeRange}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "awbridal-dashboard/1.0" },
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`Reddit API ${res.status}`);
  const data = await res.json();
  const posts: RedditPost[] = data.data.children.map((c: { data: RedditPost }) => c.data);
  return posts.map((p) => ({
    title: p.title,
    text: p.selftext?.slice(0, 200) ?? "",
    score: p.score,
    comments: p.num_comments,
    subreddit: p.subreddit,
    url: `https://www.reddit.com${p.permalink}`,
    date: new Date(p.created_utc * 1000).toLocaleDateString("zh-CN"),
    sentiment: guessSentiment(p.title, p.selftext ?? ""),
  }));
}
