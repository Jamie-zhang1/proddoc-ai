import { FolderOpen, Search } from "lucide-react";
import { cn } from "@/lib/utils";

type EmptyHistoryProps = {
  className?: string;
};

export function EmptyHistory({ className }: EmptyHistoryProps) {
  return (
    <div className={cn("relative mx-auto w-full max-w-sm", className)}>
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <FolderOpen className="size-6" />
          </div>
          <div className="flex-1">
            <div className="h-2 w-28 rounded-full bg-slate-900" />
            <div className="mt-2 h-2 w-20 rounded-full bg-slate-200" />
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="mb-3 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
            <Search className="size-3.5 text-slate-400" />
            <div className="h-2 flex-1 rounded-full bg-slate-200" />
          </div>
          <div className="space-y-2">
            {[84, 68, 76].map((width) => (
              <div key={width} className="rounded-lg border border-slate-200 bg-white p-2">
                <div className="h-2 rounded-full bg-slate-300" style={{ width: `${width}%` }} />
                <div className="mt-2 h-2 w-2/5 rounded-full bg-slate-100" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="absolute -right-2 top-8 size-4 rounded-full bg-cyan-200 shadow-lg shadow-cyan-900/10" />
      <div className="absolute -left-2 bottom-10 size-3 rounded-full bg-violet-200 shadow-lg shadow-violet-900/10" />
    </div>
  );
}
