# 竞品监控数据源配置指南

本文档说明如何配置竞品监控板块的各种数据源。

---

## 📊 数据源状态

| 数据源 | 状态 | 费用 | 配置难度 |
|--------|------|------|---------|
| ✅ Trustpilot | 已接入 | 免费 | 无需配置 |
| ✅ 商品爬虫 | 已接入 | 免费 | 无需配置 |
| ⚙️ Facebook Ad Library | 待配置 | 免费 | 简单 |
| ⚙️ SimilarWeb API | 待配置 | $200-500/月 | 中等 |

---

## 1. Facebook Ad Library API（免费）

### 获取 Access Token

1. **创建 Facebook 开发者账号**
   - 访问：https://developers.facebook.com/
   - 使用 Facebook 账号登录

2. **创建应用**
   - 点击 "My Apps" → "Create App"
   - 选择类型：**Business**
   - 填写应用信息：
     - App Name: `Competitor Monitor`
     - Contact Email: 你的邮箱
   - 创建完成

3. **获取 Access Token**
   - 进入应用 Dashboard
   - 左侧菜单：Tools → **Graph API Explorer**
   - 选择 Permissions：
     - `ads_read` - 读取广告数据
   - 点击 **Generate Access Token**
   - 复制生成的 Token（长字符串）

4. **配置到 Vercel**
   - 进入 Vercel 项目：https://vercel.com/your-project
   - Settings → Environment Variables
   - 添加变量：
     ```
     Name: FACEBOOK_ACCESS_TOKEN
     Value: 粘贴你的 Token
     ```
   - 保存后重新部署项目

### 验证是否生效

访问：`https://your-domain.vercel.app/api/competitors/status`

应该看到 Facebook 数据源状态为 "active"。

---

## 2. SimilarWeb API（付费）

### 订阅服务

1. **访问 SimilarWeb**
   - 网址：https://www.similarweb.com/corp/developer/
   - 选择适合的套餐（建议：Starter $200/月）

2. **获取 API Key**
   - 登录后台
   - API → Settings → API Key
   - 复制 API Key

3. **配置到 Vercel**
   ```
   Name: SIMILARWEB_API_KEY
   Value: 你的 API Key
   ```

### 免费替代方案

如果不想付费订阅，可以考虑：

- **手动补充数据**：定期在后台更新流量数据
- **使用 SEMrush API**：功能类似，价格 $120-450/月
- **Google Analytics（仅自己网站）**：已集成 GA4

---

## 3. Trustpilot（已自动接入）

✅ 无需配置，已通过爬虫自动获取公开评价数据。

**工作原理：**
- 每 6 小时自动抓取竞品 Trustpilot 页面
- 提取评分、评论数、用户评价
- 分析情感分布和常见问题

**监控品牌：**
- Azazie (www.azazie.com)
- Birdy Grey (www.birdygrey.com)
- Hello Molly (www.hellomolly.com)
- JJsHouse (www.jjshouse.com)

---

## 4. 商品爬虫（已自动接入）

✅ 无需配置，已通过智能爬虫监控商品价格和库存。

**工作原理：**
- 随机 User-Agent 池，模拟真实浏览器
- 请求延迟 200-500ms，避免触发反爬
- 自动降级：遇到 403/429 时切换到模拟数据
- 缓存 1 小时，减少请求压力

**提升爬虫成功率（进阶）：**

如果遇到频繁被封，可以考虑：

1. **使用代理池**
   ```typescript
   // 在 .env 添加
   PROXY_URL=http://your-proxy-service.com
   ```

2. **使用无头浏览器**
   - 安装 Playwright：`npm install playwright`
   - 修改 `lib/competitor-scraper.ts`

3. **使用第三方服务**
   - ScraperAPI: https://www.scraperapi.com/ ($49/月)
   - Apify: https://apify.com/ (按需付费)

---

## 自动更新配置

数据自动刷新由 **Vercel Cron Jobs** 控制：

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/competitors/refresh",
      "schedule": "0 */6 * * *"  // 每 6 小时
    }
  ]
}
```

### 修改更新频率

编辑 `vercel.json`：

```
"0 */3 * * *"   → 每 3 小时
"0 */12 * * *"  → 每 12 小时
"0 2 * * *"     → 每天凌晨 2 点
```

### 手动触发更新

```bash
curl -X POST https://your-domain.vercel.app/api/competitors/refresh \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

---

## 查看数据状态

访问 API 查看各数据源状态：

```
GET https://your-domain.vercel.app/api/competitors/status
```

返回示例：

```json
{
  "overall": "healthy",
  "sections": [
    {
      "section": "traffic",
      "status": "cached",
      "lastUpdate": "2026-04-23T03:00:00Z",
      "recordCount": 4
    },
    {
      "section": "reputation",
      "status": "cached",
      "lastUpdate": "2026-04-23T03:00:00Z",
      "recordCount": 4
    }
  ],
  "nextUpdate": "Every 6 hours",
  "manualRefresh": "POST /api/competitors/refresh"
}
```

---

## 故障排除

### 问题1：Trustpilot 返回 403

**原因：** 请求频率过高，触发反爬保护

**解决：**
1. 检查 Vercel Cron 是否重复执行
2. 增加缓存时间（修改 `next: { revalidate: 3600 }`）
3. 添加代理 IP

### 问题2：商品爬虫全部失败

**原因：** User-Agent 被识别或 IP 被封

**解决：**
1. 更新 User-Agent 池（`lib/competitor-scraper.ts`）
2. 使用代理服务
3. 检查目标网站是否更新了反爬策略

### 问题3：Facebook API 返回 401

**原因：** Access Token 过期或权限不足

**解决：**
1. 重新生成 Access Token
2. 确认已添加 `ads_read` 权限
3. 检查 Token 是否正确配置到 Vercel 环境变量

---

## 监控仪表盘

竞品监控页面：
```
https://your-domain.vercel.app/competitors
```

页面包含：
- 流量与渠道情报
- 商品与定价策略
- 广告投流策略
- 用户反馈与声誉

---

## 进一步优化

### 1. 添加邮件告警

当竞品数据出现重大变化时发送邮件：

```typescript
// lib/alerts.ts
export async function checkCompetitorAlerts(data) {
  if (data.reputation.trustpilot.score < 3.5) {
    sendEmail("竞品评分大幅下降！");
  }
}
```

### 2. 数据可视化

导出竞品数据到 Google Sheets 或 Notion：

```bash
GET /api/competitors/export?format=csv
```

### 3. AI 分析

使用 Claude API 分析竞品趋势：

```typescript
import Anthropic from "@anthropic-ai/sdk";

const analysis = await claude.messages.create({
  model: "claude-sonnet-4",
  messages: [{
    role: "user",
    content: `分析竞品数据变化：${JSON.stringify(data)}`
  }]
});
```

---

## 技术支持

如有问题，请查看：
- 项目文档：`README.md`
- API 日志：Vercel Dashboard → Logs
- 数据状态：`/api/competitors/status`

---

**最后更新：** 2026-04-23
