/**
 * Trustpilot 公开页面数据抓取（无需API）
 * 直接抓取公开评价页面的JSON数据
 */

export interface TrustpilotReview {
  id: string;
  title: string;
  text: string;
  rating: number;
  author: string;
  date: string;
  verified: boolean;
}

export interface TrustpilotStats {
  averageRating: number;
  totalReviews: number;
  reviews: TrustpilotReview[];
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

/**
 * 从Trustpilot公开页面抓取评价数据
 * @param businessUnit 您的业务单元名称（例如：awbridal.com 或 www.awbridal.com）
 */
export async function fetchTrustpilotReviews(
  businessUnit: string,
  limit = 20
): Promise<TrustpilotStats> {
  try {
    // Trustpilot公开API端点
    const url = `https://www.trustpilot.com/review/${businessUnit}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      next: { revalidate: 3600 }, // 缓存1小时
    });

    if (!response.ok) {
      throw new Error(`Trustpilot HTTP ${response.status}`);
    }

    const html = await response.text();

    // 从HTML中提取JSON数据
    const dataMatch = html.match(/<script[^>]*id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/s);
    if (!dataMatch) {
      throw new Error('无法找到Trustpilot数据');
    }

    const data = JSON.parse(dataMatch[1]);
    const pageProps = data?.props?.pageProps;

    if (!pageProps) {
      throw new Error('无法解析Trustpilot页面数据');
    }

    // 提取评价统计
    const businessUnit = pageProps.businessUnit || {};
    const reviews = pageProps.reviews || [];

    const stats: TrustpilotStats = {
      averageRating: businessUnit.score?.trustScore || 0,
      totalReviews: businessUnit.numberOfReviews?.total || 0,
      ratingDistribution: {
        1: businessUnit.numberOfReviews?.oneStar || 0,
        2: businessUnit.numberOfReviews?.twoStars || 0,
        3: businessUnit.numberOfReviews?.threeStars || 0,
        4: businessUnit.numberOfReviews?.fourStars || 0,
        5: businessUnit.numberOfReviews?.fiveStars || 0,
      },
      reviews: reviews.slice(0, limit).map((review: any) => ({
        id: review.id || '',
        title: review.title || '',
        text: review.text || '',
        rating: review.rating || 0,
        author: review.consumer?.displayName || '匿名用户',
        date: review.dates?.publishedDate
          ? new Date(review.dates.publishedDate).toLocaleDateString('zh-CN')
          : '',
        verified: review.isVerified || false,
      })),
    };

    return stats;
  } catch (error) {
    console.error('Trustpilot抓取失败:', error);
    // 返回空数据而不是抛出错误
    return {
      averageRating: 0,
      totalReviews: 0,
      reviews: [],
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    };
  }
}

/**
 * 简化版：仅获取评分和评论数
 */
export async function getTrustpilotBasicStats(businessUnit: string) {
  const stats = await fetchTrustpilotReviews(businessUnit, 0);
  return {
    rating: stats.averageRating,
    totalReviews: stats.totalReviews,
  };
}
