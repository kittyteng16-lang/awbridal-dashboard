import { fetchProductDataByWindow } from "../lib/products";

async function test() {
  console.log("测试修复后的产品数据\n");
  console.log("=".repeat(60));
  
  const data = await fetchProductDataByWindow(30);
  
  console.log("\n[KPI 指标]");
  console.log("  浏览量:", data.kpi.views.value, `(${data.kpi.views.change})`);
  console.log("  加购数:", data.kpi.addToCarts.value, `(${data.kpi.addToCarts.change})`);
  console.log("  购买数:", data.kpi.purchases.value, `(${data.kpi.purchases.change})`);
  console.log("  客单价:", data.kpi.avgOrderValue.value, `(${data.kpi.avgOrderValue.change})`);
  
  console.log("\n[Top 10 产品 - 按真实购买数排序]");
  data.topProducts.slice(0, 10).forEach((p, i) => {
    console.log(`  ${i + 1}. SKU: ${p.sku}`);
    console.log(`     名称: ${p.name}`);
    console.log(`     浏览: ${p.views.toLocaleString()} | 加购: ${p.addToCarts} | 购买: ${p.purchases} | 收入: $${p.revenue.toLocaleString()}`);
    console.log(`     转化率: ${p.conversionRate}`);
  });
  
  console.log("\n[洞察]");
  data.insights.forEach((insight, i) => {
    console.log(`  ${i + 1}. [${insight.type}] ${insight.title}`);
    console.log(`     ${insight.description}`);
  });
  
  console.log("\n" + "=".repeat(60));
  console.log("总产品数:", data.topProducts.length);
}

test().catch(console.error);
