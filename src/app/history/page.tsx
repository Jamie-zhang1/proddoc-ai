"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  BookOpenText,
  ClipboardList,
  Cpu,
  FileText,
  History,
  Search,
  Sparkles,
  TimerReset,
  WandSparkles,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/empty-state";
import { HistoryTable } from "@/components/history-table";
import { IllustrationImage } from "@/components/illustration-image";
import { MotionSection } from "@/components/motion-section";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { deleteActivity, deleteHistoryRecord, getActivityLog, getHistoryRecords } from "@/lib/storage";
import type {
  DocumentType,
  HistoryActivity,
  HistoryActivityType,
  HistoryRecord,
} from "@/lib/types";

type ActivityFilter = "全部" | HistoryActivityType;

const activityFilterLabels: Record<ActivityFilter, string> = {
  "全部": "全部",
  "document": "文档",
  "prompt": "提示词",
  "template-export": "模板导出",
  "api-call": "API 调用",
};

const activityTypeIcons: Record<HistoryActivityType, typeof FileText> = {
  "document": FileText,
  "prompt": WandSparkles,
  "template-export": BookOpenText,
  "api-call": Cpu,
};

function formatTime(iso: string) {
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return "-";
  }
}

export default function HistoryPage() {
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [activities, setActivities] = useState<HistoryActivity[]>([]);
  const [query, setQuery] = useState("");
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>("全部");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setRecords(getHistoryRecords());
      setActivities(getActivityLog());
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  function handleDeleteHistory(id: string) {
    setRecords(deleteHistoryRecord(id));
    toast.success("历史记录已删除");
  }

  function handleDeleteActivity(id: string) {
    setActivities(deleteActivity(id));
    toast.success("活动记录已删除");
  }

  const filteredActivities = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return activities.filter((a) => {
      const matchesFilter = activityFilter === "全部" || a.type === activityFilter;
      const haystack = [a.title, a.description, a.productName ?? "", a.moduleName ?? ""]
        .join(" ")
        .toLowerCase();
      return matchesFilter && (!normalizedQuery || haystack.includes(normalizedQuery));
    });
  }, [activityFilter, query, activities]);

  const activityStats = useMemo(() => {
    const counts: Record<HistoryActivityType, number> = {
      document: 0,
      prompt: 0,
      "template-export": 0,
      "api-call": 0,
    };
    for (const a of activities) {
      counts[a.type]++;
    }
    return counts;
  }, [activities]);

  const totalCount = records.length + activities.length;

  return (
    <main className="page-shell space-y-8">
      <MotionSection className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">活动历史</h1>
          <h2 className="mt-1 text-sm font-medium text-indigo-700 dark:text-indigo-300">历史记录</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-400">
            查看所有活动记录，包括生成的文档、提示词、模板导出和 API 调用。支持搜索筛选、查看详情和删除。
          </p>
        </div>
        <Button asChild className="min-h-10 w-fit rounded-xl bg-indigo-600 hover:bg-indigo-500">
          <Link href="/workspace">进入工作台</Link>
        </Button>
      </MotionSection>

      <MotionSection className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="全部活动"
          value={totalCount}
          icon={History}
          hint="文档 + 提示词 + 模板导出 + API 调用"
        />
        <StatCard
          label="生成文档"
          value={activityStats.document}
          icon={FileText}
          hint="Mock 文档与保存记录"
        />
        <StatCard
          label="生成提示词"
          value={activityStats.prompt}
          icon={WandSparkles}
          hint="结构化提示词"
        />
        <StatCard
          label="API 调用"
          value={activityStats["api-call"]}
          icon={Cpu}
          hint="模型服务生成"
        />
      </MotionSection>

      {/* Search and filter */}
      <MotionSection className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="relative rounded-xl transition-all duration-300 focus-within:scale-[1.01] focus-within:shadow-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="h-11 rounded-xl bg-slate-50 pl-9 focus-visible:ring-2 focus-visible:ring-indigo-500 dark:bg-slate-950"
            placeholder="搜索标题、产品名称、模块..."
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(["全部", "document", "prompt", "template-export", "api-call"] as ActivityFilter[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setActivityFilter(type)}
              className={
                activityFilter === type
                  ? "min-h-10 rounded-full bg-indigo-600 px-4 text-sm font-medium text-white shadow-sm"
                  : "min-h-10 rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 dark:hover:bg-slate-800"
              }
            >
              {activityFilterLabels[type]}
            </button>
          ))}
        </div>
      </MotionSection>

      {/* Activity list */}
      {filteredActivities.length > 0 ? (
        <MotionSection className="space-y-3">
          {filteredActivities.map((activity) => {
            const Icon = activityTypeIcons[activity.type] ?? FileText;
            return (
              <div
                key={activity.id}
                className="group flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-indigo-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-500/30"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                  <Icon className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {activity.title}
                    </h3>
                    <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                      {activityFilterLabels[activity.type]}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{activity.description}</p>
                  <div className="mt-2 flex items-center gap-3 text-xs text-slate-400">
                    <span>{formatTime(activity.createdAt)}</span>
                    {activity.productName && <span>产品: {activity.productName}</span>}
                    {activity.moduleName && <span>模块: {activity.moduleName}</span>}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteActivity(activity.id)}
                  className="shrink-0 rounded-lg p-1 text-slate-400 opacity-0 transition hover:bg-slate-100 hover:text-red-500 group-hover:opacity-100 dark:hover:bg-slate-800"
                  title="删除"
                >
                  <X className="size-4" />
                </button>
              </div>
            );
          })}
        </MotionSection>
      ) : totalCount > 0 ? (
        <EmptyState
          icon={Search}
          title="没有找到匹配的活动"
          description="请调整关键词或筛选条件。"
          illustration={
            <IllustrationImage
              src="/images/characters/empty-state-character.svg"
              alt="本地文档库人物插画"
              width={300}
              height={225}
            />
          }
        />
      ) : (
        <EmptyState
          icon={History}
          title="暂无活动记录"
          description="前往工作台生成文档、提示词，或使用 API 调用后，活动记录会在这里展示。"
          illustration={
            <IllustrationImage
              src="/images/characters/empty-state-character.svg"
              alt="本地文档库人物插画"
              width={300}
              height={225}
            />
          }
          action={
            <Button asChild className="rounded-xl bg-indigo-600 hover:bg-indigo-500">
              <Link href="/workspace">前往工作台</Link>
            </Button>
          }
        />
      )}
    </main>
  );
}
