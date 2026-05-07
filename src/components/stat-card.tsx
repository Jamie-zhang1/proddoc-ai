import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type StatCardProps = {
  label: string;
  value: string | number;
  icon: LucideIcon;
  hint: string;
};

export function StatCard({ label, value, icon: Icon, hint }: StatCardProps) {
  return (
    <Card className="border-zinc-200 bg-white shadow-sm transition hover:border-slate-300 hover:shadow-md">
      <CardContent className="p-5">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex size-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
            <Icon className="size-4" />
          </div>
          <div className="h-1.5 w-12 rounded-full bg-zinc-100">
            <div className="h-1.5 w-8 rounded-full bg-slate-500" />
          </div>
        </div>
        <div>
          <p className="text-sm text-zinc-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-950">{value}</p>
          <p className="mt-1 text-xs text-zinc-500">{hint}</p>
        </div>
      </CardContent>
    </Card>
  );
}
