import { matonPost } from "../lib/maton";

const PROPERTY = "254101518";
const GA4_PATH = `/google-analytics-data/v1beta/properties/${PROPERTY}:runReport`;

async function test() {
  console.log("测试电商事件数据（Property: " + PROPERTY + "）\n");

  // 测试 1: 购买事件（按产品）
  console.log("[1] 测试 purchase 事件（itemName + itemsPurchased）");
  try {
    const res: any = await matonPost(GA4_PATH, {
      dateRanges: [{ startDate: "30daysAgo", endDate: "yesterday" }],
      dimensions: [{ name: "itemName" }, { name: "itemId" }],
      metrics: [{ name: "itemsPurchased" }, { name: "itemRevenue" }],
      orderBys: [{ metric: { metricName: "itemsPurchased" }, desc: true }],
      limit: 10,
    });
    console.log("✅ 成功！", res.rows?.length || 0, "个产品\n");
    if (res.rows?.length > 0) {
      res.rows.slice(0, 5).forEach((r: any, i: number) => {
        console.log(`  ${i+1}. ${r.dimensionValues[0]?.value || ""} (ID: ${r.dimensionValues[1]?.value || ""})`);
        console.log(`     购买: ${r.metricValues[0]?.value} | 收入: $${r.metricValues[1]?.value}`);
      });
    }
  } catch (e: any) {
    console.log("❌ 失败:", e.message?.split("\n")[0] || e, "\n");
  }

  // 测试 2: 按 pagePath 统计购买
  console.log("[2] 测试按页面路径统计购买（ecommercePurchases）");
  try {
    const res: any = await matonPost(GA4_PATH, {
      dateRanges: [{ startDate: "30daysAgo", endDate: "yesterday" }],
      dimensions: [{ name: "pagePath" }],
      metrics: [{ name: "screenPageViews" }, { name: "ecommercePurchases" }],
      dimensionFilter: {
        filter: { fieldName: "pagePath", stringFilter: { matchType: "ENDS_WITH", value: ".html" } },
      },
      orderBys: [{ metric: { metricName: "ecommercePurchases" }, desc: true }],
      limit: 15,
    });
    console.log("✅ 成功！", res.rows?.length || 0, "个页面\n");
    if (res.rows?.length > 0) {
      console.log("Top 10 产品页（按购买数排序）：");
      res.rows.slice(0, 10).forEach((r: any, i: number) => {
        const path = r.dimensionValues[0]?.value || "";
        const views = r.metricValues[0]?.value || "0";
        const purchases = r.metricValues[1]?.value || "0";
        const sku = path.match(/-([A-Z0-9]+)\.html$/)?.[1] || "?";
        console.log(`  ${i+1}. SKU: ${sku} - 浏览: ${views}, 购买: ${purchases}`);
      });
    }
  } catch (e: any) {
    console.log("❌ 失败:", e.message?.split("\n")[0] || e, "\n");
  }

  // 测试 3: 总体指标
  console.log("\n[3] 总体电商指标");
  try {
    const res: any = await matonPost(GA4_PATH, {
      dateRanges: [{ startDate: "30daysAgo", endDate: "yesterday" }],
      metrics: [
        { name: "addToCarts" },
        { name: "ecommercePurchases" },
        { name: "totalRevenue" },
      ],
    });
    if (res.rows?.[0]) {
      const r = res.rows[0];
      console.log(`  加购数: ${r.metricValues[0]?.value}`);
      console.log(`  购买数: ${r.metricValues[1]?.value}`);
      console.log(`  总收入: $${r.metricValues[2]?.value}`);
    }
  } catch (e: any) {
    console.log("❌", e.message?.split("\n")[0] || e);
  }
}

test().catch(console.error);
