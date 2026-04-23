import { resolveDateRange } from "@/lib/date-range";
import { fetchProductDataByWindow } from "@/lib/products";
import ProductsPageClient from "./client-page";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; start?: string; end?: string }>;
}) {
  const params = await searchParams;
  const resolved = resolveDateRange(params, "30d");

  const data = await fetchProductDataByWindow(
    resolved.days,
    resolved.start && resolved.end ? { start: resolved.start, end: resolved.end } : undefined
  );

  return <ProductsPageClient initialData={data} timeLabel={resolved.label} />;
}
