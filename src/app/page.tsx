"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Download,
  FileText,
  GalleryHorizontalEnd,
  WandSparkles,
} from "lucide-react";
import { toast } from "sonner";
import { IllustrationImage } from "@/components/illustration-image";
import { MotionSection } from "@/components/motion-section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getTemplateConfig, templates } from "@/lib/mock-data";
import { saveActiveTemplate } from "@/lib/storage";
import type { TemplateItem } from "@/lib/types";

const features = [
  {
    title: "结构化提示词生成",
    description: "把模块信息、关键词、参考写法和输出要求整理成清晰可复制的提示词。",
    icon: WandSparkles,
    href: "/workspace",
    action: "去生成提示词",
  },
  {
    title: "API 自动生成正文",
    description: "配置模型服务后，可由服务端 API Route 生成正文；未配置时仍可使用 Mock 文档演示。",
    icon: FileText,
    href: "/workspace",
    action: "去生成文档",
  },
  {
    title: "模板化输出",
    description: "支持产品说明书、操作手册、培训讲稿、售前介绍等常用结构。",
    icon: GalleryHorizontalEnd,
    href: "/templates",
    action: "浏览模板",
  },
  {
    title: "Word 导出与历史",
    description: "本地保存文档记录，支持复查、复制、编辑和导出 Word。",
    icon: Download,
    href: "/history",
    action: "查看历史",
  },
];

const quickTypes = ["产品说明书", "操作手册", "培训讲稿", "售前介绍", "功能补充说明"];


function pickTemplateByLabel(label: string) {
  if (label === "操作手册") return templates.find((template) => template.id === "operation-guide");
  if (label === "培训讲稿") return templates.find((template) => template.id === "training-script");
  if (label === "售前介绍") return templates.find((template) => template.id === "presales-introduction");
  if (label === "功能补充说明") return templates.find((template) => template.id === "feature-addendum");
  return templates.find((template) => template.id === "standard-product-manual");
}

export default function DashboardPage() {
  const router = useRouter();
  const [task, setTask] = useState("");

  function enableTemplate(template: TemplateItem) {
    const config = getTemplateConfig(template);
    const saved = saveActiveTemplate({ ...template, ...config });
    if (!saved) {
      toast.error("模板偏好保存失败，请检查浏览器本地存储");
      return;
    }
    toast.success(`已启用「${template.name}」`);
    router.push("/workspace");
  }

  function startFromQuickType(label: string) {
    const template = pickTemplateByLabel(label);
    if (template) enableTemplate(template);
  }

  function startFromTask() {
    if (!task.trim()) {
      toast.info("可以先从一个文档目标开始，例如为某个功能模块生成操作手册");
    }
    router.push("/workspace");
  }

  return (
    <main className="page-shell space-y-12">
      <MotionSection className="grid-bg relative overflow-hidden rounded-[2rem] border border-slate-200 bg-gradient-to-br from-indigo-50 via-white to-white p-4 shadow-sm dark:border-slate-800 dark:from-indigo-950/30 dark:via-slate-950 dark:to-slate-950 sm:p-6 lg:p-10">
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-indigo-100/60 to-transparent dark:from-indigo-500/10" />
        <div className="relative grid items-center gap-8 lg:grid-cols-[0.92fr_1.08fr]">
        <div className="text-center lg:text-left">
          <Badge className="mb-5 rounded-full bg-indigo-50 px-3 py-1 text-indigo-700 hover:bg-indigo-50 dark:bg-indigo-500/10 dark:text-indigo-300">
            AI 文档生成入口
          </Badge>
          <h1 className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-5xl font-bold tracking-tight text-transparent sm:text-6xl">
            ProdDoc AI
          </h1>
          <p className="mt-4 text-xl font-semibold text-slate-900 dark:text-slate-100">
            通用软件产品说明书与操作文档生成工作台
          </p>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-400 lg:mx-0">
            基于产品模块、关键词、参考写法和模板，辅助生成产品说明书、操作手册、培训讲稿和售前介绍。
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
            <Button asChild size="lg" className="min-h-10 rounded-xl bg-indigo-600 transition hover:scale-[1.02] hover:bg-indigo-500">
              <Link href="/workspace">
                开始生成文档
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="min-h-10 rounded-xl bg-white transition hover:scale-[1.02] dark:bg-slate-900">
              <Link href="/templates">查看模板</Link>
            </Button>
          </div>
        </div>

        <Card className="animate-float rounded-2xl border-slate-200 bg-white/90 shadow-soft transition-shadow dark:border-slate-800 dark:bg-slate-900/90">
          <CardContent className="p-6">
            <IllustrationImage
              src="/images/characters/ai-doc-assistant.svg"
              alt="AI 文档助手人物插画"
              width={420}
              height={303}
              className="py-2"
            />
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {[
                { label: "开始生成", href: "/workspace", icon: "🚀" },
                { label: "浏览模板", href: "/templates", icon: "📋" },
                { label: "查看历史", href: "/history", icon: "🕐" },
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="group rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-center text-sm text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 dark:hover:border-indigo-500/30 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-300"
                >
                  <span className="mr-1">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
        </div>
      </MotionSection>

      <MotionSection>
        <Card className="rounded-2xl border-slate-200 bg-white/95 shadow-soft dark:border-slate-800 dark:bg-slate-900/95">
          <CardHeader className="pb-3 text-center">
            <CardTitle className="text-xl text-slate-900 dark:text-slate-100">你想生成什么产品文档？</CardTitle>
            <p className="text-sm text-slate-600 dark:text-slate-400">输入一个目标，或直接选择下方常用文档类型进入工作台。</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950 sm:flex-row">
              <Input
                value={task}
                onChange={(event) => setTask(event.target.value)}
                placeholder="例如：为 CRM 客户档案模块生成一份操作手册"
                className="h-11 border-0 bg-white shadow-sm placeholder:text-slate-400 dark:bg-slate-900 dark:placeholder:text-slate-500"
              />
              <Button type="button" className="h-11 rounded-xl bg-indigo-600 hover:bg-indigo-500" onClick={startFromTask}>
                开始
              </Button>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {quickTypes.map((label) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => startFromQuickType(label)}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  {label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </MotionSection>

      <MotionSection className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <Link
              key={feature.title}
              href={feature.href}
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-500/30"
            >
              <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition group-hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400">
                <Icon className="size-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{feature.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{feature.description}</p>
              <div className="mt-3 text-sm font-medium text-indigo-600 transition group-hover:text-indigo-500 dark:text-indigo-400">
                {feature.action} →
              </div>
            </Link>
          );
        })}
      </MotionSection>

    </main>
  );
}
