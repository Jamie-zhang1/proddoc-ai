"use client";

import { cn } from "@/lib/utils";

function Shimmer({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent dark:before:via-white/10",
        className
      )}
    />
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900",
        className
      )}
    >
      <div className="mb-3 flex items-center gap-3">
        <Shimmer className="size-10 shrink-0 rounded-xl bg-slate-100 dark:bg-slate-800" />
        <div className="flex-1 space-y-2">
          <Shimmer className="h-4 w-1/3 rounded bg-slate-100 dark:bg-slate-800" />
          <Shimmer className="h-3 w-2/3 rounded bg-slate-100 dark:bg-slate-800" />
        </div>
      </div>
      <div className="space-y-2">
        <Shimmer className="h-3 w-full rounded bg-slate-100 dark:bg-slate-800" />
        <Shimmer className="h-3 w-5/6 rounded bg-slate-100 dark:bg-slate-800" />
        <Shimmer className="h-3 w-4/6 rounded bg-slate-100 dark:bg-slate-800" />
      </div>
    </div>
  );
}

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Shimmer
          key={i}
          className={cn(
            "h-3 rounded bg-slate-100 dark:bg-slate-800",
            i === lines - 1 ? "w-3/5" : "w-full"
          )}
        />
      ))}
    </div>
  );
}

export function SkeletonButton({ className }: { className?: string }) {
  return (
    <Shimmer
      className={cn(
        "h-10 w-24 rounded-xl bg-slate-100 dark:bg-slate-800",
        className
      )}
    />
  );
}
