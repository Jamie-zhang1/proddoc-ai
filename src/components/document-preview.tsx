"use client";

import { Clipboard, Download, FileText, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { copyText } from "@/lib/clipboard";
import { exportDocx } from "@/lib/export-docx";
import { saveHistoryRecord } from "@/lib/storage";
import type { HistoryRecord, WorkspaceDraft } from "@/lib/types";

type DocumentPreviewProps = {
  draft: WorkspaceDraft;
  content: string;
  onContentChange: (content: string) => void;
};

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createRecord(draft: WorkspaceDraft, content: string): HistoryRecord {
  return {
    id: createId(),
    title: `${draft.moduleName || "功能模块"}${draft.documentType}`,
    productName: draft.productName,
    productType: draft.productType,
    targetUser: draft.targetUser,
    parentModule: draft.parentModule,
    moduleName: draft.moduleName,
    documentType: draft.documentType,
    content,
    prompt: draft.prompt,
    createdAt: new Date().toISOString(),
    status: "已保存",
  };
}

export function DocumentPreview({ draft, content, onContentChange }: DocumentPreviewProps) {
  const hasContent = content.trim().length > 0;
  const title = `${draft.moduleName || "功能模块"}${draft.documentType}`;

  async function copyContent() {
    if (!hasContent) {
      toast.warning("请先生成或填写文档正文");
      return;
    }

    const copied = await copyText(content);
    if (copied) {
      toast.success("正文已复制");
      return;
    }

    toast.error("当前浏览器不支持自动复制，请手动选择文本复制");
  }

  function saveRecord() {
    if (!hasContent) {
      toast.warning("请先生成或填写文档正文");
      return;
    }

    const saved = saveHistoryRecord(createRecord(draft, content));
    if (saved) {
      toast.success("已保存到历史记录");
      return;
    }

    toast.error("保存失败，请检查浏览器本地存储空间");
  }

  async function handleExport() {
    if (!hasContent) {
      toast.warning("请先生成或填写文档正文");
      return;
    }

    try {
      await exportDocx(createRecord(draft, content));
      toast.success("Word 文档已导出");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "导出失败");
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2">
              <FileText className="size-4 text-slate-700" />
              <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                {draft.documentType}
              </Badge>
            </div>
            <h2 className="truncate text-lg font-semibold tracking-tight text-zinc-950">
              {title}
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              {draft.productName || "未填写产品名称"} · {draft.parentModule || "未填写一级模块"} / {draft.moduleName || "未填写功能模块"}
            </p>
          </div>
        </div>

        <Separator className="my-4" />

        <div className="grid gap-2 text-xs text-zinc-500 sm:grid-cols-2">
          <div>产品类型：{draft.productType}</div>
          <div>目标用户：{draft.targetUser}</div>
          <div>输出风格：{draft.outputStyle}</div>
          <div>详细程度：{draft.detailLevel}</div>
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="outline" onClick={copyContent} disabled={!hasContent}>
          <Clipboard className="size-4" />
          复制正文
        </Button>
        <Button type="button" variant="outline" onClick={saveRecord} disabled={!hasContent}>
          <Save className="size-4" />
          保存历史
        </Button>
        <Button type="button" onClick={handleExport} disabled={!hasContent}>
          <Download className="size-4" />
          导出 Word
        </Button>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-3 shadow-inner">
        {!hasContent ? (
          <EmptyState
            title="暂无文档预览"
            description="点击生成 Mock 文档，或将外部 AI 输出粘贴到正文编辑区后保存和导出。"
            className="mb-3 min-h-44"
          />
        ) : null}
        <Textarea
          value={content}
          onChange={(event) => onContentChange(event.target.value)}
          placeholder="将外部 AI 输出粘贴到这里，或点击生成 Mock 文档。"
          className="min-h-[46vh] resize-none border-0 bg-white font-mono text-sm leading-7 shadow-none focus-visible:ring-0"
        />
      </div>
    </div>
  );
}
