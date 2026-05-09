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
    <Card className="hover-lift rounded-2xl border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <CardContent className="p-6">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex size-10 items-center justify-center rounded-xl bg-slate-900 text-white dark:bg-indigo-600">
            <Icon className="size-4" />
          </div>
          <div className="h-1.5 w-12 rounded-full bg-slate-100 dark:bg-slate-800">
            <div className="h-1.5 w-8 rounded-full bg-indigo-600" />
          </div>
        </div>
        <div>
          <p className="text-sm text-slate-600 dark:text-slate-400">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{value}</p>
          <p className="mt-1 text-xs text-slate-400">{hint}</p>
        </div>
      </CardContent>
    </Card>
  );
}
