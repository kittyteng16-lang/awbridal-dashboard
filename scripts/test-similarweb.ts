/**
 * SimilarWeb API 测试脚本
 * 用于验证 API Key 配置和数据获取
 *
 * 运行: npx tsx scripts/test-similarweb.ts
 */

import { fetchCompetitorAnalysis } from "../lib/similarweb";

const TEST_DOMAINS = [
  "www.azazie.com",
  "www.birdygrey.com",
  "www.hellomolly.com",
  "www.jjshouse.com",
];

async function testSimilarWeb() {
  console.log("=".repeat(60));
  console.log("SimilarWeb API 配置测试");
  console.log("=".repeat(60));

  // 检查 API Key
  const apiKey = process.env.SIMILARWEB_API_KEY;
  if (!apiKey) {
    console.error("\n❌ SIMILARWEB_API_KEY 环境变量未配置");
    console.log("\n配置步骤：");
    console.log("1. 访问 https://account.similarweb.com/api-management");
    console.log("2. 创建 API Key");
    console.log("3. 添加到 Vercel 环境变量或 .env.local 文件");
    console.log("\n详见: SIMILARWEB_SETUP.md");
    return;
  }

  console.log("\n✅ API Key 已配置");
  console.log(`   Key: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}`);

  // 测试单个域名
  const testDomain = TEST_DOMAINS[0];
  console.log(`\n📊 测试域名: ${testDomain}`);
  console.log("-".repeat(60));

  try {
    const data = await fetchCompetitorAnalysis(testDomain);

    if (!data) {
      console.error("❌ 未返回数据");
      return;
    }

    console.log("\n✅ 数据获取成功！");

    // 流量数据
    if (data.traffic?.visits) {
      const latest = data.traffic.visits[data.traffic.visits.length - 1];
      console.log("\n📈 流量数据:");
      console.log(`   最新月份: ${latest?.date}`);
      console.log(`   访问量: ${latest?.visits?.toLocaleString()}`);
    } else {
      console.log("\n⚠️  流量数据未返回");
    }

    // 流量来源
    if (data.sources?.visits) {
      const sources = Object.values(data.sources.visits);
      const latest = sources[sources.length - 1] as any;
      console.log("\n🔀 流量来源:");
      console.log(`   Direct: ${((latest?.[0]?.direct || 0) * 100).toFixed(1)}%`);
      console.log(`   Search: ${((latest?.[0]?.search || 0) * 100).toFixed(1)}%`);
      console.log(`   Social: ${((latest?.[0]?.social || 0) * 100).toFixed(1)}%`);
      console.log(`   Paid: ${((latest?.[0]?.paid_referrals || 0) * 100).toFixed(1)}%`);
    } else {
      console.log("\n⚠️  流量来源数据未返回");
    }

    // 关键词
    if (data.organicKeywords?.search) {
      console.log("\n🔑 热门关键词:");
      data.organicKeywords.search.slice(0, 5).forEach((kw: any, i: number) => {
        console.log(`   ${i + 1}. ${kw.search_term} (${(kw.score * 100).toFixed(1)}%)`);
      });
    } else {
      console.log("\n⚠️  关键词数据未返回");
    }

    // 热门页面
    if (data.popularPages?.popular_pages) {
      console.log("\n📄 热门页面:");
      data.popularPages.popular_pages.slice(0, 5).forEach((page: any, i: number) => {
        console.log(`   ${i + 1}. ${page.page} (${(page.share * 100).toFixed(1)}%)`);
      });
    } else {
      console.log("\n⚠️  热门页面数据未返回");
    }

    console.log("\n" + "=".repeat(60));
    console.log("✅ 测试完成！SimilarWeb API 配置正确");
    console.log("=".repeat(60));
  } catch (error: any) {
    console.error("\n❌ 测试失败:");
    console.error(`   ${error.message}`);

    if (error.message.includes("401")) {
      console.log("\n💡 解决方案：");
      console.log("   - 检查 API Key 是否正确");
      console.log("   - 确认 API Key 未过期");
      console.log("   - 访问 https://account.similarweb.com/ 查看订阅状态");
    } else if (error.message.includes("429")) {
      console.log("\n💡 解决方案：");
      console.log("   - 已超出每日 API 请求配额");
      console.log("   - 等待 24 小时后重试");
      console.log("   - 或升级订阅计划");
    } else if (error.message.includes("404")) {
      console.log("\n💡 解决方案：");
      console.log("   - 检查域名格式（应为 www.example.com）");
      console.log("   - 确认该域名在 SimilarWeb 有足够数据");
    }

    console.log("\n详细错误信息:");
    console.error(error);
  }
}

// 运行测试
testSimilarWeb().catch(console.error);
