import { NextResponse } from "next/server";
import { fetchProductDataByWindow } from "@/lib/products";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const range = searchParams.get("range") || "30d";
  const debug = searchParams.get("debug") === "true";

  try {
    const days = range === "7d" ? 7 : range === "90d" ? 90 : range === "1y" ? 365 : 30;

    // 如果开启 debug，直接调用 GA4 API 看原始响应
    if (debug) {
      const { matonPost } = await import("@/lib/maton");
      const PROPERTY = process.env.GA4_PROPERTY_ID ?? "254101518";
      const GA4_PATH = `/google-analytics-data/v1beta/properties/${PROPERTY}:runReport`;

      const testBody = {
        dateRanges: [{ startDate: `${days}daysAgo`, endDate: "yesterday" }],
        dimensions: [{ name: "itemName" }, { name: "itemId" }, { name: "itemCategory" }],
        metrics: [
          { name: "itemViews" },
          { name: "addToCarts" },
          { name: "ecommercePurchases" },
          { name: "itemRevenue" },
        ],
        orderBys: [{ metric: { metricName: "itemRevenue" }, desc: true }],
        limit: 10,
      };

      try {
        const rawResponse = await matonPost(GA4_PATH, testBody);
        return NextResponse.json({
          success: true,
          debug: true,
          ga4Response: rawResponse,
          rowCount: rawResponse.rows?.length || 0,
        });
      } catch (ga4Error: any) {
        return NextResponse.json({
          success: false,
          debug: true,
          ga4Error: String(ga4Error),
          ga4ErrorDetails: ga4Error.message || ga4Error.toString(),
        }, { status: 500 });
      }
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
