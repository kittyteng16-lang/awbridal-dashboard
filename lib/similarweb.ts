/**
 * SimilarWeb API 集成
 * 用于获取竞品流量、渠道、关键词等数据
 *
 * API 文档: https://developer.similarweb.com/
 * 定价: https://www.similarweb.com/corp/developer/pricing/
 */

const SIMILARWEB_API_KEY = process.env.SIMILARWEB_API_KEY;
const BASE_URL = "https://api.similarweb.com/v1/website";

interface SimilarWebTraffic {
  global_rank: number;
  country_rank: { country: string; rank: number }[];
  visits: number;
  unique_visitors: number;
  pages_per_visit: number;
  avg_visit_duration: number;
  bounce_rate: number;
}

interface SimilarWebTrafficSource {
  direct: number;
  mail: number;
  referrals: number;
  search: number;
  social: number;
  paid_referrals: number;
  display_ads: number;
}

interface SimilarWebKeyword {
  search_term: string;
  organic: number;
  paid: number;
  score: number;
  change: number;
}

interface SimilarWebReferral {
  domain: string;
  share: number;
  change: number;
}

/**
 * 通用 API 请求函数
 */
async function fetchSimilarWeb<T>(endpoint: string): Promise<T | null> {
  if (!SIMILARWEB_API_KEY) {
    console.warn("[SimilarWeb] API Key 未配置，使用模拟数据");
    return null;
  }

  const url = `${BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${SIMILARWEB_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`SimilarWeb API Error ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`[SimilarWeb] Failed to fetch ${endpoint}:`, error);
    return null;
  }
}

/**
 * 获取网站总流量数据
 * Endpoint: /total-traffic-and-engagement/visits
 */
export async function fetchTotalTraffic(
  domain: string,
  startMonth: string = "2026-01", // 格式: YYYY-MM
  endMonth: string = "2026-03",
  granularity: "daily" | "weekly" | "monthly" = "monthly"
): Promise<{
  visits: { date: string; visits: number }[];
  meta: { request: any; status: string };
} | null> {
  const endpoint = `/${domain}/total-traffic-and-engagement/visits?start_date=${startMonth}&end_date=${endMonth}&granularity=${granularity}&main_domain_only=false&format=json`;
  return fetchSimilarWeb(endpoint);
}

/**
 * 获取流量来源分布
 * Endpoint: /traffic-sources/overview-share
 */
export async function fetchTrafficSources(
  domain: string,
  startMonth: string = "2026-01",
  endMonth: string = "2026-03"
): Promise<{
  visits: { [key: string]: SimilarWebTrafficSource[] };
  meta: any;
} | null> {
  const endpoint = `/${domain}/traffic-sources/overview-share?start_date=${startMonth}&end_date=${endMonth}&main_domain_only=false&format=json`;
  return fetchSimilarWeb(endpoint);
}

/**
 * 获取热门关键词（自然搜索）
 * Endpoint: /traffic-sources/organic-search
 */
export async function fetchOrganicKeywords(
  domain: string,
  startMonth: string = "2026-01",
  endMonth: string = "2026-03",
  limit: number = 10
): Promise<{
  search: SimilarWebKeyword[];
  meta: any;
} | null> {
  const endpoint = `/${domain}/traffic-sources/organic-search?start_date=${startMonth}&end_date=${endMonth}&limit=${limit}&main_domain_only=false&format=json`;
  return fetchSimilarWeb(endpoint);
}

/**
 * 获取付费关键词（广告）
 * Endpoint: /traffic-sources/paid-search
 */
export async function fetchPaidKeywords(
  domain: string,
  startMonth: string = "2026-01",
  endMonth: string = "2026-03",
  limit: number = 10
): Promise<{
  search: SimilarWebKeyword[];
  meta: any;
} | null> {
  const endpoint = `/${domain}/traffic-sources/paid-search?start_date=${startMonth}&end_date=${endMonth}&limit=${limit}&main_domain_only=false&format=json`;
  return fetchSimilarWeb(endpoint);
}

/**
 * 获取社交媒体来源
 * Endpoint: /traffic-sources/social
 */
export async function fetchSocialSources(
  domain: string,
  startMonth: string = "2026-01",
  endMonth: string = "2026-03"
): Promise<{
  social: { source_type: string; share: number }[];
  meta: any;
} | null> {
  const endpoint = `/${domain}/traffic-sources/social?start_date=${startMonth}&end_date=${endMonth}&main_domain_only=false&format=json`;
  return fetchSimilarWeb(endpoint);
}

/**
 * 获取热门引荐来源
 * Endpoint: /traffic-sources/referrals
 */
export async function fetchReferrals(
  domain: string,
  startMonth: string = "2026-01",
  endMonth: string = "2026-03",
  limit: number = 10
): Promise<{
  referrals: SimilarWebReferral[];
  meta: any;
} | null> {
  const endpoint = `/${domain}/traffic-sources/referrals?start_date=${startMonth}&end_date=${endMonth}&limit=${limit}&main_domain_only=false&format=json`;
  return fetchSimilarWeb(endpoint);
}

/**
 * 获取热门目的地页面
 * Endpoint: /popular-pages
 */
export async function fetchPopularPages(
  domain: string,
  startMonth: string = "2026-01",
  endMonth: string = "2026-03"
): Promise<{
  popular_pages: { page: string; share: number }[];
  meta: any;
} | null> {
  const endpoint = `/${domain}/popular-pages?start_date=${startMonth}&end_date=${endMonth}&main_domain_only=false&format=json`;
  return fetchSimilarWeb(endpoint);
}

/**
 * 获取完整的竞品流量分析数据（整合多个端点）
 */
export async function fetchCompetitorAnalysis(domain: string) {
  console.log(`[SimilarWeb] Fetching data for ${domain}...`);

  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  const startMonth = threeMonthsAgo.toISOString().slice(0, 7);

  const [
    trafficData,
    sourcesData,
    organicKeywords,
    paidKeywords,
    socialData,
    referralsData,
    popularPages,
  ] = await Promise.all([
    fetchTotalTraffic(domain, startMonth, currentMonth),
    fetchTrafficSources(domain, startMonth, currentMonth),
    fetchOrganicKeywords(domain, startMonth, currentMonth, 20),
    fetchPaidKeywords(domain, startMonth, currentMonth, 10),
    fetchSocialSources(domain, startMonth, currentMonth),
    fetchReferrals(domain, startMonth, currentMonth, 10),
    fetchPopularPages(domain, startMonth, currentMonth),
  ]);

  return {
    traffic: trafficData,
    sources: sourcesData,
    organicKeywords,
    paidKeywords,
    social: socialData,
    referrals: referralsData,
    popularPages,
  };
}

/**
 * 格式化为竞品监控所需的数据结构
 */
export function formatCompetitorTrafficData(brand: string, data: any) {
  if (!data || !data.traffic) {
    return null;
  }

  // 获取最新月份的访问量
  const latestVisits = data.traffic.visits?.[data.traffic.visits.length - 1];
  const previousVisits = data.traffic.visits?.[data.traffic.visits.length - 2];

  const totalVisits = latestVisits?.visits || 0;
  const visitChange = previousVisits?.visits
    ? `${((totalVisits - previousVisits.visits) / previousVisits.visits * 100).toFixed(1)}%`
    : "0%";

  // 获取最新的流量来源分布
  const latestSources = data.sources?.visits
    ? Object.values(data.sources.visits)[Object.values(data.sources.visits).length - 1]
    : null;

  const channels = latestSources
    ? {
        direct: Math.round((latestSources[0]?.direct || 0) * 100),
        organic: Math.round((latestSources[0]?.search || 0) * 100),
        paid: Math.round((latestSources[0]?.paid_referrals || 0) * 100),
        social: Math.round((latestSources[0]?.social || 0) * 100),
        referral: Math.round((latestSources[0]?.referrals || 0) * 100),
      }
    : {
        direct: 0,
        organic: 0,
        paid: 0,
        social: 0,
        referral: 0,
      };

  // 热门落地页
  const topLandingPages = data.popularPages?.popular_pages?.slice(0, 3).map((p: any) => ({
    url: p.page,
    visits: Math.round(totalVisits * p.share),
    share: `${(p.share * 100).toFixed(1)}%`,
  })) || [];

  // 关键词排名（Share of Voice）
  const shareOfVoice = data.organicKeywords?.search?.slice(0, 5).map((kw: any, i: number) => ({
    keyword: kw.search_term,
    rank: i + 1,
    share: `${(kw.score * 100).toFixed(1)}%`,
  })) || [];

  // 社交媒体活跃度
  const socialActivity = data.social?.social?.map((s: any) => ({
    platform: s.source_type === "Facebook" ? "Facebook" : s.source_type === "Instagram" ? "Instagram" : s.source_type,
    followers: "N/A",
    postFreq: "N/A",
    engagement: `${(s.share * 100).toFixed(1)}%`,
  })) || [];

  return {
    brand,
    totalVisits,
    visitChange,
    channels,
    topLandingPages,
    shareOfVoice,
    socialActivity,
  };
}
