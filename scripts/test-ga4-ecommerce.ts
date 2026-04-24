/**
 * 测试 GA4 电商事件数据
 * 检查是否有 purchase、add_to_cart 等真实事件
 */

import { matonPost } from "../lib/maton";

const PROPERTY = process.env.GA4_PROPERTY_ID ?? "106825692";
const GA4_PATH = `/google-analytics-data/v1beta/properties/${PROPERTY}:runReport`;

async function testEcommerceEvents() {
  console.log("测试 GA4 Property:", PROPERTY);
  console.log("=".repeat(60));

  // 测试 1: purchase 事件 + itemName
  console.log("\n[测试 1] 查询 purchase 事件（按产品）");
  try {
    const res1: any = await matonPost(GA4_PATH, {
      dateRanges: [{ startDate: "30daysAgo", endDate: "yesterday" }],
      dimensions: [{ name: "itemName" }, { name: "itemId" }],
      metrics: [
        { name: "itemsPurchased" },
        { name: "itemRevenue" },
        { name: "itemsViewed" },
      ],
      orderBys: [{ metric: { metricName: "itemsPurchased" }, desc: true }],
      limit: 10,
    });
    console.log("✅ 成功！找到", res1.rows?.length || 0, "个产品");
    if (res1.rows?.length > 0) {
      console.log("Top 3 产品（按购买数排序）：");
      res1.rows.slice(0, 3).forEach((row: any, i: number) => {
        const itemName = row.dimensionValues[0]?.value || "";
        const itemId = row.dimensionValues[1]?.value || "";
        const purchased = row.metricValues[0]?.value || "0";
        const revenue = row.metricValues[1]?.value || "0";
        const viewed = row.metricValues[2]?.value || "0";
        console.log(`  ${i + 1}. ${itemName} (${itemId})`);
        console.log(`     购买: ${purchased} | 收入: $${revenue} | 浏览: ${viewed}`);
      });
    }
  } catch (e: any) {
    console.log("❌ 失败:", e.message);
  }

  // 测试 2: add_to_cart 事件
  console.log("\n[测试 2] 查询 add_to_cart 事件");
  try {
    const res2: any = await matonPost(GA4_PATH, {
      dateRanges: [{ startDate: "30daysAgo", endDate: "yesterday" }],
      dimensions: [{ name: "itemName" }],
      metrics: [{ name: "addToCarts" }],
      orderBys: [{ metric: { metricName: "addToCarts" }, desc: true }],
      limit: 5,
    });
    console.log("✅ 成功！找到", res2.rows?.length || 0, "个产品");
    if (res2.rows?.length > 0) {
      console.log("Top 3 加购产品：");
      res2.rows.slice(0, 3).forEach((row: any, i: number) => {
        const itemName = row.dimensionValues[0]?.value || "";
        const addToCarts = row.metricValues[0]?.value || "0";
        console.log(`  ${i + 1}. ${itemName} - 加购: ${addToCarts}`);
      });
    }
  } catch (e: any) {
    console.log("❌ 失败:", e.message);
  }

  // 测试 3: 按 URL 统计购买转化
  console.log("\n[测试 3] 按页面路径统计购买转化");
  try {
    const res3: any = await matonPost(GA4_PATH, {
      dateRanges: [{ startDate: "30daysAgo", endDate: "yesterday" }],
      dimensions: [{ name: "pagePath" }],
      metrics: [
        { name: "screenPageViews" },
        { name: "ecommercePurchases" },
      ],
      dimensionFilter: {
        filter: {
          fieldName: "pagePath",
          stringFilter: { matchType: "ENDS_WITH", value: ".html" },
        },
      },
      orderBys: [{ metric: { metricName: "ecommercePurchases" }, desc: true }],
      limit: 10,
    });
    console.log("✅ 成功！找到", res3.rows?.length || 0, "个页面");
    if (res3.rows?.length > 0) {
      console.log("Top 5 产品页（按购买数排序）：");
      res3.rows.slice(0, 5).forEach((row: any, i: number) => {
        const path = row.dimensionValues[0]?.value || "";
        const views = row.metricValues[0]?.value || "0";
        const purchases = row.metricValues[1]?.value || "0";
        const convRate = parseInt(views) > 0 ? ((parseInt(purchases) / parseInt(views)) * 100).toFixed(2) : "0.00";
        console.log(`  ${i + 1}. ${path}`);
        console.log(`     浏览: ${views} | 购买: ${purchases} | 转化率: ${convRate}%`);
      });
    }
  } catch (e: any) {
    console.log("❌ 失败:", e.message);
  }

  // 测试 4: 总体电商指标
  console.log("\n[测试 4] 总体电商指标");
  try {
    const res4: any = await matonPost(GA4_PATH, {
      dateRanges: [{ startDate: "30daysAgo", endDate: "yesterday" }],
      metrics: [
        { name: "screenPageViews" },
        { name: "addToCarts" },
        { name: "ecommercePurchases" },
        { name: "totalRevenue" },
      ],
    });
    if (res4.rows?.length > 0) {
      const row = res4.rows[0];
      const views = row.metricValues[0]?.value || "0";
      const addToCarts = row.metricValues[1]?.value || "0";
      const purchases = row.metricValues[2]?.value || "0";
      const revenue = row.metricValues[3]?.value || "0";
      console.log("✅ 成功！");
      console.log(`  总浏览量: ${parseInt(views).toLocaleString()}`);
      console.log(`  总加购数: ${parseInt(addToCarts).toLocaleString()}`);
      console.log(`  总购买数: ${parseInt(purchases).toLocaleString()}`);
      console.log(`  总收入: $${parseFloat(revenue).toLocaleString()}`);
    }
  } catch (e: any) {
    console.log("❌ 失败:", e.message);
  }

  console.log("\n" + "=".repeat(60));
  console.log("测试完成");
}

testEcommerceEvents().catch(console.error);
