import { FilePenLine, WandSparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type EmptyDocumentProps = {
  className?: string;
};

export function EmptyDocument({ className }: EmptyDocumentProps) {
  return (
    <div className={cn("relative mx-auto w-full max-w-sm", className)}>
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-lg shadow-slate-900/5">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="h-2 w-32 rounded-full bg-slate-900" />
            <FilePenLine className="size-4 text-blue-600" />
          </div>
          <div className="space-y-3">
            {[90, 78, 84, 66, 74].map((width) => (
              <div key={width} className="space-y-2">
                <div className="h-2 rounded-full bg-slate-200" style={{ width: `${width}%` }} />
                <div className="h-2 rounded-full bg-slate-100" style={{ width: `${Math.max(width - 16, 46)}%` }} />
              </div>
            ))}
          </div>
          <div className="mt-5 flex items-center gap-2">
            <div className="h-5 w-1 rounded-full bg-blue-500" />
            <div className="h-2 w-24 rounded-full bg-slate-300" />
          </div>
        </div>
      </div>
      <div className="absolute -bottom-3 -right-2 flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700 shadow-lg shadow-blue-900/10">
        <WandSparkles className="size-4" />
        生成中枢
      </div>
    </div>
  );
}
