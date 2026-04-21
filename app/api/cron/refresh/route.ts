import { NextRequest, NextResponse } from "next/server";
import { fetchTrafficData, fetchOverviewHealth } from "@/lib/ga4";
import { fetchSEOData } from "@/lib/gsc";
import { setCached } from "@/lib/supabase";
import type { OverviewData } from "@/types/dashboard";

export const dynamic = "force-dynamic";

// Vercel Cron 每天 02:00 UTC 调用，刷新所有缓存
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [traffic, seo, health] = await Promise.all([
    fetchTrafficData(),
    fetchSEOData(),
    fetchOverviewHealth(),
  ]);

  const overview: OverviewData = {
    kpi: {
      pv:            traffic.kpi.pv,
      uv:            traffic.kpi.uv,
      organicClicks: seo.kpi.clicks,
      avgPosition:   seo.kpi.position,
    },
    trend:   traffic.trend,
    sources: traffic.sources,
    health,
  };

  await Promise.all([
    setCached("traffic",  traffic),
    setCached("seo",      seo),
    setCached("overview", overview),
  ]);

  return NextResponse.json({ ok: true, refreshed: ["traffic", "seo", "overview"] });
}
