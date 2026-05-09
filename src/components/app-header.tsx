"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowRight,
  BookOpenText,
  History,
  LayoutDashboard,
  Menu,
  Settings,
  Sparkles,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "首页", icon: LayoutDashboard },
  { href: "/workspace", label: "工作台", icon: Sparkles },
  { href: "/templates", label: "模板", icon: BookOpenText },
  { href: "/history", label: "历史", icon: History },
  { href: "/settings", label: "设置", icon: Settings },
];

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-3">
      <div className="flex size-10 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-sm shadow-indigo-600/25">
        <Sparkles className="size-5" />
      </div>
      <div className="leading-tight">
        <div className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-50">
          ProdDoc AI
        </div>
        <div className="text-xs text-slate-400">通用产品文档生成</div>
      </div>
    </Link>
  );
}

export function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 shadow-sm backdrop-blur-lg dark:border-slate-800/80 dark:bg-slate-950/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Brand />

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group relative flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-medium text-slate-600 transition hover:bg-indigo-50 hover:text-indigo-600 dark:text-slate-300 dark:hover:bg-slate-900",
                  active && "bg-indigo-50 text-indigo-600 dark:bg-slate-900 dark:text-indigo-300"
                )}
              >
                <Icon className="size-4" />
                <span>{item.label}</span>
                <span
                  className={cn(
                    "absolute inset-x-3 -bottom-[13px] h-0.5 rounded-full bg-indigo-600 opacity-0 transition",
                    active && "opacity-100"
                  )}
                />
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button asChild className="hidden min-h-10 rounded-xl bg-slate-950 text-white transition hover:scale-[1.02] hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-500 md:inline-flex">
            <Link href="/workspace">
              开始生成文档
              <ArrowRight className="size-4" />
            </Link>
          </Button>

          <Sheet>
            <SheetTrigger asChild>
              <Button type="button" variant="outline" size="icon" className="rounded-xl md:hidden" aria-label="打开导航">
                <Menu className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent className="w-80 border-slate-200 bg-white/95 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/95">
              <SheetHeader>
                <SheetTitle>
                  <Brand />
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-2 px-4">
                {navItems.map((item) => {
                  const active = pathname === item.href;
                  const Icon = item.icon;

                  return (
                    <SheetClose asChild key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-medium text-slate-600 transition hover:bg-indigo-50 hover:text-indigo-600 dark:text-slate-300 dark:hover:bg-slate-900",
                          active && "bg-indigo-50 text-indigo-600 dark:bg-slate-900 dark:text-indigo-300"
                        )}
                      >
                        <Icon className="size-4" />
                        {item.label}
                      </Link>
                    </SheetClose>
                  );
                })}
                <SheetClose asChild>
                  <Button asChild className="mt-2 min-h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500">
                    <Link href="/workspace">开始生成文档</Link>
                  </Button>
                </SheetClose>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
