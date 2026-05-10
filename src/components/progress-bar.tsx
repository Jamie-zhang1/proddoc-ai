"use client";

import { cn } from "@/lib/utils";

type ProgressBarProps = {
  value: number; // 0–100
  label?: string;
  showPercentage?: boolean;
  color?: string; // tailwind gradient class
  className?: string;
};

export function ProgressBar({
  value,
  label,
  showPercentage = true,
  color = "from-indigo-500 to-indigo-600",
  className,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));

  return (
    <div className={cn("w-full", className)}>
      {(label || showPercentage) && (
        <div className="mb-1.5 flex items-center justify-between text-xs">
          {label ? (
            <span className="text-slate-600 dark:text-slate-400">{label}</span>
          ) : (
            <span />
          )}
          {showPercentage && (
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {clamped}%
            </span>
          )}
        </div>
      )}
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div
          className={cn(
            "h-full rounded-full bg-gradient-to-r transition-all duration-500 ease-out",
            color
          )}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
