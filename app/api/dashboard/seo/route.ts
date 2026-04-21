import { NextResponse } from "next/server";
import { fetchSEOData } from "@/lib/gsc";
import { getCached, setCached } from "@/lib/supabase";
import type { SEOData } from "@/types/dashboard";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cached = await getCached<SEOData>("seo");
    if (cached) return NextResponse.json(cached);

    const data = await fetchSEOData();
    await setCached("seo", data);
    return NextResponse.json(data);
  } catch (err) {
    console.error("[/api/dashboard/seo]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
