// 通用数据分析工具库

export interface Insight {
  type: "success" | "warning" | "danger" | "info";
  title: string;
  description: string;
  recommendation: string;
  priority: "high" | "medium" | "low";
}

// 解析百分比变化
export function parseChange(change: string | number): number {
  if (typeof change === "number") return change;
  const match = String(change).match(/([+-]?\d+\.?\d*)/);
  return match ? parseFloat(match[1]) : 0;
}

// 解析百分比值
export function parsePercent(value: string | number): number {
  if (typeof value === "number") return value;
  const match = String(value).match(/(\d+\.?\d*)/);
  return match ? parseFloat(match[1]) : 0;
}

// 流量分析
export function analyzeTraffic(data: any): Insight[] {
  if (!data) return [];
  const insights: Insight[] = [];

  const pvChange = parseChange(data.kpi?.pv?.change || 0);
  const uvChange = parseChange(data.kpi?.uv?.change || 0);
  const bounceRate = parsePercent(data.kpi?.bounce?.value || "0%");
  const bounceChange = parseChange(data.kpi?.bounce?.change || 0);

  // 流量趋势分析
  if (pvChange < -20 || uvChange < -20) {
    insights.push({
      type: "danger",
      title: "流量大幅下降",
      description: `PV ${pvChange}% · UV ${uvChange}%，流量出现显著下滑`,
      recommendation: "立即检查：1) 核心渠道是否异常（SEO排名、广告投放）；2) 网站是否有技术故障；3) 竞品是否有大促活动",
      priority: "high"
    });
  } else if (pvChange < -10 || uvChange < -10) {
    insights.push({
      type: "warning",
      title: "流量持续下降",
      description: `PV ${pvChange}% · UV ${uvChange}%，需关注流量来源变化`,
      recommendation: "建议：1) 分析各渠道流量变化，找出主要流失来源；2) 检查关键落地页的跳出率；3) 优化 SEO 和付费广告策略",
      priority: "medium"
    });
  } else if (pvChange > 30 || uvChange > 30) {
    insights.push({
      type: "success",
      title: "流量强势增长",
      description: `PV ${pvChange}% · UV ${uvChange}%，流量实现显著提升`,
      recommendation: "保持：1) 继续投入成功渠道；2) 优化转化漏斗承接增量流量；3) 监控服务器负载确保稳定性",
      priority: "low"
    });
  }

  // 跳出率分析
  if (bounceRate > 70) {
    insights.push({
      type: "danger",
      title: "跳出率过高",
      description: `当前跳出率 ${bounceRate.toFixed(1)}%，用户留存率极低`,
      recommendation: "紧急优化：1) 检查页面加载速度（目标<3秒）；2) 优化首屏内容相关性；3) 改善移动端体验；4) 添加引导性 CTA",
      priority: "high"
    });
  } else if (bounceRate > 55 && bounceChange > 5) {
    insights.push({
      type: "warning",
      title: "跳出率上升",
      description: `跳出率 ${bounceRate.toFixed(1)}% (${bounceChange > 0 ? '+' : ''}${bounceChange}%)，用户流失增加`,
      recommendation: "建议：1) A/B 测试落地页布局；2) 优化产品展示方式；3) 检查是否有误导性的广告文案；4) 提升页面相关性",
      priority: "medium"
    });
  } else if (bounceRate < 40) {
    insights.push({
      type: "success",
      title: "用户粘性良好",
      description: `跳出率 ${bounceRate.toFixed(1)}%，用户停留表现优秀`,
      recommendation: "继续：1) 分析低跳出率页面特征并复制到其他页面；2) 优化用户路径引导至转化；3) 增加推荐商品曝光",
      priority: "low"
    });
  }

  // 渠道分析
  if (data.sources && Array.isArray(data.sources)) {
    const organic = data.sources.find((s: any) => s?.name?.toLowerCase().includes("organic"));
    const direct = data.sources.find((s: any) => s?.name?.toLowerCase().includes("direct"));
    const paid = data.sources.find((s: any) => s?.name?.toLowerCase().includes("paid"));

    if (organic && organic.value < 15) {
      insights.push({
        type: "warning",
        title: "自然流量占比过低",
        description: `Organic 流量仅占 ${organic.value}%，过度依赖其他渠道`,
        recommendation: "加强 SEO：1) 优化核心关键词排名；2) 增加高质量内容产出；3) 建设外链提升域名权重；4) 优化技术 SEO（速度、结构化数据）",
        priority: "high"
      });
    }

    if (paid && paid.value > 50) {
      insights.push({
        type: "warning",
        title: "付费流量依赖度高",
        description: `Paid 流量占比 ${paid.value}%，获客成本风险大`,
        recommendation: "降低依赖：1) 投入自然流量建设；2) 加强品牌建设提升 Direct 流量；3) 优化付费广告 ROI；4) 拓展社交媒体等低成本渠道",
        priority: "medium"
      });
    }

    if (direct && direct.value > 40) {
      insights.push({
        type: "success",
        title: "品牌力强劲",
        description: `Direct 流量占比 ${direct.value}%，品牌认知度高`,
        recommendation: "利用优势：1) 加强老客复购营销；2) 推出会员计划；3) 收集用户反馈完善产品；4) 通过口碑传播获取新客",
        priority: "low"
      });
    }
  }

  // Top 页面分析
  if (data.topPages && Array.isArray(data.topPages)) {
    const homePage = data.topPages.find((p: any) => p.path === "/" || p.path === "/home");
    if (homePage && data.topPages.length > 0) {
      const homeShare = (homePage.pv / data.topPages.reduce((sum: number, p: any) => sum + p.pv, 0)) * 100;
      if (homeShare > 60) {
        insights.push({
          type: "warning",
          title: "流量过度集中首页",
          description: `首页占总 PV 的 ${homeShare.toFixed(1)}%，用户深度浏览不足`,
          recommendation: "引导分流：1) 优化首页推荐逻辑；2) 添加热门产品/类目入口；3) 改善站内搜索；4) 增加内容页面 SEO 权重",
          priority: "medium"
        });
      }
    }

    const highBouncePages = data.topPages.filter((p: any) => parsePercent(p.bounce) > 70);
    if (highBouncePages.length >= 3) {
      insights.push({
        type: "warning",
        title: "多个热门页面跳出率高",
        description: `有 ${highBouncePages.length} 个高流量页面跳出率超过 70%`,
        recommendation: "逐页优化：1) 检查这些页面的加载速度；2) 优化页面内容与流量来源的匹配度；3) 增加相关推荐；4) 改善 CTA 布局",
        priority: "high"
      });
    }
  }

  return insights;
}

// SEO 分析
export function analyzeSEO(data: any): Insight[] {
  if (!data) return [];
  const insights: Insight[] = [];

  const clicksChange = parseChange(data.kpi?.clicks?.change || 0);
  const impressionsChange = parseChange(data.kpi?.impressions?.change || 0);
  const ctr = parsePercent(data.kpi?.ctr?.value || "0%");
  const ctrChange = parseChange(data.kpi?.ctr?.change || 0);
  const position = parseFloat(String(data.kpi?.position?.value || "0").replace(/[^0-9.]/g, ""));
  const positionChange = parseChange(data.kpi?.position?.change || 0);

  // 点击量分析
  if (clicksChange < -20) {
    insights.push({
      type: "danger",
      title: "自然搜索流量暴跌",
      description: `点击量下降 ${clicksChange}%，SEO 流量严重流失`,
      recommendation: "紧急排查：1) 检查是否遭受算法惩罚；2) 核心关键词排名是否大幅下滑；3) 网站是否有技术问题（抓取、索引）；4) 竞品是否有重大 SEO 动作",
      priority: "high"
    });
  } else if (clicksChange < -10) {
    insights.push({
      type: "warning",
      title: "SEO 流量下降",
      description: `点击量下降 ${clicksChange}%，需优化搜索表现`,
      recommendation: "优化建议：1) 分析排名下降的关键词并优化内容；2) 提升页面质量和相关性；3) 加强内链结构；4) 更新过时内容",
      priority: "medium"
    });
  }

  // 展现量分析
  if (impressionsChange > 20 && clicksChange < 5) {
    insights.push({
      type: "warning",
      title: "展现量增长但点击未跟上",
      description: `展现量 +${impressionsChange}% 但点击量增长缓慢，CTR 可能下降`,
      recommendation: "优化标题和描述：1) 改善 Meta Title 吸引力；2) 优化 Meta Description 突出卖点；3) 使用结构化数据增强展示；4) 测试不同的标题样式",
      priority: "high"
    });
  }

  // CTR 分析
  if (ctr < 2) {
    insights.push({
      type: "danger",
      title: "点击率严重偏低",
      description: `CTR 仅 ${ctr.toFixed(2)}%，远低于行业平均（3-5%）`,
      recommendation: "立即优化：1) 重写 Meta 标签，突出独特价值；2) 添加价格、优惠等吸引元素；3) 使用 FAQ/评分等富摘要；4) 分析高 CTR 竞品的标题策略",
      priority: "high"
    });
  } else if (ctr < 3 && ctrChange < -10) {
    insights.push({
      type: "warning",
      title: "CTR 持续走低",
      description: `CTR ${ctr.toFixed(2)}% (${ctrChange}%)，搜索吸引力下降`,
      recommendation: "改进措施：1) 更新过时的 Meta 信息；2) 添加时效性元素（如年份、最新）；3) 测试 emoji 或特殊符号；4) 参考竞品优秀案例",
      priority: "medium"
    });
  } else if (ctr > 5) {
    insights.push({
      type: "success",
      title: "CTR 表现优秀",
      description: `CTR ${ctr.toFixed(2)}%，搜索结果吸引力强`,
      recommendation: "保持优势：1) 总结高 CTR 标题的特征；2) 将成功经验应用到其他页面；3) 持续测试优化；4) 监控竞品变化",
      priority: "low"
    });
  }

  // 排名分析
  if (position > 20) {
    insights.push({
      type: "danger",
      title: "平均排名过低",
      description: `平均排名 ${position.toFixed(1)}，大部分关键词排在第 2-3 页`,
      recommendation: "提升排名：1) 聚焦优化排名 11-20 位的词（易突破）；2) 提升页面质量和相关性；3) 建设高质量外链；4) 改善网站技术 SEO",
      priority: "high"
    });
  } else if (position > 10 && positionChange > 2) {
    insights.push({
      type: "warning",
      title: "排名下滑明显",
      description: `平均排名 ${position.toFixed(1)}（下滑 ${positionChange.toFixed(1)} 位），需采取措施`,
      recommendation: "稳定排名：1) 检查被竞品超越的关键词；2) 更新和扩充内容；3) 提升页面用户体验；4) 增加内部链接支持",
      priority: "medium"
    });
  } else if (position <= 5) {
    insights.push({
      type: "success",
      title: "排名表现优秀",
      description: `平均排名 ${position.toFixed(1)}，大部分关键词在首页前列`,
      recommendation: "巩固优势：1) 持续更新高排名页面内容；2) 监控竞品动态；3) 拓展长尾关键词；4) 优化用户体验指标（CWV）",
      priority: "low"
    });
  }

  // 品牌词分析
  if (data.brandVsNonBrand) {
    const brandShare = data.brandVsNonBrand.brandShare || 0;
    const brandChange = parseChange(data.brandVsNonBrand.brandChange || 0);
    const nonBrandChange = parseChange(data.brandVsNonBrand.nonBrandChange || 0);

    if (brandShare > 70) {
      insights.push({
        type: "warning",
        title: "过度依赖品牌词",
        description: `品牌词占比 ${brandShare}%，非品牌词流量不足`,
        recommendation: "拓展非品牌词：1) 优化产品类目页面 SEO；2) 创建需求导向内容（How-to、Guide）；3) 针对购物意图关键词优化；4) 建设内容营销矩阵",
        priority: "high"
      });
    } else if (nonBrandChange < -15) {
      insights.push({
        type: "warning",
        title: "非品牌词流量下降",
        description: `非品牌词点击下降 ${nonBrandChange}%，新客获取受阻`,
        recommendation: "恢复非品牌词：1) 分析下降最多的类目词；2) 更新产品页面内容；3) 改善用户评价展示；4) 优化产品图片和描述",
        priority: "high"
      });
    }
  }

  // 收录监控
  if (data.indexing) {
    const indexedPages = data.indexing.indexedPages || 0;
    const landingBounce = parsePercent(data.indexing.landingBounce || "0%");

    if (indexedPages < 100) {
      insights.push({
        type: "warning",
        title: "索引页面较少",
        description: `仅 ${indexedPages} 个页面被索引，SEO 覆盖面不足`,
        recommendation: "提升索引：1) 提交 Sitemap；2) 改善网站结构和内链；3) 提高页面质量；4) 检查 robots.txt 和 noindex 标签",
        priority: "medium"
      });
    }

    if (landingBounce > 70) {
      insights.push({
        type: "danger",
        title: "落地页跳出率过高",
        description: `核心落地页平均跳出率 ${landingBounce}，SEO 流量质量差`,
        recommendation: "优化落地页：1) 提升内容与搜索意图的匹配度；2) 改善页面加载速度；3) 优化移动端体验；4) 添加相关内容推荐",
        priority: "high"
      });
    }
  }

  // 外链分析
  if (data.backlinks) {
    const newDomains = data.backlinks.newDomains || 0;
    const qualityRate = parsePercent(data.backlinks.qualityRate || "0%");

    if (newDomains < 5) {
      insights.push({
        type: "warning",
        title: "外链增长缓慢",
        description: `近期仅新增 ${newDomains} 个引流域名，外链建设不足`,
        recommendation: "加强外链：1) 开展内容营销获取自然外链；2) 联系行业媒体和博主；3) 提交到相关目录；4) 参与行业论坛和问答",
        priority: "medium"
      });
    }

    if (qualityRate < 30) {
      insights.push({
        type: "warning",
        title: "外链质量有待提升",
        description: `外链引流质量 ${qualityRate.toFixed(1)}%，用户参与度低`,
        recommendation: "优化外链质量：1) 聚焦相关性强的网站；2) 创建高质量内容吸引自然链接；3) 清理低质量外链；4) 建立合作伙伴关系",
        priority: "medium"
      });
    }
  }

  // AI 搜索分析
  if (data.geo) {
    const aiMentions = data.geo.aiMentions || 0;
    const aiShare = parsePercent(data.geo.aiShare || "0%");

    if (aiMentions > 100) {
      insights.push({
        type: "success",
        title: "AI 搜索流量显著",
        description: `检测到 ${aiMentions} 次 AI 来源访问，占 ${aiShare}%`,
        recommendation: "把握 GEO 机遇：1) 优化内容为 AI 友好格式；2) 使用清晰的结构化数据；3) 创建权威性内容；4) 监控 AI 推荐的话题方向",
        priority: "low"
      });
    } else if (aiMentions > 0 && aiMentions < 50) {
      insights.push({
        type: "info",
        title: "AI 搜索流量初现",
        description: `检测到 ${aiMentions} 次 AI 来源访问，新渠道值得关注`,
        recommendation: "提前布局：1) 研究 AI 推荐机制；2) 优化问答式内容；3) 提供清晰准确的信息；4) 监控 AI 流量增长趋势",
        priority: "low"
      });
    }
  }

  // 关键词分布分析
  if (data.keywords && Array.isArray(data.keywords)) {
    const topKeywords = data.keywords.slice(0, 10);
    const top3Clicks = topKeywords.slice(0, 3).reduce((sum: number, k: any) => sum + k.clicks, 0);
    const totalClicks = topKeywords.reduce((sum: number, k: any) => sum + k.clicks, 0);

    if (totalClicks > 0) {
      const top3Share = (top3Clicks / totalClicks) * 100;
      if (top3Share > 60) {
        insights.push({
          type: "warning",
          title: "关键词过度集中",
          description: `前 3 个关键词占 Top10 点击量的 ${top3Share.toFixed(1)}%`,
          recommendation: "分散风险：1) 拓展长尾关键词矩阵；2) 优化更多产品/类目页面；3) 创建多元化内容；4) 避免单点依赖",
          priority: "medium"
        });
      }
    }

    const lowPositionKeywords = data.keywords.filter((k: any) => k.position > 10 && k.clicks > 0);
    if (lowPositionKeywords.length > 20) {
      insights.push({
        type: "info",
        title: "大量关键词排名待提升",
        description: `有 ${lowPositionKeywords.length} 个排名 10 位外的词已产生点击`,
        recommendation: "挖掘潜力：1) 这些词排名提升空间大；2) 优先优化点击量多的低排名词；3) 改善内容质量和相关性；4) 建设内链支持",
        priority: "low"
      });
    }
  }

  return insights;
}

// 转化分析
export function analyzeConversion(data: any): Insight[] {
  if (!data) return [];
  const insights: Insight[] = [];

  const purchasesChange = parseChange(data.kpi?.purchases?.change || 0);
  const checkoutsChange = parseChange(data.kpi?.checkouts?.change || 0);
  const addToCartsChange = parseChange(data.kpi?.addToCarts?.change || 0);
  const cvr = parsePercent(data.kpi?.cvr?.value || "0%");
  const cvrChange = parseChange(data.kpi?.cvr?.change || 0);

  // 转化率分析（礼服行业基准：0.8-1.5%）
  if (cvr < 0.6) {
    insights.push({
      type: "danger",
      title: "转化率极低",
      description: `整体转化率仅 ${cvr.toFixed(2)}%，远低于礼服行业平均（0.8-1.5%）`,
      recommendation: "紧急优化：1) 高清结账流程（减少步骤）；2) 优化支付方式（多元化）；3) 建立信任（评价、保障）；4) 提供尺码指导（减少犹豫）；5) 改善移动端体验",
      priority: "high"
    });
  } else if (cvr < 1.2 && cvrChange < -15) {
    insights.push({
      type: "warning",
      title: "转化率持续下降",
      description: `转化率 ${cvr.toFixed(2)}% (${cvrChange}%)，需立即干预`,
      recommendation: "止损措施：1) 对比上期流量来源质量变化；2) 检查价格竞争力；3) 优化产品详情页（高清大图、模特试穿）；4) 测试不同促销策略；5) 分析购物车放弃原因",
      priority: "high"
    });
  } else if (cvr > 1.5) {
    insights.push({
      type: "success",
      title: "转化率表现优秀",
      description: `转化率 ${cvr.toFixed(2)}%，高于礼服行业平均水平`,
      recommendation: "持续优化：1) 分析高转化路径特征；2) 扩大成功策略应用范围；3) 提升客单价（推荐配件）；4) 增加复购率（推荐其他场合）；5) 优化用户终身价值",
      priority: "low"
    });
  }

  // 购买趋势分析
  if (purchasesChange < -20) {
    insights.push({
      type: "danger",
      title: "购买量大幅下滑",
      description: `购买量下降 ${purchasesChange}%，业绩严重受损`,
      recommendation: "紧急应对：1) 启动促销活动刺激转化；2) 检查库存和产品可用性；3) 分析竞品动态；4) 优化价格策略；5) 加强营销推广",
      priority: "high"
    });
  } else if (purchasesChange < -10) {
    insights.push({
      type: "warning",
      title: "购买量下降",
      description: `购买量下降 ${purchasesChange}%，需改善转化表现`,
      recommendation: "改进建议：1) 分析流量质量变化；2) 优化产品详情页展示；3) 测试不同价格策略；4) 改善购物体验；5) 增强信任要素",
      priority: "medium"
    });
  }

  // 漏斗分析
  if (data.funnel && Array.isArray(data.funnel) && data.funnel.length >= 3) {
    const viewToCart = parsePercent(data.funnel[1]?.rate || "0%");
    const cartToCheckout = data.funnel.length > 2 ?
      (parsePercent(data.funnel[2]?.rate || "0%") / Math.max(viewToCart, 0.01)) * 100 : 0;
    const checkoutToPurchase = data.funnel.length > 3 ?
      (parsePercent(data.funnel[3]?.rate || "0%") / Math.max(parsePercent(data.funnel[2]?.rate || "0%"), 0.01)) * 100 : 0;

    // 加购率分析（礼服行业基准：10-20%）
    if (viewToCart < 8) {
      insights.push({
        type: "danger",
        title: "加购率严重偏低",
        description: `浏览转加购率仅 ${viewToCart.toFixed(1)}%，产品吸引力不足`,
        recommendation: "提升加购：1) 优化产品图片和视频（多角度、真人试穿）；2) 完善产品描述和卖点（面料、场合、风格）；3) 展示用户评价和实拍；4) 提供尺码推荐工具；5) 添加紧迫感元素（库存、限时）",
        priority: "high"
      });
    } else if (viewToCart < 15) {
      insights.push({
        type: "warning",
        title: "加购率有提升空间",
        description: `浏览转加购率 ${viewToCart.toFixed(1)}%，低于礼服行业优秀水平（20%+）`,
        recommendation: "优化建议：1) A/B 测试产品页布局；2) 增加社交证明（买家秀、KOL 推荐）；3) 优化价格展示；4) 改善移动端体验；5) 提供虚拟试穿/AR 试妆工具",
        priority: "medium"
      });
    }

    // 结账率分析（礼服行业基准：15-30%，购物车放弃率 70-85%）
    if (cartToCheckout > 0 && cartToCheckout < 15) {
      insights.push({
        type: "danger",
        title: "购物车放弃率高",
        description: `购物车到结账转化率仅 ${cartToCheckout.toFixed(1)}%，流失严重`,
        recommendation: "减少放弃：1) 发送购物车放弃邮件/推送（含优惠券）；2) 简化结账流程（减少步骤）；3) 展示运费和总价（避免隐藏费用）；4) 提供多种支付方式；5) 添加退换货保障信息（降低风险）",
        priority: "high"
      });
    } else if (cartToCheckout > 0 && cartToCheckout < 25) {
      insights.push({
        type: "warning",
        title: "购物车流失较多",
        description: `购物车到结账转化率 ${cartToCheckout.toFixed(1)}%，有优化空间`,
        recommendation: "改善措施：1) 优化购物车页面体验（突出产品卖点）；2) 提供优惠激励（满减、包邮）；3) 展示信任标识（安全支付、品质保证）；4) 优化移动端结账；5) 减少必填信息",
        priority: "medium"
      });
    } else if (cartToCheckout >= 30) {
      insights.push({
        type: "success",
        title: "购物车转化表现优秀",
        description: `购物车到结账转化率 ${cartToCheckout.toFixed(1)}%，高于礼服行业平均`,
        recommendation: "保持优势：1) 分析成功因素并应用到其他环节；2) 继续优化用户体验；3) 监控竞品策略；4) 测试更高转化可能性",
        priority: "low"
      });
    }

    // 支付完成率分析（礼服行业基准：40-60%，高客单价决策周期长）
    if (checkoutToPurchase > 0 && checkoutToPurchase < 40) {
      insights.push({
        type: "danger",
        title: "支付环节流失严重",
        description: `结账到支付完成率仅 ${checkoutToPurchase.toFixed(1)}%，支付问题明显`,
        recommendation: "优化支付：1) 检查支付流程是否过于复杂；2) 增加支付方式选择（分期付款、Affirm 等）；3) 优化支付页面加载速度；4) 提供实时客服支持（消除顾虑）；5) 测试不同支付服务商",
        priority: "high"
      });
    } else if (checkoutToPurchase > 0 && checkoutToPurchase < 55) {
      insights.push({
        type: "warning",
        title: "支付环节有待优化",
        description: `结账到支付完成率 ${checkoutToPurchase.toFixed(1)}%，仍有提升空间`,
        recommendation: "改进建议：1) 简化支付表单；2) 提供一键支付选项（Apple Pay/Google Pay）；3) 展示安全认证和品质保障；4) 优化错误提示；5) 支持更多本地化支付（PayPal 等）",
        priority: "medium"
      });
    } else if (checkoutToPurchase >= 60) {
      insights.push({
        type: "success",
        title: "支付完成率表现优秀",
        description: `结账到支付完成率 ${checkoutToPurchase.toFixed(1)}%，高于礼服行业平均`,
        recommendation: "保持优势：1) 分析成功因素（支付方式、流程设计）；2) 持续优化用户体验；3) 监控支付成功率；4) 收集用户反馈",
        priority: "low"
      });
    }
  }

  // 加购与购买对比
  if (addToCartsChange > 10 && purchasesChange < 5) {
    insights.push({
      type: "warning",
      title: "加购增长但购买未跟上",
      description: `加购 +${addToCartsChange}% 但购买增长缓慢，转化链路受阻`,
      recommendation: "打通链路：1) 优化结账流程降低摩擦；2) 提供促销激励；3) 发送购物车提醒；4) 改善支付体验；5) 增强购买信心（评价、保障）",
      priority: "high"
    });
  }

  if (checkoutsChange > 10 && purchasesChange < 5) {
    insights.push({
      type: "warning",
      title: "结账增长但支付完成差",
      description: `结账 +${checkoutsChange}% 但购买增长缓慢，支付环节有问题`,
      recommendation: "排查支付：1) 检查支付成功率；2) 优化支付方式配置；3) 减少支付步骤；4) 提供实时客服支持；5) 测试支付流程稳定性",
      priority: "high"
    });
  }

  return insights;
}

// 竞品分析
export function analyzeCompetitors(data: any): Insight[] {
  if (!data) return [];
  const insights: Insight[] = [];

  // 流量对比分析
  if (data.traffic && Array.isArray(data.traffic) && data.traffic.length > 0) {
    type BrandMetrics = {
      name: string;
      visits: number;
      change: number;
      organic: number;
      paid: number;
      direct: number;
    };

    const brands: BrandMetrics[] = data.traffic.map((t: any) => ({
      name: t.brand,
      visits: t.totalVisits,
      change: parseChange(t.visitChange || "0%"),
      organic: t.channels?.organic || 0,
      paid: t.channels?.paid || 0,
      direct: t.channels?.direct || 0
    }));

    const avgVisits = brands.reduce((sum, b) => sum + b.visits, 0) / brands.length;
    const topGrower = brands.reduce((max, b) => b.change > max.change ? b : max, brands[0]);
    const biggestDecline = brands.reduce((min, b) => b.change < min.change ? b : min, brands[0]);

    if (topGrower.change > 20) {
      insights.push({
        type: "warning",
        title: `${topGrower.name} 流量激增`,
        description: `${topGrower.name} 流量增长 ${topGrower.change > 0 ? '+' : ''}${topGrower.change}%，需警惕竞争加剧`,
        recommendation: `分析 ${topGrower.name}: 1) 检查其最近的营销活动；2) 分析流量来源变化；3) 研究其新品或促销策略；4) 关注其 SEO 和广告投放`,
        priority: "high"
      });
    }

    if (biggestDecline.change < -15) {
      insights.push({
        type: "info",
        title: `${biggestDecline.name} 流量下滑`,
        description: `${biggestDecline.name} 流量下降 ${biggestDecline.change}%，可能存在机会`,
        recommendation: `抓住机会: 1) 争夺其流失的用户；2) 在其弱势渠道加强投入；3) 对比其产品策略找差异化；4) 监控其用户反馈`,
        priority: "low"
      });
    }

    // 渠道策略对比
    const highOrganicCompetitors = brands.filter((b: BrandMetrics) => b.organic > 40);
    if (highOrganicCompetitors.length > 2) {
      const names = highOrganicCompetitors.map((b: BrandMetrics) => b.name).join("、");
      insights.push({
        type: "info",
        title: "竞品 SEO 表现强劲",
        description: `${names} 的自然流量占比超过 40%`,
        recommendation: "学习SEO策略：1) 分析其高排名关键词；2) 研究其内容策略；3) 对标其技术 SEO；4) 监控其外链建设",
        priority: "medium"
      });
    }

    const highPaidCompetitors = brands.filter((b: BrandMetrics) => b.paid > 40);
    if (highPaidCompetitors.length > 0) {
      const names = highPaidCompetitors.map((b: BrandMetrics) => b.name).join("、");
      insights.push({
        type: "info",
        title: "竞品加大付费投放",
        description: `${names} 付费流量占比超过 40%，广告投入大`,
        recommendation: "应对策略：1) 监控其广告创意和落地页；2) 关注其投放关键词；3) 评估是否跟进或差异化；4) 加强自然流量建设降低获客成本",
        priority: "medium"
      });
    }
  }

  // 商品策略分析
  if (data.merchandising && Array.isArray(data.merchandising)) {
    const avgNewSKUs = data.merchandising.reduce((sum: number, m: any) => sum + (m.newSKUs?.thisWeek || 0), 0) / data.merchandising.length;
    const fastUpdaters = data.merchandising.filter((m: any) => (m.newSKUs?.thisWeek || 0) > avgNewSKUs * 1.5);

    if (fastUpdaters.length > 0) {
      const names = fastUpdaters.map((m: any) => m.brand).join("、");
      insights.push({
        type: "warning",
        title: "竞品上新速度快",
        description: `${names} 新品上架频率明显高于平均，供应链响应快`,
        recommendation: "加速迭代：1) 评估自身上新节奏；2) 优化供应链效率；3) 基于数据快速测款；4) 关注其爆款特征",
        priority: "medium"
      });
    }

    // 价格策略分析
    const priceStrategies = data.merchandising.map((m: any) => {
      if (!m.priceDistribution || m.priceDistribution.length === 0) return null;
      const mainPriceRange = m.priceDistribution.reduce((max: any, p: any) =>
        parsePercent(p.share) > parsePercent(max.share) ? p : max
      );
      return { brand: m.brand, mainRange: mainPriceRange.range, share: parsePercent(mainPriceRange.share) };
    }).filter(Boolean);

    if (priceStrategies.length > 2) {
      const lowPrice = priceStrategies.filter((p: any) => p.mainRange.includes("$50") || p.mainRange.includes("$100"));
      const highPrice = priceStrategies.filter((p: any) => p.mainRange.includes("$200") || p.mainRange.includes("$300"));

      if (lowPrice.length > 0 && highPrice.length > 0) {
        insights.push({
          type: "info",
          title: "竞品价格策略分化",
          description: `市场存在明显的价格分层，低价和高价策略并存`,
          recommendation: "明确定位：1) 确认自身价格定位和目标人群；2) 避免价格战，强化差异化价值；3) 考虑推出不同价位产品线；4) 监控各价位段竞争强度",
          priority: "medium"
        });
      }
    }
  }

  // 广告投放分析
  if (data.ads && Array.isArray(data.ads)) {
    const activeAdBrands = data.ads.filter((a: any) => (a.activeAds || 0) > 10);
    if (activeAdBrands.length > 2) {
      const names = activeAdBrands.map((a: any) => a.brand).join("、");
      insights.push({
        type: "warning",
        title: "竞品广告投放活跃",
        description: `${names} 正在大量投放广告，市场竞争激烈`,
        recommendation: "监控广告：1) 收集其广告创意和文案；2) 分析其目标受众和地域；3) 评估其促销策略；4) 调整自身广告策略应对",
        priority: "high"
      });
    }

    // 广告创意分析
    const totalCreatives = data.ads.reduce((sum: number, a: any) => sum + (a.topCreatives?.length || 0), 0);
    if (totalCreatives > 20) {
      insights.push({
        type: "info",
        title: "竞品广告创意丰富",
        description: `监测到 ${totalCreatives}+ 条不同的广告素材，竞品在测试优化`,
        recommendation: "学习创意：1) 收集表现好的广告素材；2) 分析其文案和视觉策略；3) 测试类似创意风格；4) 持续迭代广告素材",
        priority: "low"
      });
    }
  }

  // 声誉分析
  if (data.reputation && Array.isArray(data.reputation)) {
    const avgScore = data.reputation.reduce((sum: number, r: any) => sum + (r.trustpilot?.score || 0), 0) / data.reputation.length;
    const topRated = data.reputation.filter((r: any) => (r.trustpilot?.score || 0) > avgScore + 0.5);
    const lowRated = data.reputation.filter((r: any) => (r.trustpilot?.score || 0) < avgScore - 0.5);

    if (topRated.length > 0) {
      const names = topRated.map((r: any) => `${r.brand} (${r.trustpilot?.score?.toFixed(1)})`).join("、");
      insights.push({
        type: "info",
        title: "部分竞品口碑优秀",
        description: `${names} 评分明显高于平均，用户满意度高`,
        recommendation: "对标学习: 1) 分析其好评关键点；2) 研究其客户服务策略；3) 对比产品质量；4) 学习其售后政策",
        priority: "medium"
      });
    }

    if (lowRated.length > 0) {
      const names = lowRated.map((r: any) => r.brand).join("、");
      insights.push({
        type: "success",
        title: "竞品口碑存在弱点",
        description: `${names} 用户评分较低，存在差异化机会`,
        recommendation: "抓住机会：1) 分析其差评集中点；2) 在这些方面强化自身优势；3) 在营销中突出差异化；4) 吸引其不满用户",
        priority: "low"
      });
    }

    // 常见问题分析
    const allIssues = data.reputation.flatMap((r: any) => r.commonIssues || []);
    const issueCategories = new Map<string, number>();
    allIssues.forEach((issue: any) => {
      const topic = issue.topic || "其他";
      issueCategories.set(topic, (issueCategories.get(topic) || 0) + (issue.mentions || 0));
    });

    const topIssues = Array.from(issueCategories.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    if (topIssues.length > 0) {
      const issueList = topIssues.map(([topic, count]: [string, number]) => `${topic} (${count}次)`).join("、");
      insights.push({
        type: "info",
        title: "行业共性问题",
        description: `竞品普遍被投诉：${issueList}`,
        recommendation: "避免踩坑: 1) 确保自身不存在相同问题；2) 在这些方面提供更好体验；3) 在营销中突出优势；4) 主动收集用户反馈",
        priority: "high"
      });
    }
  }

  return insights;
}
