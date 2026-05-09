import type { LucideIcon } from "lucide-react";
import { FileText } from "lucide-react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  description: string;
  icon?: LucideIcon;
  className?: string;
};

export function EmptyState({
  title,
  description,
  icon: Icon = FileText,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-48 flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-zinc-50/70 p-8 text-center",
        className
      )}
    >
      <div className="flex size-11 items-center justify-center rounded-lg bg-white text-zinc-600 shadow-sm ring-1 ring-zinc-200">
        <Icon className="size-5" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-zinc-950">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-zinc-500">{description}</p>
    </div>
  );
}
