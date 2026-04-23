/**
 * Facebook Ad Library 公开数据获取
 * 无需 API Key，通过公开端点抓取
 */

export interface FacebookAd {
  id: string;
  headline: string;
  body: string;
  link_caption?: string;
  page_name: string;
  start_date: string;
  media_type: string;
  countries: string[];
  platforms: string[];
}

const BRAND_PAGES: Record<string, string> = {
  azazie: "Azazie",
  birdygrey: "Birdy Grey",
  hellomolly: "Hello Molly",
  jjshouse: "JJsHouse",
};

/**
 * 从 Facebook Ad Library 获取品牌在投广告
 * 注意：Facebook 在 2024 年后对 Ad Library 访问有限制
 * 建议使用官方 Graph API 或第三方服务
 */
export async function fetchFacebookAds(brand: string): Promise<FacebookAd[]> {
  const pageName = BRAND_PAGES[brand];
  if (!pageName) return [];

  try {
    // 方案1：使用 Facebook Graph API（需要 Access Token）
    // const accessToken = process.env.FACEBOOK_ACCESS_TOKEN;
    // if (!accessToken) throw new Error("Missing FACEBOOK_ACCESS_TOKEN");

    // const url = `https://graph.facebook.com/v18.0/ads_archive`;
    // const params = new URLSearchParams({
    //   access_token: accessToken,
    //   search_terms: pageName,
    //   ad_reached_countries: "['US']",
    //   ad_active_status: "ACTIVE",
    //   fields: "id,ad_creative_bodies,ad_creative_link_captions,page_name,ad_delivery_start_time",
    // });

    // 方案2：使用第三方聚合服务（推荐）
    // 例如：AdSpy, PowerAdSpy, BigSpy API

    // 暂时返回空数组，等待 Access Token 配置
    console.log(`[Facebook Ads] Fetching ads for ${brand} (${pageName})`);
    return [];
  } catch (error) {
    console.error(`[Facebook Ads] Error fetching ${brand}:`, error);
    return [];
  }
}

/**
 * 批量获取所有品牌的 Facebook 广告
 */
export async function fetchAllBrandAds(): Promise<Record<string, FacebookAd[]>> {
  const brands = Object.keys(BRAND_PAGES);
  const results = await Promise.all(
    brands.map(async (brand) => ({
      brand,
      ads: await fetchFacebookAds(brand),
    }))
  );

  return results.reduce(
    (acc, { brand, ads }) => {
      acc[brand] = ads;
      return acc;
    },
    {} as Record<string, FacebookAd[]>
  );
}

/**
 * 提取广告中的关键词
 */
export function extractKeywords(ads: FacebookAd[]): string[] {
  const keywords = new Set<string>();
  const commonPhrases = [
    "free shipping",
    "sale",
    "discount",
    "custom size",
    "fast delivery",
    "trending",
    "new arrival",
    "limited time",
    "off",
    "%",
  ];

  ads.forEach((ad) => {
    const text = `${ad.headline} ${ad.body}`.toLowerCase();
    commonPhrases.forEach((phrase) => {
      if (text.includes(phrase)) {
        keywords.add(phrase);
      }
    });
  });

  return Array.from(keywords);
}
