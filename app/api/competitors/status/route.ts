import { NextResponse } from "next/server";
import { getCached } from "@/lib/supabase";

/**
 * 竞品数据状态 API
 * 查看数据最后更新时间、缓存状态和 API 配置
 */
export async function GET() {
  try {
    // 检查 API 配置状态
    const apiStatus = {
      similarweb: {
        configured: !!process.env.SIMILARWEB_API_KEY,
        status: process.env.SIMILARWEB_API_KEY ? "ready" : "missing",
        message: process.env.SIMILARWEB_API_KEY
          ? "SimilarWeb API Key 已配置，将使用真实流量数据"
          : "SimilarWeb API Key 未配置，使用模拟数据。请访问 SIMILARWEB_SETUP.md 查看配置指南",
      },
      trustpilot: {
        configured: true,
        status: "ready",
        message: "Trustpilot 爬虫已启用",
      },
      facebookAds: {
        configured: false,
        status: "pending",
        message: "Facebook Ad Library API 待接入",
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
      apiIntegrations: apiStatus,
      dataSections: statuses,
      nextUpdate: "Every 6 hours (see vercel.json cron schedule)",
      manualRefresh: "POST /api/competitors/refresh",
      documentation: "/SIMILARWEB_SETUP.md",
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
