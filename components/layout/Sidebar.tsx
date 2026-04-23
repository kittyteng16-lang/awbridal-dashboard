"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, TrendingUp, Target, Search,
  Star, Flame, Users, ChevronRight,
} from "lucide-react";

const NAV = [
  { href: "/",           label: "总览",     icon: LayoutDashboard, group: "监控中心" },
  { href: "/traffic",    label: "流量分析", icon: TrendingUp,       group: "监控中心" },
  { href: "/conversion", label: "转化分析", icon: Target,           group: "监控中心" },
  { href: "/seo",        label: "SEO 监控", icon: Search,           group: "外部监控" },
  { href: "/reviews",    label: "用户评价", icon: Star,             group: "外部监控", badge: 3 },
  { href: "/topics",     label: "热门话题", icon: Flame,            group: "外部监控" },
  { href: "/competitors", label: "竞品监控", icon: Users,           group: "外部监控" },
];

const GROUPS = ["监控中心", "外部监控"];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-50 flex w-56 flex-col bg-sidebar text-sidebar-foreground">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2.5 border-b border-white/10 px-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-white text-sm font-bold">
          AW
        </div>
        <span className="font-semibold text-sm tracking-wide">运营看板</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3">
        {GROUPS.map((group) => (
          <div key={group} className="mb-1">
            <p className="px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-white/30">
              {group}
            </p>
            {NAV.filter((n) => n.group === group).map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "mx-2 mb-0.5 flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition-colors",
                    active
                      ? "bg-primary text-white font-medium"
                      : "text-white/55 hover:bg-white/8 hover:text-white/90"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">
                      {item.badge}
                    </span>
                  )}
                  {active && <ChevronRight className="h-3 w-3 opacity-60" />}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/10 px-4 py-3">
        <div className="mb-1 flex items-center gap-1.5 text-[11px] text-white/40">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          实时同步中
        </div>
        <p className="text-[11px] text-white/30">GA4 · GSC · 第三方平台</p>
      </div>
    </aside>
  );
}
