"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpenText,
  ClipboardList,
  FileCheck2,
  FileText,
  GraduationCap,
  LibraryBig,
  PlayCircle,
  Presentation,
  Route,
  ScrollText,
  Sparkles,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { FeatureCard } from "@/components/feature-card";
import { StatCard } from "@/components/stat-card";
import { demoProjects, getModuleCount, templates } from "@/lib/mock-data";
import { getHistoryRecords } from "@/lib/storage";
import type { HistoryRecord } from "@/lib/types";

const features = [
  {
    title: "产品说明书生成",
    description: "围绕功能概述、页面说明、字段说明和注意事项生成正式说明书初稿。",
    icon: FileText,
  },
  {
    title: "操作手册生成",
    description: "按入口、步骤、结果反馈和常见提醒组织可交付的操作指导内容。",
    icon: ClipboardList,
  },
  {
    title: "培训讲稿生成",
    description: "面向讲解场景组织开场、演示流程、功能讲解和总结提示。",
    icon: GraduationCap,
  },
  {
    title: "售前介绍生成",
    description: "帮助售前和产品团队快速形成清晰、克制、可演示的能力介绍。",
    icon: Presentation,
  },
];

const workflow = ["选择产品类型", "填写模块信息", "上传页面截图", "生成提示词", "回填 AI 输出", "编辑并导出文档"];

const demoFlow = [
  "选择 Demo 项目",
  "选择功能模块",
  "填写关键词和参考写法",
  "生成提示词",
  "回填 AI 输出",
  "编辑并导出 Word",
];

const roles = ["产品经理", "产品运营", "售前顾问", "实施交付", "培训人员"];

const productScope = [
  "SaaS 系统",
  "CRM",
  "ERP",
  "HRM",
  "BI 看板",
  "内容管理系统",
  "协作办公系统",
  "低代码平台",
];

function formatTime(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function DashboardPage() {
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [historyCount, setHistoryCount] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const allRecords = getHistoryRecords();
      setRecords(allRecords.slice(0, 3));
      setHistoryCount(allRecords.length);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const stats = useMemo(
    () => [
      { label: "Demo 项目数", value: demoProjects.length, icon: LibraryBig, hint: "覆盖通用软件产品类型" },
      { label: "模块数量", value: getModuleCount(), icon: ScrollText, hint: "可直接选择并生成初稿" },
      { label: "已生成文档数", value: historyCount, icon: FileText, hint: "来自当前浏览器历史" },
      { label: "可用模板数", value: templates.length, icon: BookOpenText, hint: "支持多类输出结构" },
    ],
    [historyCount]
  );

  return (
    <main className="mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-6 lg:py-10">
      <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
        <div className="grid gap-8 p-6 lg:grid-cols-[1.15fr_0.85fr] lg:p-10">
          <div className="flex flex-col justify-center">
            <Badge className="mb-5 w-fit bg-slate-100 text-slate-700 hover:bg-slate-100">
              Prompt-assisted workflow
            </Badge>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-zinc-950 sm:text-5xl">
              ProdDoc AI
            </h1>
            <p className="mt-4 text-xl font-medium text-zinc-800">
              通用软件产品说明书与操作文档生成工作台
            </p>
            <p className="mt-5 max-w-3xl text-base leading-8 text-zinc-600">
              面向产品经理、产品运营、售前、交付和培训人员的产品文档生成工具。支持基于截图、模块信息、参考写法和输出模板，生成产品说明书、操作手册、培训讲稿、售前介绍和功能补充说明，适用于 SaaS、后台系统、CRM、ERP、HRM、BI 看板、内容管理系统、协作办公平台和低代码平台等多类软件产品。
            </p>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-500">
              第一版聚焦“可控生成”：系统负责整理高质量提示词、保存草稿和组织文档结构，用户保留对 AI 输出、正文编辑和交付文件的最终控制。
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/workspace">
                  进入工作台
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/templates">查看模板</Link>
              </Button>
            </div>
            <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
              {["不接入真实模型 API", "本地草稿与历史", "Word 文档导出"].map((item) => (
                <div key={item} className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-600">
                  <FileCheck2 className="size-4 text-slate-700" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between border-b border-zinc-100 pb-3">
                <div>
                  <div className="text-sm font-semibold text-zinc-950">工作台预览</div>
                  <div className="text-xs text-zinc-500">从模块信息到可导出正文</div>
                </div>
                <Sparkles className="size-5 text-slate-700" />
              </div>
              <div className="mb-4 grid grid-cols-3 gap-2">
                {["基础信息", "提示词", "文档预览"].map((item) => (
                  <div key={item} className="rounded-md bg-zinc-100 px-2 py-2 text-center text-xs font-medium text-zinc-600">
                    {item}
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                {workflow.map((item, index) => (
                  <div key={item} className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                    <div className="flex size-7 items-center justify-center rounded-md bg-slate-900 text-xs font-semibold text-white">
                      {index + 1}
                    </div>
                    <span className="text-sm font-medium text-zinc-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((feature) => (
          <FeatureCard key={feature.title} {...feature} />
        ))}
      </section>

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-zinc-950">生成流程</h2>
            <p className="mt-1 text-sm text-zinc-500">使用提示词辅助流程，保留人工编辑与导出控制。</p>
          </div>
          <PlayCircle className="size-5 text-zinc-500" />
        </div>
        <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
          {workflow.map((item, index) => (
            <Card key={item} className="border-zinc-200 bg-white shadow-sm">
              <CardContent className="p-4">
                <div className="mb-4 flex size-8 items-center justify-center rounded-md bg-zinc-100 text-sm font-semibold text-zinc-700">
                  {index + 1}
                </div>
                <div className="text-sm font-medium text-zinc-950">{item}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-8 grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <Card className="border-zinc-200 bg-white shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Route className="size-5 text-slate-700" />
              <CardTitle className="text-xl">典型使用流程</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3">
              {demoFlow.map((item, index) => (
                <div key={item} className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-medium text-zinc-500">Step {index + 1}</span>
                    <div className="h-px w-10 bg-zinc-200" />
                  </div>
                  <div className="text-sm font-semibold text-zinc-950">{item}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 bg-white shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="size-5 text-slate-700" />
              <CardTitle className="text-xl">适用角色</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {roles.map((role) => (
                <Badge key={role} variant="secondary" className="bg-slate-100 px-3 py-1.5 text-slate-700">
                  {role}
                </Badge>
              ))}
            </div>
            <p className="mt-4 text-sm leading-7 text-zinc-500">
              适合需要把产品功能、页面操作和交付材料快速整理成正式文档的人。
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="mt-8">
        <Card className="border-zinc-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">适用产品类型</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {productScope.map((item) => (
                <div key={item} className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-medium text-zinc-700">
                  {item}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </section>

      <section className="mt-8">
        <Card className="border-zinc-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">最近生成记录</CardTitle>
          </CardHeader>
          <CardContent>
            {records.length ? (
              <div className="grid gap-3 md:grid-cols-3">
                {records.map((record) => (
                  <Link
                    key={record.id}
                    href="/history"
                    className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 transition hover:border-slate-300 hover:bg-white"
                  >
                    <div className="line-clamp-1 text-sm font-semibold text-zinc-950">{record.title}</div>
                    <div className="mt-2 text-xs text-zinc-500">
                      {record.productType} · {record.documentType}
                    </div>
                    <div className="mt-3 text-xs text-zinc-400">{formatTime(record.createdAt)}</div>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                title="暂无生成记录"
                description="进入工作台创建第一份产品文档，保存后会在这里展示最近记录。"
              />
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
