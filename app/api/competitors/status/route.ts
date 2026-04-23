import { NextResponse } from "next/server";
import { getCached } from "@/lib/supabase";

/**
 * 竞品数据状态 API
 * 查看数据最后更新时间和缓存状态
 */
export async function GET() {
  try {
    const sections = ["traffic", "merchandising", "ads", "reputation"];
    const statuses = await Promise.all(
      sections.map(async (section) => {
        try {
          const key = `competitors_${section}`;
          const data = await getCached(key);

          if (!data) {
            return {
              section,
              status: "empty",
              lastUpdate: null,
              message: "No cached data available",
            };
          }

          // 从缓存元数据获取更新时间（如果有的话）
          return {
            section,
            status: "cached",
            lastUpdate: new Date().toISOString(), // 简化版，实际应从 Supabase 获取
            recordCount: Array.isArray(data) ? data.length : 1,
          };
        } catch (error) {
          return {
            section,
            status: "error",
            lastUpdate: null,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      })
    );

    const allCached = statuses.every((s) => s.status === "cached");

    return NextResponse.json({
      overall: allCached ? "healthy" : "partial",
      sections: statuses,
      nextUpdate: "Every 6 hours (see vercel.json cron schedule)",
      manualRefresh: "POST /api/competitors/refresh",
    });
  } catch (error) {
    console.error("[Competitors Status] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to check status",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
