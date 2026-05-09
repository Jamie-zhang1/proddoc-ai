"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  BookOpenText,
  ClipboardList,
  FileText,
  History,
  Search,
  TimerReset,
} from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/empty-state";
import { HistoryTable } from "@/components/history-table";
import { IllustrationImage } from "@/components/illustration-image";
import { MotionSection } from "@/components/motion-section";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { documentTypes } from "@/lib/mock-data";
import { deleteHistoryRecord, getHistoryRecords } from "@/lib/storage";
import type { DocumentType, HistoryRecord } from "@/lib/types";

type DocumentFilter = "全部" | DocumentType;

export default function HistoryPage() {
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [query, setQuery] = useState("");
  const [documentFilter, setDocumentFilter] = useState<DocumentFilter>("全部");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setRecords(getHistoryRecords());
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  function handleDelete(id: string) {
    setRecords(deleteHistoryRecord(id));
    toast.success("历史记录已删除");
  }

  const filteredRecords = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return records.filter((record) => {
      const matchesDocumentType =
        documentFilter === "全部" || record.documentType === documentFilter;
      const haystack = [
        record.title,
        record.productName,
        record.productType,
        record.parentModule,
        record.moduleName,
        record.documentType,
      ]
        .join(" ")
        .toLowerCase();

      return matchesDocumentType && (!normalizedQuery || haystack.includes(normalizedQuery));
    });
  }, [documentFilter, query, records]);

  const stats = useMemo(
    () => [
      {
        label: "全部文档",
        value: records.length,
        icon: FileText,
        hint: "当前浏览器本地记录",
      },
      {
        label: "产品说明书",
        value: records.filter((record) => record.documentType === "产品说明书").length,
        icon: BookOpenText,
        hint: "正式说明书类文档",
      },
      {
        label: "操作手册",
        value: records.filter((record) => record.documentType === "操作手册").length,
        icon: ClipboardList,
        hint: "交付与培训操作指导",
      },
      {
        label: "最近生成",
        value: records[0]
          ? new Intl.DateTimeFormat("zh-CN", { month: "2-digit", day: "2-digit" }).format(
              new Date(records[0].createdAt)
            )
          : "-",
        icon: TimerReset,
        hint: "最新一条保存记录",
      },
    ],
    [records]
  );

  return (
    <main className="page-shell space-y-8">
      <MotionSection className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">文档历史</h1>
          <h2 className="mt-1 text-sm font-medium text-indigo-700 dark:text-indigo-300">历史记录</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-400">
            管理本地保存的产品文档草稿和生成记录，支持查看详情、搜索筛选、复制正文和删除记录。
          </p>
        </div>
        <Button asChild className="min-h-10 w-fit rounded-xl bg-indigo-600 hover:bg-indigo-500">
          <Link href="/workspace">进入工作台</Link>
        </Button>
      </MotionSection>

      <MotionSection className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </MotionSection>

      {records.length ? (
        <>
          <MotionSection className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="h-11 rounded-xl bg-slate-50 pl-9 focus-visible:ring-2 focus-visible:ring-indigo-500 dark:bg-slate-950"
                placeholder="搜索文档标题、产品名称、产品类型、所属模块或文档类型"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {(["全部", ...documentTypes] as DocumentFilter[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setDocumentFilter(type)}
                  className={
                    documentFilter === type
                      ? "min-h-10 rounded-full bg-indigo-600 px-4 text-sm font-medium text-white shadow-sm"
                      : "min-h-10 rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 dark:hover:bg-slate-800"
                  }
                >
                  {type === "全部" ? "全部文档类型" : type}
                </button>
              ))}
            </div>
          </MotionSection>

          {filteredRecords.length ? (
            <HistoryTable records={filteredRecords} onDelete={handleDelete} />
          ) : (
            <EmptyState
              icon={Search}
              title="没有找到匹配的文档"
              description="请调整关键词或文档类型筛选条件。"
              illustration={
                <IllustrationImage
                  src="/images/characters/empty-state-character.svg"
                  alt="本地文档库人物插画"
                  width={300}
                  height={225}
                />
              }
            />
          )}
        </>
      ) : (
        <EmptyState
          icon={History}
          title="暂无文档记录"
          description="前往工作台生成第一份文档，保存后会在这里展示文档标题、产品信息、模块和创建时间。"
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
                  <Link href="/workspace">前往工作台生成第一份文档</Link>
                </Button>
          }
        />
      )}
    </main>
  );
}
