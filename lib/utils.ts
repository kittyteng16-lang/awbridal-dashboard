import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** 计算变化百分比字符串，如 "+12.4%" */
export function pctChange(current: number, previous: number): string {
  if (previous === 0) return "+0%";
  const diff = ((current - previous) / previous) * 100;
  return diff >= 0 ? `+${diff.toFixed(1)}%` : `${diff.toFixed(1)}%`;
}

/** 格式化秒数为 "Xm Ys" */
export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}m ${s}s`;
}

/** 格式化大数字 */
export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

/** GA4 日期字符串 "20260419" → "04/19" */
export function formatGA4Date(d: string): string {
  return `${d.slice(4, 6)}/${d.slice(6, 8)}`;
}

/** 渠道名中文映射 */
export const CHANNEL_MAP: Record<string, string> = {
  "Organic Search":  "自然搜索",
  "Direct":          "直接访问",
  "Organic Social":  "社交媒体",
  "Paid Search":     "付费搜索",
  "Paid Shopping":   "付费购物",
  "Cross-network":   "跨网络",
  "Referral":        "引荐",
  "Email":           "邮件",
  "Unassigned":      "未分配",
};
