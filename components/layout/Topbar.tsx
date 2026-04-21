import { Bell, RefreshCw } from "lucide-react";

interface TopbarProps {
  title: string;
  subtitle?: string;
}

export function Topbar({ title, subtitle }: TopbarProps) {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b bg-card px-6">
      <div className="flex-1">
        <h1 className="text-sm font-semibold text-foreground">
          {title}
          {subtitle && (
            <span className="ml-2 text-xs font-normal text-muted-foreground">{subtitle}</span>
          )}
        </h1>
      </div>
      <div className="flex items-center gap-2">
        <div className="rounded-lg border bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground cursor-pointer hover:border-primary hover:text-primary transition-colors">
          📅 近 30 天
        </div>
        <button className="flex h-8 w-8 items-center justify-center rounded-lg border bg-muted/50 text-muted-foreground hover:border-primary hover:text-primary transition-colors">
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
        <button className="relative flex h-8 w-8 items-center justify-center rounded-lg border bg-muted/50 text-muted-foreground hover:border-primary hover:text-primary transition-colors">
          <Bell className="h-3.5 w-3.5" />
          <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-white">3</span>
        </button>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-white cursor-pointer">
          管
        </div>
      </div>
    </header>
  );
}
