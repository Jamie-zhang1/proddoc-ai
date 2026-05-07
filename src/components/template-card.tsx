"use client";

import { useRouter } from "next/navigation";
import { CheckCircle2, WandSparkles } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { getTemplateConfig } from "@/lib/mock-data";
import { saveActiveTemplate } from "@/lib/storage";
import type { TemplateItem } from "@/lib/types";

type TemplateCardProps = {
  template: TemplateItem;
};

export function TemplateCard({ template }: TemplateCardProps) {
  const router = useRouter();

  function enableTemplate() {
    const config = getTemplateConfig(template);
    const saved = saveActiveTemplate({ ...template, ...config });

    if (!saved) {
      toast.error("模板启用失败，请检查浏览器本地存储");
      return;
    }

    toast.success(`已启用「${template.name}」，正在前往工作台`);
    router.push("/workspace");
  }

  return (
    <Card className="flex h-full flex-col border-zinc-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <CardHeader>
        <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
          <WandSparkles className="size-5" />
        </div>
        <CardTitle className="text-lg">{template.name}</CardTitle>
        <p className="text-sm leading-6 text-zinc-500">适用场景：{template.scenario}</p>
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        <div>
          <div className="text-sm font-medium text-zinc-950">输出结构</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {template.structure.map((item) => (
              <Badge key={item} variant="secondary" className="bg-zinc-100 text-zinc-700">
                {item}
              </Badge>
            ))}
          </div>
        </div>
        <div>
          <div className="text-sm font-medium text-zinc-950">推荐使用对象</div>
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
          variant="outline"
          onClick={enableTemplate}
        >
          <CheckCircle2 className="size-4" />
          启用模板
        </Button>
      </CardFooter>
    </Card>
  );
}
