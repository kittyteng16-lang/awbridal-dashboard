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

/**
 * 从婚礼相关 subreddit 拉取热帖
 * 支持 wedding, weddingplanning, prom 等
 */
export async function fetchRedditMentions(query: string, limit = 15, timeRange = "year"): Promise<RedditResult[]> {
  // 婚礼相关 subreddit 列表
  const subreddits = ["wedding", "weddingplanning", "prom", "weddingdress", "Bride"];
  const allPosts: RedditPost[] = [];

  // 根据时间范围确定排序方式
  const sortBy = timeRange === "week" ? "hot" : "top";
  const timeParam = timeRange === "year" ? "year" : timeRange === "month" ? "month" : "week";

  for (const sub of subreddits) {
    try {
      const url = `https://www.reddit.com/r/${sub}/${sortBy}.json?limit=${Math.ceil(limit / subreddits.length)}&t=${timeParam}`;
      const res = await fetch(url, {
        headers: { "User-Agent": "awbridal-dashboard/1.0" },
        next: { revalidate: 3600 },
      });
      if (!res.ok) continue;
      const data = await res.json();
      const posts: RedditPost[] = data.data.children.map((c: { data: RedditPost }) => c.data);
      allPosts.push(...posts);
    } catch {
      continue;
    }
  }

  // 按热度（score + comments）排序，取前 limit 条
  const sorted = allPosts
    .sort((a, b) => (b.score + b.num_comments) - (a.score + a.num_comments))
    .slice(0, limit);

  return sorted.map((p) => ({
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
