/**
 * 竞品监控数据获取
 * 监测品牌: azazie, birdygrey, hellomolly, jjshouse
 *
 * 注意：当前使用模拟数据框架
 * 实际生产需要接入：
 * - SimilarWeb / SEMrush API (流量数据)
 * - Facebook Ad Library API (广告监控)
 * - Trustpilot API / Review APIs (评价数据)
 * - 自建爬虫 (商品/定价监控)
 */

import type {
  CompetitorData,
  CompetitorTraffic,
  CompetitorMerchandising,
  CompetitorAds,
  CompetitorReputation,
} from "@/types/dashboard";

const BRANDS = ["azazie", "birdygrey", "hellomolly", "jjshouse"];

/**
 * 获取竞品流量与渠道情报
 */
export async function fetchCompetitorTraffic(): Promise<CompetitorTraffic[]> {
  // TODO: 接入 SimilarWeb / SEMrush API
  // 模拟数据
  return BRANDS.map((brand, i) => ({
    brand,
    totalVisits: Math.floor(Math.random() * 5000000) + 1000000,
    visitChange: `${Math.random() > 0.5 ? "+" : "-"}${(Math.random() * 20).toFixed(1)}%`,
    channels: {
      direct: Math.floor(Math.random() * 30) + 20,
      organic: Math.floor(Math.random() * 40) + 25,
      paid: Math.floor(Math.random() * 20) + 5,
      social: Math.floor(Math.random() * 15) + 3,
      referral: Math.floor(Math.random() * 10) + 2,
    },
    topLandingPages: [
      { url: `/prom-dresses`, visits: 125000, share: "18.5%" },
      { url: `/bridesmaid-dresses`, visits: 98000, share: "14.2%" },
      { url: `/sale`, visits: 87000, share: "12.8%" },
    ],
    shareOfVoice: [
      { keyword: "prom dresses 2026", rank: i + 1, share: `${25 - i * 5}%` },
      { keyword: "bridesmaid dresses", rank: i + 2, share: `${20 - i * 4}%` },
      { keyword: "affordable prom dresses", rank: i + 3, share: `${15 - i * 3}%` },
    ],
    socialActivity: [
      { platform: "Instagram", followers: Math.floor(Math.random() * 500000) + 100000, postFreq: "2-3次/天", engagement: `${(Math.random() * 5 + 1).toFixed(1)}%` },
      { platform: "TikTok", followers: Math.floor(Math.random() * 800000) + 200000, postFreq: "1-2次/天", engagement: `${(Math.random() * 8 + 2).toFixed(1)}%` },
      { platform: "Pinterest", followers: Math.floor(Math.random() * 300000) + 50000, postFreq: "5-10次/周", engagement: `${(Math.random() * 3 + 0.5).toFixed(1)}%` },
    ],
  }));
}

/**
 * 获取竞品商品与定价策略
 */
export async function fetchCompetitorMerchandising(): Promise<CompetitorMerchandising[]> {
  // TODO: 接入爬虫或第三方电商监控 API
  return BRANDS.map((brand) => ({
    brand,
    newSKUs: {
      thisWeek: Math.floor(Math.random() * 50) + 10,
      lastWeek: Math.floor(Math.random() * 50) + 10,
      trend: Math.random() > 0.5 ? "↑" : "↓",
    },
    priceDistribution: [
      { range: "$50-$100", count: Math.floor(Math.random() * 200) + 50, share: "15%" },
      { range: "$100-$150", count: Math.floor(Math.random() * 400) + 200, share: "35%" },
      { range: "$150-$200", count: Math.floor(Math.random() * 300) + 150, share: "28%" },
      { range: "$200+", count: Math.floor(Math.random() * 250) + 100, share: "22%" },
    ],
    topProducts: [
      { name: "A-Line Sequin Prom Dress", price: "$159.99", stockStatus: "低库存" },
      { name: "Off-Shoulder Mermaid Gown", price: "$189.99", stockStatus: "充足" },
      { name: "Floral Bridesmaid Dress", price: "$129.99", stockStatus: "仅剩 3 件" },
    ],
    promotionActivity: [
      { type: "全场满减", discount: "满 $200 减 $30", frequency: "每月 1-2 次", lastSeen: "3 天前" },
      { type: "新品折扣", discount: "新款 8.5 折", frequency: "每周", lastSeen: "1 天前" },
      { type: "清仓特卖", discount: "部分款 5 折", frequency: "季节性", lastSeen: "7 天前" },
    ],
  }));
}

/**
 * 获取竞品广告投流策略
 */
export async function fetchCompetitorAds(): Promise<CompetitorAds[]> {
  // TODO: 接入 Facebook Ad Library API
  return BRANDS.map((brand, i) => ({
    brand,
    activeAds: Math.floor(Math.random() * 100) + 20,
    adChange: `${Math.random() > 0.5 ? "+" : "-"}${Math.floor(Math.random() * 30) + 5}`,
    topCreatives: [
      {
        headline: "Prom 2026 Collection | Up to 40% Off",
        copy: "Find your dream prom dress. Free shipping on orders over $99. Shop now!",
        format: "视频 (15s)",
        countries: ["US", "CA", "UK"],
        runningDays: Math.floor(Math.random() * 30) + 5,
      },
      {
        headline: "Bridesmaid Dresses from $79",
        copy: "Affordable bridesmaid dresses in 150+ colors. Custom size available.",
        format: "轮播图 (5 张)",
        countries: ["US", "AU"],
        runningDays: Math.floor(Math.random() * 20) + 3,
      },
    ],
    keywords: ["Free Shipping", "Custom Size", "Fast Delivery", "Sale", "Trending Styles"],
    topCountries: [
      { country: "美国", share: `${60 + i * 2}%` },
      { country: "加拿大", share: `${15 - i}%` },
      { country: "英国", share: `${12 - i}%` },
      { country: "澳大利亚", share: `${8 - i}%` },
    ],
  }));
}

/**
 * 获取竞品用户反馈与声誉
 */
export async function fetchCompetitorReputation(): Promise<CompetitorReputation[]> {
  // TODO: 接入 Trustpilot API / 爬虫
  return BRANDS.map((brand, i) => ({
    brand,
    trustpilot: {
      score: Math.random() * 2 + 3,
      reviews: Math.floor(Math.random() * 50000) + 10000,
      change: Math.random() > 0.5 ? "+0.2" : "-0.1",
    },
    sentiment: {
      positive: Math.floor(Math.random() * 30) + 50,
      neutral: Math.floor(Math.random() * 20) + 20,
      negative: Math.floor(Math.random() * 20) + 5,
    },
    commonIssues: [
      { topic: "物流速度慢", mentions: Math.floor(Math.random() * 500) + 100, trend: "↑" },
      { topic: "尺码不准", mentions: Math.floor(Math.random() * 300) + 80, trend: "→" },
      { topic: "实物有色差", mentions: Math.floor(Math.random() * 200) + 50, trend: "↓" },
      { topic: "客服响应慢", mentions: Math.floor(Math.random() * 150) + 30, trend: "→" },
    ],
    topQuestions: [
      { question: "支持退换货吗？", frequency: Math.floor(Math.random() * 1000) + 500 },
      { question: "有大码/加大码吗？", frequency: Math.floor(Math.random() * 800) + 400 },
      { question: "实物和图片一样吗？", frequency: Math.floor(Math.random() * 700) + 300 },
      { question: "多久能收到货？", frequency: Math.floor(Math.random() * 900) + 600 },
    ],
  }));
}

/**
 * 获取完整竞品监控数据
 */
export async function fetchCompetitorData(): Promise<CompetitorData> {
  const [traffic, merchandising, ads, reputation] = await Promise.all([
    fetchCompetitorTraffic(),
    fetchCompetitorMerchandising(),
    fetchCompetitorAds(),
    fetchCompetitorReputation(),
  ]);

  return { traffic, merchandising, ads, reputation };
}
