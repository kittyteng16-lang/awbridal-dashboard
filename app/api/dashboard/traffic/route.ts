import { NextResponse } from "next/server";
import { fetchTrafficData } from "@/lib/ga4";
import { getCached, setCached } from "@/lib/supabase";
import type { TrafficData } from "@/types/dashboard";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cached = await getCached<TrafficData>("traffic");
    if (cached) return NextResponse.json(cached);

    const data = await fetchTrafficData();
    await setCached("traffic", data);
    return NextResponse.json(data);
  } catch (err) {
    console.error("[/api/dashboard/traffic]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
