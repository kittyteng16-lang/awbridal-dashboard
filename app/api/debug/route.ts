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

  try {
    const r = await fetch("https://www.reddit.com/r/weddingplanning/top/.rss?t=month&limit=3", {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
      cache: "no-store",
    });
    const text = await r.text();
    const titles = [...text.matchAll(/<title>([\s\S]*?)<\/title>/g)].slice(1, 4).map(m => m[1]);
    results.reddit = { ok: r.ok, status: r.status, titles };
  } catch (e) {
    results.reddit = { ok: false, error: String(e) };
  }

  return NextResponse.json(results);
}
