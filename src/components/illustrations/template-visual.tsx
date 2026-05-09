import { ClipboardList, FileText, Megaphone, Presentation, RefreshCw, Route } from "lucide-react";
import { cn } from "@/lib/utils";

export type TemplateVisualVariant =
  | "product-manual"
  | "feature-update"
  | "rewrite"
  | "operation-guide"
  | "training-script"
  | "presales";

type TemplateVisualProps = {
  variant?: TemplateVisualVariant;
  active?: boolean;
  className?: string;
};

const variantConfig = {
  "product-manual": { icon: FileText, color: "bg-blue-500", label: "说明书" },
  "feature-update": { icon: RefreshCw, color: "bg-cyan-500", label: "更新" },
  rewrite: { icon: Route, color: "bg-violet-400", label: "改写" },
  "operation-guide": { icon: ClipboardList, color: "bg-slate-700", label: "步骤" },
  "training-script": { icon: Presentation, color: "bg-sky-500", label: "讲稿" },
  presales: { icon: Megaphone, color: "bg-indigo-500", label: "介绍" },
} satisfies Record<TemplateVisualVariant, { icon: typeof FileText; color: string; label: string }>;

export function TemplateVisual({
  variant = "product-manual",
  active,
  className,
}: TemplateVisualProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <div className={cn("rounded-2xl border border-slate-200 bg-slate-50 p-3", className)}>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <Icon className="size-3.5" />
          {config.label}结构
        </div>
        <div className={cn("h-2 w-12 rounded-full", active ? "bg-emerald-400" : "bg-slate-300")} />
      </div>
      <div className="grid gap-2">
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <div className={cn("mb-3 h-2 w-24 rounded-full", config.color)} />
          <div className="space-y-2">
            <div className="h-2 w-full rounded-full bg-slate-200" />
            <div className="h-2 w-5/6 rounded-full bg-slate-200" />
            <div className="h-2 w-2/3 rounded-full bg-slate-100" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[0, 1, 2].map((item) => (
            <div key={item} className="rounded-xl border border-slate-200 bg-white p-2">
              <div className={cn("mb-2 h-1.5 w-7 rounded-full", item === 0 ? config.color : "bg-slate-300")} />
              <div className="h-1.5 w-full rounded-full bg-slate-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
