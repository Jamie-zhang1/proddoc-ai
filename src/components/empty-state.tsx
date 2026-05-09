import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { FileText } from "lucide-react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  description: string;
  icon?: LucideIcon;
  illustration?: ReactNode;
  action?: ReactNode;
  compact?: boolean;
  className?: string;
};

export function EmptyState({
  title,
  description,
  icon: Icon = FileText,
  illustration,
  action,
  compact,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/80 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900/70",
        compact ? "min-h-36 px-5 py-8" : "min-h-64 px-6 py-12",
        className
      )}
    >
      {illustration ? (
        <div className={compact ? "mb-4 w-full max-w-52" : "mb-6 w-full max-w-80"}>
          {illustration}
        </div>
      ) : (
        <div className="flex size-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shadow-sm ring-1 ring-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-300 dark:ring-indigo-500/20">
          <Icon className="size-5" />
        </div>
      )}
      <h3 className={cn("text-lg font-semibold text-slate-900 dark:text-slate-100", illustration ? "" : "mt-4")}>{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-400">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
