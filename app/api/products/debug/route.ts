import { NextResponse } from "next/server";
import { fetchProductDataByWindow } from "@/lib/products";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const range = searchParams.get("range") || "30d";
  const debug = searchParams.get("debug") === "true";

  try {
    const days = range === "7d" ? 7 : range === "90d" ? 90 : range === "1y" ? 365 : 30;

    // 如果开启 debug，测试多种查询方式
    if (debug) {
      const { matonPost } = await import("@/lib/maton");
      const PROPERTY = process.env.GA4_PROPERTY_ID ?? "254101518";
      const GA4_PATH = `/google-analytics-data/v1beta/properties/${PROPERTY}:runReport`;

      const results: any = {
        propertyId: PROPERTY,
        tests: []
      };

      // 测试 1: 原始电商维度
      try {
        const test1Body = {
          dateRanges: [{ startDate: `${days}daysAgo`, endDate: "yesterday" }],
          dimensions: [{ name: "itemName" }, { name: "itemId" }],
          metrics: [{ name: "itemViews" }, { name: "addToCarts" }],
          limit: 5,
        };
        const res1 = await matonPost(GA4_PATH, test1Body);
        results.tests.push({
          name: "itemName + itemId",
          success: true,
          rowCount: res1.rows?.length || 0,
          sample: res1.rows?.slice(0, 2)
        });
      } catch (e: any) {
        results.tests.push({
          name: "itemName + itemId",
          success: false,
          error: e.message || String(e)
        });
      }

      // 测试 2: pagePath 查询
      try {
        const test2Body = {
          dateRanges: [{ startDate: `${days}daysAgo`, endDate: "yesterday" }],
          dimensions: [{ name: "pagePath" }, { name: "pageTitle" }],
          metrics: [{ name: "screenPageViews" }],
          dimensionFilter: {
            filter: { fieldName: "pagePath", stringFilter: { matchType: "CONTAINS", value: "/products/" } }
          },
          orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
          limit: 10,
        };
        const res2 = await matonPost(GA4_PATH, test2Body);
        results.tests.push({
          name: "pagePath (contains /products/)",
          success: true,
          rowCount: res2.rows?.length || 0,
          sample: res2.rows?.slice(0, 3)
        });
      } catch (e: any) {
        results.tests.push({
          name: "pagePath (contains /products/)",
          success: false,
          error: e.message || String(e)
        });
      }

      // 测试 3: 所有 pagePath（不过滤）
      try {
        const test3Body = {
          dateRanges: [{ startDate: `${days}daysAgo`, endDate: "yesterday" }],
          dimensions: [{ name: "pagePath" }],
          metrics: [{ name: "screenPageViews" }],
          orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
          limit: 20,
        };
        const res3 = await matonPost(GA4_PATH, test3Body);
        results.tests.push({
          name: "All pagePath (top 20)",
          success: true,
          rowCount: res3.rows?.length || 0,
          sample: res3.rows?.slice(0, 10).map((r: any) => r.dimensionValues[0]?.value)
        });
      } catch (e: any) {
        results.tests.push({
          name: "All pagePath",
          success: false,
          error: e.message || String(e)
        });
      }

      return NextResponse.json(results);
    }

    const data = await fetchProductDataByWindow(days);

    // 检测是否为 Mock 数据
    const isMockData = data.topProducts.length === 2 &&
      data.topProducts[0].sku === "LFA25149CP" &&
      data.topProducts[0].views === 1234;

    return NextResponse.json({
      success: true,
      range,
      days,
      isMockData,
      totalProducts: data.topProducts.length,
      kpiSummary: {
        views: data.kpi.views.value,
        addToCarts: data.kpi.addToCarts.value,
        purchases: data.kpi.purchases.value,
      },
      first5Products: data.topProducts.slice(0, 5).map(p => ({
        sku: p.sku,
        name: p.name,
        views: p.views,
        purchases: p.purchases,
        revenue: p.revenue,
      })),
      hint: isMockData ? "当前返回的是模拟数据，说明 GA4 API 调用失败或无电商事件数据" : null,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: String(error),
    }, { status: 500 });
  }
}
