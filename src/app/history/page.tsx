"use client";

import { useEffect, useMemo, useState } from "react";
import { Filter, History, Search } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/empty-state";
import { HistoryTable } from "@/components/history-table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

  return (
    <main className="mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-6">
      <section className="mb-6 flex items-end justify-between gap-4">
        <div className="max-w-3xl">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">历史记录</h1>
          <p className="mt-3 text-base leading-7 text-zinc-600">
            查看本地保存的文档结果，支持查看详情、复制正文和删除记录。数据仅保存在当前浏览器 localStorage 中。
          </p>
        </div>
      </section>

      {records.length ? (
        <>
          <section className="mb-4 grid gap-3 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_240px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="pl-9"
                placeholder="搜索文档标题、产品名称、产品类型、所属模块或文档类型"
              />
            </div>
            <Select
              value={documentFilter}
              onValueChange={(value: DocumentFilter) => setDocumentFilter(value)}
            >
              <SelectTrigger className="w-full">
                <Filter className="size-4 text-zinc-500" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="全部">全部文档类型</SelectItem>
                {documentTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </section>

          {filteredRecords.length ? (
            <HistoryTable records={filteredRecords} onDelete={handleDelete} />
          ) : (
            <EmptyState
              icon={Search}
              title="没有匹配的历史记录"
              description="请调整搜索关键词或文档类型筛选条件。"
            />
          )}
        </>
      ) : (
        <EmptyState
          icon={History}
          title="暂无历史记录"
          description="在工作台生成文档并保存后，这里会展示文档标题、产品信息、模块和创建时间。"
        />
      )}
    </main>
  );
}
