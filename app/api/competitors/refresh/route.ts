import { NextRequest, NextResponse } from "next/server";
import { fetchCompetitorData } from "@/lib/competitors";
import { setCached } from "@/lib/supabase";

/**
 * 竞品数据刷新 API
 * 手动触发或通过 Cron 定时更新
 */
export async function POST(request: NextRequest) {
  try {
    // 验证请求（可选：添加 API Key 或 Cron Secret 验证）
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[Competitors API] Starting data refresh...");

    // 获取最新竞品数据
    const data = await fetchCompetitorData();

    // 缓存到 Supabase
    await Promise.all([
      setCached("competitors_traffic", data.traffic),
      setCached("competitors_merchandising", data.merchandising),
      setCached("competitors_ads", data.ads),
      setCached("competitors_reputation", data.reputation),
    ]);

    console.log("[Competitors API] Data refresh completed");

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        traffic: data.traffic.length,
        merchandising: data.merchandising.length,
        ads: data.ads.length,
        reputation: data.reputation.length,
      },
    });
  } catch (error) {
    console.error("[Competitors API] Refresh failed:", error);
    return NextResponse.json(
      {
        error: "Failed to refresh competitor data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * 获取竞品数据缓存状态
 */
export async function GET() {
  return NextResponse.json({
    message: "Competitor monitoring API",
    endpoints: {
      refresh: "POST /api/competitors/refresh",
      status: "GET /api/competitors/status",
    },
    usage: "Use POST with Authorization: Bearer {CRON_SECRET} to refresh data",
  });
}
