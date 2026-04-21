import { NextResponse } from "next/server";
import { fetchTrafficData } from "@/lib/ga4";
import { fetchSEOData } from "@/lib/gsc";

export const dynamic = "force-dynamic";

export async function GET() {
  const results: Record<string, unknown> = {};

  try {
    const t = await fetchTrafficData();
    results.traffic = { ok: true, pvKpi: t.kpi.pv, trendLen: t.trend.length };
  } catch (e) {
    results.traffic = { ok: false, error: String(e) };
  }

  try {
    const s = await fetchSEOData();
    results.seo = { ok: true, clicks: s.kpi.clicks, keywordsLen: s.keywords.length };
  } catch (e) {
    results.seo = { ok: false, error: String(e) };
  }

  return NextResponse.json(results);
}
