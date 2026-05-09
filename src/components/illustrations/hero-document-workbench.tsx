import { Bot, Download, FileText, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type HeroDocumentWorkbenchProps = {
  className?: string;
};

export function HeroDocumentWorkbench({ className }: HeroDocumentWorkbenchProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 text-slate-950 shadow-2xl shadow-blue-900/10",
        className
      )}
    >
      <div className="pointer-events-none absolute -right-16 -top-16 size-52 rounded-full bg-sky-300/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 left-16 size-56 rounded-full bg-violet-300/20 blur-3xl" />

      <div className="relative mb-4 flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-slate-950">AI 文档工作台预览</div>
          <div className="text-xs text-slate-500">模块目录、生成配置与文档预览并列组织</div>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs text-blue-700">
          <Sparkles className="size-3.5" />
          Prompt-ready
        </div>
      </div>

      <div className="relative grid min-h-[360px] gap-3 lg:grid-cols-[0.78fr_1fr_1.08fr]">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <div className="mb-3 flex items-center gap-2 text-xs font-medium text-slate-500">
            <FileText className="size-3.5" />
            产品模块目录
          </div>
          <div className="space-y-2">
            {["客户管理", "商机管理", "合同管理"].map((item, index) => (
              <div
                key={item}
                className={cn(
                  "rounded-lg border px-3 py-2 text-xs",
                  index === 0
                    ? "border-blue-100 bg-white font-semibold text-slate-950 shadow-sm"
                    : "border-slate-200 bg-white/70 text-slate-500"
                )}
              >
                {item}
              </div>
            ))}
          </div>
          <div className="mt-5 space-y-2">
            {["客户列表", "客户档案", "跟进记录"].map((item, index) => (
              <div key={item} className="flex items-center gap-2 text-xs text-slate-500">
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    index === 0 ? "bg-cyan-400" : "bg-slate-300"
                  )}
                />
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-blue-50/60 p-3">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-xs font-medium text-slate-600">生成配置</div>
            <Bot className="size-4 text-blue-600" />
          </div>
          <div className="space-y-2">
            {[
              ["产品类型", 72],
              ["文档类型", 64],
              ["输出风格", 58],
            ].map(([label, width]) => (
              <div key={label} className="rounded-xl border border-blue-100 bg-white p-3 shadow-sm">
                <div className="mb-2 text-[11px] text-slate-500">{label}</div>
                <div className="h-2 rounded-full bg-slate-200">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-cyan-200 to-blue-400"
                    style={{ width: `${width}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-xl border border-dashed border-cyan-200 bg-cyan-50 p-3">
            <div className="text-xs font-medium text-slate-700">提示词结构</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {["模块说明", "操作流程", "字段说明"].map((item) => (
                <span key={item} className="rounded-md bg-white px-2 py-1 text-[11px] text-slate-600 shadow-sm">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-slate-950">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <div className="text-sm font-semibold">产品说明书初稿</div>
              <div className="mt-1 text-xs text-slate-500">可编辑 · 可保存 · 可导出</div>
            </div>
            <Download className="size-4 text-blue-600" />
          </div>
          <div className="space-y-3">
            {[92, 76, 86, 68, 80].map((width, index) => (
              <div key={`${width}-${index}`} className="space-y-2">
                {index === 0 ? <div className="h-2 w-28 rounded-full bg-slate-900" /> : null}
                <div className="h-2 rounded-full bg-slate-300" style={{ width: `${width}%` }} />
                <div className="h-2 rounded-full bg-slate-200" style={{ width: `${Math.max(width - 18, 42)}%` }} />
              </div>
            ))}
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2">
            {["复制", "保存", "导出"].map((item) => (
              <div key={item} className="rounded-lg border border-slate-200 bg-white py-2 text-center text-xs font-medium text-slate-600">
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
