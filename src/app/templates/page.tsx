"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GalleryHorizontalEnd, Layers3, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/empty-state";
import { IllustrationImage } from "@/components/illustration-image";
import { MotionSection } from "@/components/motion-section";
import { TemplateCard } from "@/components/template-card";
import { TemplateImporter } from "@/components/template-importer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getTemplateConfig, templates } from "@/lib/mock-data";
import {
  deleteCustomTemplate,
  getActiveTemplate,
  getCustomTemplates,
  saveActiveTemplate,
} from "@/lib/storage";
import type { CustomTemplate } from "@/lib/types";

export default function TemplatesPage() {
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
  const [customTemplates, setCustomTemplates] = useState<CustomTemplate[]>([]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setActiveTemplateId(getActiveTemplate()?.id ?? null);
      setCustomTemplates(getCustomTemplates());
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  function enableCustomTemplate(template: CustomTemplate) {
    const config = getTemplateConfig(templates[0]);
    const structure = template.outline.map((item) => item.titlePattern).filter(Boolean);
    const saved = saveActiveTemplate({
      id: template.id,
      name: template.name,
      scenario: template.description,
      structure: structure.length ? structure : ["功能概述", "页面说明", "操作流程", "注意事项"],
      audience: ["自定义"],
      ...config,
      customTemplate: template,
    });

    if (!saved) {
      toast.error("自定义模板启用失败，请检查浏览器本地存储");
      return;
    }

    setActiveTemplateId(template.id);
    toast.success(`已启用「${template.name}」`);
  }

  function removeCustomTemplate(template: CustomTemplate) {
    const confirmed = window.confirm(`确认删除自定义模板「${template.name}」吗？`);
    if (!confirmed) return;
    const nextTemplates = deleteCustomTemplate(template.id);
    setCustomTemplates(nextTemplates);
    if (activeTemplateId === template.id) setActiveTemplateId(null);
    toast.success("自定义模板已删除");
  }

  const activeName =
    templates.find((template) => template.id === activeTemplateId)?.name ||
    customTemplates.find((template) => template.id === activeTemplateId)?.name ||
    "尚未启用模板";

  return (
    <main className="page-shell space-y-8">
      <MotionSection className="overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-indigo-50 via-white to-white p-6 shadow-sm dark:border-slate-800 dark:from-indigo-950/30 dark:via-slate-950 dark:to-slate-950">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <Badge className="mb-4 rounded-full bg-indigo-50 text-indigo-700 hover:bg-indigo-50 dark:bg-indigo-500/10 dark:text-indigo-300">
              模板选择
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              选择一种文档模板
            </h1>
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-400">
              模板会影响 Workspace 的文档类型、输出风格和提示词结构。现在也可以从旧说明书中解析出可复用的自定义模板。
            </p>
          </div>
          <div className="grid min-w-64 gap-2 rounded-2xl border border-indigo-100 bg-indigo-50 p-4 dark:border-indigo-500/20 dark:bg-indigo-500/10">
            <div className="flex items-center gap-2 text-sm font-semibold text-indigo-700 dark:text-indigo-300">
              <Layers3 className="size-4" />
              当前启用
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">{activeName}</div>
          </div>
        </div>
        <IllustrationImage
          src="/images/template-documents.svg"
          alt="文档模板插画"
          width={300}
          height={242}
          className="mt-4 lg:hidden"
        />
      </MotionSection>

      <MotionSection>
        <TemplateImporter onSaved={() => setCustomTemplates(getCustomTemplates())} />
      </MotionSection>

      <MotionSection className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400">
          <GalleryHorizontalEnd className="size-4" />
          <h2 className="text-sm font-medium">系统文档模板</h2>
        </div>
      </MotionSection>

      <MotionSection className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {templates.length ? (
          templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              active={template.id === activeTemplateId}
              onEnabled={setActiveTemplateId}
            />
          ))
        ) : (
          <div className="md:col-span-2 xl:col-span-3">
            <EmptyState
              title="暂无可用模板"
              description="可以先前往工作台，使用默认模板生成第一份文档。"
              illustration={
                <IllustrationImage
                  src="/images/template-documents.svg"
                  alt="模板空状态插画"
                  width={300}
                  height={242}
                />
              }
              action={
                <Button asChild className="rounded-xl bg-indigo-600 hover:bg-indigo-500">
                  <Link href="/workspace">去工作台</Link>
                </Button>
              }
            />
          </div>
        )}
      </MotionSection>

      {customTemplates.length ? (
        <MotionSection className="space-y-4">
          <div>
            <Badge variant="secondary" className="mb-2 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
              自定义模板
            </Badge>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              已保存的旧文件模板
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {customTemplates.map((template) => (
              <div
                key={template.id}
                className="hover-lift flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <Badge className="mb-2 bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
                      自定义
                    </Badge>
                    <h3 className="text-base font-medium text-slate-900 dark:text-slate-100">
                      {template.name}
                    </h3>
                  </div>
                  {activeTemplateId === template.id ? (
                    <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                      当前启用
                    </Badge>
                  ) : null}
                </div>
                <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">
                  {template.description}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {template.outline.slice(0, 4).map((item, index) => (
                    <Badge key={`${item.titlePattern}-${index}`} variant="secondary">
                      H{item.level} {item.titlePattern}
                    </Badge>
                  ))}
                </div>
                <div className="mt-auto flex gap-2 pt-5">
                  <Button
                    type="button"
                    className="flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-500"
                    onClick={() => enableCustomTemplate(template)}
                  >
                    启用模板
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="rounded-xl bg-white dark:bg-slate-900"
                    onClick={() => removeCustomTemplate(template)}
                    aria-label={`删除 ${template.name}`}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </MotionSection>
      ) : null}
    </main>
  );
}
