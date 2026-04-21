import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AW Bridal · 运营数据看板",
  description: "全渠道运营数据监控：流量、SEO、转化、用户评价、热门话题",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
