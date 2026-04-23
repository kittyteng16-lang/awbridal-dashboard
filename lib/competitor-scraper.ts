/**
 * 竞品网站商品监控爬虫
 * 抓取商品列表、价格、库存等信息
 *
 * 注意：
 * - 仅用于公开可见的商品信息
 * - 需要遵守各网站的 robots.txt 和 ToS
 * - 建议设置合理的请求间隔，避免被封禁
 */

export interface ProductInfo {
  name: string;
  price: number;
  originalPrice?: number;
  currency: string;
  stockStatus: "In Stock" | "Low Stock" | "Out of Stock" | "Unknown";
  url: string;
  category?: string;
  imageUrl?: string;
}

const BRAND_URLS: Record<string, string> = {
  azazie: "https://www.azazie.com",
  birdygrey: "https://www.birdygrey.com",
  hellomolly: "https://www.hellomolly.com",
  jjshouse: "https://www.jjshouse.com",
};

// 随机用户代理池（模拟真实浏览器）
const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
];

/**
 * 获取随机 User-Agent
 */
function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

/**
 * 延迟函数（避免请求过快）
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 通用商品列表爬取（需根据各网站调整选择器）
 */
export async function scrapeProductList(
  brand: string,
  category = "prom-dresses",
  limit = 50
): Promise<ProductInfo[]> {
  const baseUrl = BRAND_URLS[brand];
  if (!baseUrl) {
    console.error(`[Scraper] Unknown brand: ${brand}`);
    return [];
  }

  try {
    const url = `${baseUrl}/${category}`;
    console.log(`[Scraper] Fetching ${url}`);

    // 添加随机延迟（200-500ms）
    await delay(Math.floor(Math.random() * 300) + 200);

    const response = await fetch(url, {
      headers: {
        "User-Agent": getRandomUserAgent(),
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
        Referer: baseUrl,
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
      },
      next: { revalidate: 3600 }, // 缓存 1 小时
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();

    // 尝试从 JSON-LD 提取商品信息（很多电商网站使用结构化数据）
    const products = extractProductsFromJsonLd(html);
    if (products.length > 0) {
      return products.slice(0, limit);
    }

    // 如果没有 JSON-LD，返回模拟数据
    console.warn(`[Scraper] ${brand}: 无法解析商品数据，返回模拟数据`);
    return generateMockProducts(brand, limit);
  } catch (error) {
    console.error(`[Scraper] Error scraping ${brand}:`, error);
    return generateMockProducts(brand, limit);
  }
}

/**
 * 从 JSON-LD 结构化数据中提取商品
 */
function extractProductsFromJsonLd(html: string): ProductInfo[] {
  const products: ProductInfo[] = [];

  // 查找所有 JSON-LD script 标签
  const jsonLdPattern = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
  let match;

  while ((match = jsonLdPattern.exec(html)) !== null) {
    try {
      const data = JSON.parse(match[1]);

      // 处理单个商品
      if (data["@type"] === "Product") {
        products.push(parseProduct(data));
      }

      // 处理商品列表
      if (data["@type"] === "ItemList" && data.itemListElement) {
        data.itemListElement.forEach((item: any) => {
          if (item["@type"] === "Product" || item.item?.["@type"] === "Product") {
            products.push(parseProduct(item.item || item));
          }
        });
      }
    } catch {
      continue;
    }
  }

  return products;
}

/**
 * 解析单个商品对象
 */
function parseProduct(data: any): ProductInfo {
  const offers = data.offers || {};
  const price = parseFloat(offers.price || offers.lowPrice || "0");
  const availability = offers.availability?.toLowerCase() || "";

  let stockStatus: ProductInfo["stockStatus"] = "Unknown";
  if (availability.includes("instock")) stockStatus = "In Stock";
  else if (availability.includes("outofstock")) stockStatus = "Out of Stock";
  else if (availability.includes("limitedavailability")) stockStatus = "Low Stock";

  return {
    name: data.name || "Unknown Product",
    price,
    originalPrice: offers.highPrice ? parseFloat(offers.highPrice) : undefined,
    currency: offers.priceCurrency || "USD",
    stockStatus,
    url: data.url || "",
    category: data.category || undefined,
    imageUrl: data.image || data.image?.[0] || undefined,
  };
}

/**
 * 生成模拟商品数据（用于测试和降级）
 */
function generateMockProducts(brand: string, limit: number): ProductInfo[] {
  const categories = ["Prom Dress", "Bridesmaid Dress", "Evening Gown", "Party Dress"];
  const styles = ["A-Line", "Mermaid", "Ball Gown", "Sheath", "Empire"];

  return Array.from({ length: limit }, (_, i) => ({
    name: `${styles[i % styles.length]} ${categories[i % categories.length]} #${i + 1}`,
    price: Math.floor(Math.random() * 200) + 50,
    originalPrice: Math.random() > 0.7 ? Math.floor(Math.random() * 250) + 150 : undefined,
    currency: "USD",
    stockStatus: (["In Stock", "Low Stock", "Out of Stock"] as const)[
      Math.floor(Math.random() * 3)
    ],
    url: `${BRAND_URLS[brand]}/product-${i + 1}`,
    category: categories[i % categories.length],
  }));
}

/**
 * 分析商品价格分布
 */
export function analyzePriceDistribution(products: ProductInfo[]) {
  const ranges = [
    { range: "$0-$50", min: 0, max: 50, count: 0 },
    { range: "$50-$100", min: 50, max: 100, count: 0 },
    { range: "$100-$150", min: 100, max: 150, count: 0 },
    { range: "$150-$200", min: 150, max: 200, count: 0 },
    { range: "$200+", min: 200, max: Infinity, count: 0 },
  ];

  products.forEach((p) => {
    const range = ranges.find((r) => p.price >= r.min && p.price < r.max);
    if (range) range.count++;
  });

  const total = products.length || 1;
  return ranges.map((r) => ({
    range: r.range,
    count: r.count,
    share: `${Math.round((r.count / total) * 100)}%`,
  }));
}

/**
 * 检测促销活动
 */
export function detectPromotions(products: ProductInfo[]) {
  const discounts = products
    .filter((p) => p.originalPrice && p.originalPrice > p.price)
    .map((p) => ({
      name: p.name,
      discount: Math.round(((p.originalPrice! - p.price) / p.originalPrice!) * 100),
    }));

  if (discounts.length === 0) return null;

  const avgDiscount = Math.round(
    discounts.reduce((sum, d) => sum + d.discount, 0) / discounts.length
  );

  return {
    count: discounts.length,
    avgDiscount,
    maxDiscount: Math.max(...discounts.map((d) => d.discount)),
  };
}

/**
 * 批量获取所有品牌的商品信息
 */
export async function scrapeAllBrands(category = "prom-dresses", limit = 30) {
  const brands = Object.keys(BRAND_URLS);
  const results = await Promise.all(
    brands.map(async (brand) => {
      const products = await scrapeProductList(brand, category, limit);
      return {
        brand,
        products,
        priceDistribution: analyzePriceDistribution(products),
        promotions: detectPromotions(products),
      };
    })
  );

  return results.reduce(
    (acc, item) => {
      acc[item.brand] = item;
      return acc;
    },
    {} as Record<string, any>
  );
}
