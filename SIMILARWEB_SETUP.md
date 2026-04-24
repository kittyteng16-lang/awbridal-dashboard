# SimilarWeb API 接入指南

## 📋 第一步：获取 API Key

### 1. 注册 SimilarWeb 账号
访问：https://account.similarweb.com/

### 2. 选择订阅计划
- **免费试用**: 7-14 天（有限功能）
- **Starter**: ~$125/月（基础流量数据）
- **Professional**: ~$333/月（包含关键词、渠道分布）
- **Enterprise**: 联系销售（完整功能）

推荐选择 **Professional Plan** 以获取完整的竞品监控功能。

### 3. 获取 API Key
1. 登录后访问：https://account.similarweb.com/api-management
2. 点击 **"Create API Key"**
3. 复制保存你的 API Key（格式：`sw_xxxxxxxxxxxxx`）

---

## 🔧 第二步：配置环境变量

### 方法 1：在 Vercel 项目设置中添加

1. 打开 Vercel 项目：https://vercel.com/your-username/awbridal-dashboard
2. 进入 **Settings** → **Environment Variables**
3. 添加以下变量：

```
变量名: SIMILARWEB_API_KEY
值: 你的 SimilarWeb API Key
环境: Production, Preview, Development
```

4. 点击 **Save**
5. 重新部署项目（Vercel 会自动触发）

### 方法 2：使用 Vercel CLI

```bash
vercel env add SIMILARWEB_API_KEY
# 输入你的 API Key
# 选择环境: Production, Preview, Development
```

### 方法 3：本地开发环境

在项目根目录创建 `.env.local` 文件：

```env
SIMILARWEB_API_KEY=你的API_Key
```

---

## 📊 第三步：验证配置

### 1. 检查环境变量
访问调试接口：
```
https://awbridal-dashboard.vercel.app/api/competitors/status
```

应该返回：
```json
{
  "similarweb": {
    "configured": true,
    "status": "ready"
  }
}
```

### 2. 测试 API 调用
访问：
```
https://awbridal-dashboard.vercel.app/api/competitors/refresh
```

---

## 🎯 第四步：启用真实数据

配置完成后，竞品监控页面会自动切换到真实 SimilarWeb 数据：

### ✅ 可获取的数据：

#### 1. 流量与渠道情报
- 总访问量（月度）
- 流量来源分布（Direct / Organic / Paid / Social / Referral）
- 热门落地页（Top Landing Pages）
- 关键词排名（Share of Voice）
- 社交媒体来源分析

#### 2. 支持的竞品品牌
- ✅ Azazie (www.azazie.com)
- ✅ Birdy Grey (www.birdygrey.com)
- ✅ Hello Molly (www.hellomolly.com)
- ✅ JJ's House (www.jjshouse.com)

---

## 🔍 API 端点说明

### 1. 总流量数据
```typescript
fetchTotalTraffic(domain, "2026-01", "2026-03", "monthly")
```
返回：月度访问量趋势

### 2. 流量来源分布
```typescript
fetchTrafficSources(domain, "2026-01", "2026-03")
```
返回：各渠道占比（Direct/Organic/Paid/Social）

### 3. 自然搜索关键词
```typescript
fetchOrganicKeywords(domain, "2026-01", "2026-03", 20)
```
返回：Top 20 关键词及排名

### 4. 付费广告关键词
```typescript
fetchPaidKeywords(domain, "2026-01", "2026-03", 10)
```
返回：Top 10 付费关键词

### 5. 热门页面
```typescript
fetchPopularPages(domain, "2026-01", "2026-03")
```
返回：流量最高的页面

---

## ⚠️ 注意事项

### 1. API 限制
- **请求频率**: 根据订阅计划而定
  - Starter: 100 requests/day
  - Professional: 500 requests/day
  - Enterprise: Unlimited
- **数据延迟**: 通常有 1-2 个月延迟
- **历史数据**: 最多查询 37 个月

### 2. 成本优化
- 竞品数据每天更新 1 次（避免超额消耗）
- 使用缓存机制（Supabase 存储）
- 设置合理的刷新间隔（建议 24 小时）

### 3. 降级方案
如果 API Key 未配置或调用失败，系统会自动使用模拟数据，不会影响页面展示。

---

## 🐛 故障排查

### 问题 1: "API Key 未配置"
**解决方案**:
1. 检查环境变量是否正确添加
2. 重新部署 Vercel 项目
3. 清除浏览器缓存

### 问题 2: "401 Unauthorized"
**解决方案**:
1. 检查 API Key 是否正确
2. 确认 API Key 未过期
3. 检查订阅状态

### 问题 3: "429 Too Many Requests"
**解决方案**:
1. 检查是否超出每日配额
2. 等待 24 小时后重试
3. 升级订阅计划

### 问题 4: "404 Not Found"
**解决方案**:
1. 检查域名格式（应为 www.example.com，不含 https://）
2. 确认该域名在 SimilarWeb 有足够数据
3. 使用主域名而非子域名

---

## 📚 相关资源

- **官方文档**: https://developer.similarweb.com/
- **API 参考**: https://developer.similarweb.com/reference
- **定价页面**: https://www.similarweb.com/corp/developer/pricing/
- **支持中心**: https://support.similarweb.com/

---

## 🚀 后续优化建议

### 1. 添加缓存机制
```typescript
// 在 Supabase 存储每日数据，减少 API 调用
await setCached(`competitor_${brand}_${date}`, data, 86400); // 24小时缓存
```

### 2. 设置定时任务
```typescript
// 使用 Vercel Cron Jobs 每天自动更新数据
// vercel.json
{
  "crons": [{
    "path": "/api/competitors/refresh",
    "schedule": "0 2 * * *" // 每天凌晨2点更新
  }]
}
```

### 3. 添加数据趋势分析
存储历史数据，生成趋势图表，分析竞品策略变化。

---

**配置完成后，刷新竞品监控页面即可看到真实数据！** 🎉
