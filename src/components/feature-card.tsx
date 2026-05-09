import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type FeatureCardProps = {
  title: string;
  description: string;
  icon: LucideIcon;
};

export function FeatureCard({ title, description, icon: Icon }: FeatureCardProps) {
  return (
    <Card className="border-zinc-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
      <CardContent className="p-5">
        <div className="mb-5 flex size-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700 ring-1 ring-zinc-200">
          <Icon className="size-5" />
        </div>
        <h3 className="text-base font-semibold text-zinc-950">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-zinc-500">{description}</p>
      </CardContent>
    </Card>
  );
}
