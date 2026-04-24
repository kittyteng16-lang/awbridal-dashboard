import { NextResponse } from "next/server";
import { getCached } from "@/lib/supabase";

/**
 * 竞品数据状态 API
 * 查看数据最后更新时间、缓存状态和 API 配置
 */
export async function GET() {
  try {
    // 检查数据源状态
    const dataSourceStatus = {
      trustpilot: {
        type: "真实数据",
        status: "active",
        message: "通过爬虫获取竞品真实评价数据",
      },
      merchandising: {
        type: "真实数据",
        status: "active",
        message: "通过爬虫获取竞品商品和定价数据",
      },
      traffic: {
        type: "行业估算",
        status: "active",
        message: "使用行业平均数据和市场研究（SimilarWeb API 需付费订阅）",
      },
      ads: {
        type: "行业估算",
        status: "active",
        message: "使用行业估算数据（可通过 Facebook Ad Library 手动验证）",
      },
    };

    // 检查缓存数据状态
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

          return {
            section,
            status: "cached",
            lastUpdate: new Date().toISOString(),
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
      dataSources: dataSourceStatus,
      dataSections: statuses,
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
