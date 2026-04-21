import { NextResponse } from "next/server";
import { fetchTrafficData, fetchOverviewHealth } from "@/lib/ga4";
import { fetchSEOData } from "@/lib/gsc";
import { getCached, setCached } from "@/lib/supabase";
import type { OverviewData } from "@/types/dashboard";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cached = await getCached<OverviewData>("overview");
    if (cached) return NextResponse.json(cached);

    const [traffic, seo, health] = await Promise.all([
      fetchTrafficData(),
      fetchSEOData(),
      fetchOverviewHealth(),
    ]);

    const data: OverviewData = {
      kpi: {
        pv:             traffic.kpi.pv,
        uv:             traffic.kpi.uv,
        organicClicks:  seo.kpi.clicks,
        avgPosition:    seo.kpi.position,
      },
      trend: traffic.trend,
      sources: traffic.sources,
      health,
    };

    await setCached("overview", data);
    return NextResponse.json(data);
  } catch (err) {
    console.error("[/api/dashboard/overview]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
