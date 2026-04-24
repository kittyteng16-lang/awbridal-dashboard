import { NextResponse } from "next/server";
import { matonPost } from "@/lib/maton";

export const dynamic = "force-dynamic";

export async function GET() {
  const PROPERTY = process.env.GA4_PROPERTY_ID ?? "254101518";
  const GA4_PATH = `/google-analytics-data/v1beta/properties/${PROPERTY}:runReport`;

  try {
    // 测试真实电商数据
    const res: any = await matonPost(GA4_PATH, {
      dateRanges: [{ startDate: "30daysAgo", endDate: "yesterday" }],
      dimensions: [{ name: "itemName" }, { name: "itemId" }],
      metrics: [
        { name: "itemsViewed" },
        { name: "itemsAddedToCart" },
        { name: "itemsPurchased" },
        { name: "itemRevenue" },
      ],
      orderBys: [{ metric: { metricName: "itemsPurchased" }, desc: true }],
      limit: 20,
    });

    const products = (res.rows || []).map((row: any) => ({
      itemName: row.dimensionValues[0]?.value || "",
      itemId: row.dimensionValues[1]?.value || "",
      views: row.metricValues[0]?.value || "0",
      addToCarts: row.metricValues[1]?.value || "0",
      purchases: row.metricValues[2]?.value || "0",
      revenue: row.metricValues[3]?.value || "0",
    }));

    return NextResponse.json({
      success: true,
      propertyId: PROPERTY,
      totalProducts: products.length,
      timestamp: new Date().toISOString(),
      top10Products: products.slice(0, 10),
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || String(error),
      propertyId: PROPERTY,
    }, { status: 500 });
  }
}
