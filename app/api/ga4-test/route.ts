import { NextResponse } from "next/server";
import { matonPost } from "@/lib/maton";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get("days") || "30");

  const PROPERTY = process.env.GA4_PROPERTY_ID ?? "254101518";
  const GA4_PATH = `/google-analytics-data/v1beta/properties/${PROPERTY}:runReport`;

  const results: any = {
    propertyId: PROPERTY,
    dateRange: `${days}daysAgo to yesterday`,
    tests: [],
  };

  // 测试 1: 电商维度 (itemName + itemId)
  try {
    const body1 = {
      dateRanges: [{ startDate: `${days}daysAgo`, endDate: "yesterday" }],
      dimensions: [{ name: "itemName" }, { name: "itemId" }],
      metrics: [{ name: "itemViews" }, { name: "addToCarts" }, { name: "itemsPurchased" }],
      limit: 10,
    };
    const res1 = await matonPost(GA4_PATH, body1);
    results.tests.push({
      id: 1,
      name: "E-commerce items (itemName + itemId)",
      success: true,
      rowCount: res1.rows?.length || 0,
      hasData: (res1.rows?.length || 0) > 0,
      sampleData: res1.rows?.slice(0, 3).map((r: any) => ({
        itemName: r.dimensionValues?.[0]?.value,
        itemId: r.dimensionValues?.[1]?.value,
        views: r.metricValues?.[0]?.value,
        addToCarts: r.metricValues?.[1]?.value,
        purchases: r.metricValues?.[2]?.value,
      })),
    });
  } catch (e: any) {
    results.tests.push({
      id: 1,
      name: "E-commerce items (itemName + itemId)",
      success: false,
      error: e.message || String(e),
    });
  }

  // 测试 2: 产品页面 (pagePath 包含 /products/)
  try {
    const body2 = {
      dateRanges: [{ startDate: `${days}daysAgo`, endDate: "yesterday" }],
      dimensions: [{ name: "pagePath" }, { name: "pageTitle" }],
      metrics: [{ name: "screenPageViews" }, { name: "totalUsers" }],
      dimensionFilter: {
        filter: {
          fieldName: "pagePath",
          stringFilter: { matchType: "CONTAINS", value: "/products/" },
        },
      },
      orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
      limit: 20,
    };
    const res2 = await matonPost(GA4_PATH, body2);
    results.tests.push({
      id: 2,
      name: 'Pages containing "/products/"',
      success: true,
      rowCount: res2.rows?.length || 0,
      hasData: (res2.rows?.length || 0) > 0,
      sampleData: res2.rows?.slice(0, 5).map((r: any) => ({
        path: r.dimensionValues?.[0]?.value,
        title: r.dimensionValues?.[1]?.value,
        views: r.metricValues?.[0]?.value,
        users: r.metricValues?.[1]?.value,
      })),
    });
  } catch (e: any) {
    results.tests.push({
      id: 2,
      name: 'Pages containing "/products/"',
      success: false,
      error: e.message || String(e),
    });
  }

  // 测试 3: 所有页面（Top 30）
  try {
    const body3 = {
      dateRanges: [{ startDate: `${days}daysAgo`, endDate: "yesterday" }],
      dimensions: [{ name: "pagePath" }],
      metrics: [{ name: "screenPageViews" }],
      orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
      limit: 30,
    };
    const res3 = await matonPost(GA4_PATH, body3);
    results.tests.push({
      id: 3,
      name: "All pages (top 30 by views)",
      success: true,
      rowCount: res3.rows?.length || 0,
      topPages: res3.rows?.slice(0, 15).map((r: any) => ({
        path: r.dimensionValues?.[0]?.value,
        views: r.metricValues?.[0]?.value,
      })),
    });
  } catch (e: any) {
    results.tests.push({
      id: 3,
      name: "All pages (top 30 by views)",
      success: false,
      error: e.message || String(e),
    });
  }

  // 测试 4: 事件维度（查看有哪些事件）
  try {
    const body4 = {
      dateRanges: [{ startDate: `${days}daysAgo`, endDate: "yesterday" }],
      dimensions: [{ name: "eventName" }],
      metrics: [{ name: "eventCount" }],
      orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
      limit: 20,
    };
    const res4 = await matonPost(GA4_PATH, body4);
    results.tests.push({
      id: 4,
      name: "All events (top 20)",
      success: true,
      rowCount: res4.rows?.length || 0,
      events: res4.rows?.slice(0, 10).map((r: any) => ({
        name: r.dimensionValues?.[0]?.value,
        count: r.metricValues?.[0]?.value,
      })),
    });
  } catch (e: any) {
    results.tests.push({
      id: 4,
      name: "All events",
      success: false,
      error: e.message || String(e),
    });
  }

  return NextResponse.json(results, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
