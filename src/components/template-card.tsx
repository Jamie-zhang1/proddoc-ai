"use client";

import { useRouter } from "next/navigation";
import { CheckCircle2, WandSparkles } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TemplateVisual,
  type TemplateVisualVariant,
} from "@/components/illustrations/template-visual";
import { getTemplateConfig } from "@/lib/mock-data";
import { saveActiveTemplate } from "@/lib/storage";
import type { TemplateItem } from "@/lib/types";

type TemplateCardProps = {
  template: TemplateItem;
  active?: boolean;
  onEnabled?: (id: string) => void;
};

const templateVariants: Record<string, TemplateVisualVariant> = {
  "standard-product-manual": "product-manual",
  "feature-addendum": "feature-update",
  "similar-module-rewrite": "rewrite",
  "operation-guide": "operation-guide",
  "training-script": "training-script",
  "presales-introduction": "presales",
};

export function TemplateCard({ template, active, onEnabled }: TemplateCardProps) {
  const router = useRouter();

  function enableTemplate() {
    const config = getTemplateConfig(template);
    const saved = saveActiveTemplate({ ...template, ...config });

    if (!saved) {
      toast.error("模板启用失败，请检查浏览器本地存储");
      return;
    }

    onEnabled?.(template.id);
    toast.success(`已启用「${template.name}」，正在前往工作台`);
    router.push("/workspace");
  }

  return (
    <Card className={active ? "hover-lift flex h-full flex-col rounded-2xl border-indigo-200 border-l-indigo-600 border-l-4 bg-indigo-50/60 shadow-md ring-1 ring-indigo-100 dark:border-indigo-500/30 dark:border-l-indigo-400 dark:bg-indigo-500/10" : "hover-lift flex h-full flex-col rounded-2xl border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"}>
      <CardHeader>
        <div className="mb-4 overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-violet-50 p-4 dark:border-indigo-500/20 dark:from-indigo-500/10 dark:to-violet-500/10">
          <div className="flex items-start justify-between gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-sm shadow-indigo-600/20">
              <WandSparkles className="size-5" />
            </div>
            {active ? (
              <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-300">
                当前启用
              </Badge>
            ) : null}
          </div>
          <TemplateVisual
            active={active}
            variant={templateVariants[template.id] ?? "product-manual"}
          />
        </div>
        <CardTitle className="text-base font-medium text-slate-900 dark:text-slate-100">{template.name}</CardTitle>
        <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">适用场景：{template.scenario}</p>
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        <div>
          <div className="text-sm font-medium text-slate-900 dark:text-slate-100">输出结构</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {template.structure.map((item) => (
              <Badge key={item} variant="secondary" className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {item}
              </Badge>
            ))}
          </div>
        </div>
        <div>
          <div className="text-sm font-medium text-slate-900 dark:text-slate-100">推荐使用对象</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {template.audience.map((item) => (
              <Badge key={item} variant="outline">
                {item}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          type="button"
          className="w-full"
          variant={active ? "default" : "outline"}
          onClick={enableTemplate}
        >
          <CheckCircle2 className="size-4" />
          启用并进入工作台
        </Button>
      </CardFooter>
    </Card>
  );
}
