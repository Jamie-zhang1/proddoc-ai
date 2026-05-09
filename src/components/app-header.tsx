"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpenText, History, LayoutDashboard, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "首页", icon: LayoutDashboard },
  { href: "/workspace", label: "工作台", icon: Sparkles },
  { href: "/templates", label: "模板", icon: BookOpenText },
  { href: "/history", label: "历史", icon: History },
];

export function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-zinc-950 text-white">
            <Sparkles className="size-4" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight">ProdDoc AI</div>
            <div className="text-xs text-zinc-500">通用产品文档生成</div>
          </div>
        </Link>

        <nav className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-zinc-50 p-1">
          {navItems.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex h-8 items-center gap-1.5 rounded-md px-3 text-sm text-zinc-600 transition hover:bg-white hover:text-zinc-950",
                  active && "bg-white text-zinc-950 shadow-sm"
                )}
              >
                <Icon className="size-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
