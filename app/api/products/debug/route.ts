import { NextResponse } from "next/server";
import { fetchProductDataByWindow } from "@/lib/products";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const range = searchParams.get("range") || "30d";

  try {
    const days = range === "7d" ? 7 : range === "90d" ? 90 : range === "1y" ? 365 : 30;
    const data = await fetchProductDataByWindow(days);

    return NextResponse.json({
      success: true,
      range,
      days,
      totalProducts: data.topProducts.length,
      kpiSummary: {
        views: data.kpi.views.value,
        addToCarts: data.kpi.addToCarts.value,
        purchases: data.kpi.purchases.value,
      },
      first5Products: data.topProducts.slice(0, 5).map(p => ({
        sku: p.sku,
        name: p.name,
        views: p.views,
        purchases: p.purchases,
        revenue: p.revenue,
      })),
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: String(error),
    }, { status: 500 });
  }
}
