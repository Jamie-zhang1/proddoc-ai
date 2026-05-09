import { Bot, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type EmptyPromptProps = {
  className?: string;
};

export function EmptyPrompt({ className }: EmptyPromptProps) {
  return (
    <div className={cn("relative mx-auto w-full max-w-sm", className)}>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-lg shadow-slate-900/5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <Sparkles className="size-4 text-blue-600" />
            Prompt Structure
          </div>
          <div className="rounded-full bg-cyan-100 px-2 py-1 text-[11px] text-slate-600">Draft</div>
        </div>
        <div className="space-y-3">
          <div className="h-2 w-24 rounded-full bg-slate-900" />
          {[86, 72, 94, 64].map((width) => (
            <div key={width} className="h-2 rounded-full bg-slate-200" style={{ width: `${width}%` }} />
          ))}
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="h-2 w-12 rounded-full bg-blue-500" />
            <div className="mt-2 h-2 w-20 rounded-full bg-slate-200" />
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="h-2 w-12 rounded-full bg-violet-400" />
            <div className="mt-2 h-2 w-20 rounded-full bg-slate-200" />
          </div>
        </div>
      </div>
      <div className="absolute -right-3 -top-4 flex size-12 items-center justify-center rounded-2xl border border-cyan-100 bg-cyan-50 text-blue-600 shadow-lg shadow-blue-900/10">
        <Bot className="size-6" />
      </div>
    </div>
  );
}
