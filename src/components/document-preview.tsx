"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  Clipboard,
  Download,
  FileText,
  Loader2,
  Maximize2,
  RotateCcw,
  Save,
  Trash2,
  WandSparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { EmptyState } from "@/components/empty-state";
import { IllustrationImage } from "@/components/illustration-image";
import { copyText } from "@/lib/clipboard";
import { exportDocx } from "@/lib/export-docx";
import { saveActiveDocument, saveHistoryRecord } from "@/lib/storage";
import type { GeneratedBy, HistoryRecord, WorkspaceDraft } from "@/lib/types";

type DocumentPreviewProps = {
  draft: WorkspaceDraft;
  content: string;
  onContentChange: (content: string) => void;
  onGenerateDocument?: () => void;
  generating?: boolean;
};

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createRecord(draft: WorkspaceDraft, content: string): HistoryRecord {
  const generatedBy: GeneratedBy =
    draft.generationMode === "api"
      ? "api"
      : draft.generationMode === "mock"
        ? "mock"
        : "prompt-assisted";

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
    generationMode: draft.generationMode,
    generatedBy,
    createdAt: new Date().toISOString(),
    status: "已保存",
  };
}

function compactText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function getGenerationMethod(draft: WorkspaceDraft, content: string) {
  if (draft.longDocumentPlan) return "长文分章节生成";
  if (
    content.trim() &&
    draft.initialDocumentContent?.trim() &&
    content.trim() !== draft.initialDocumentContent.trim()
  ) {
    return "局部改写结果";
  }
  if (draft.generationMode === "api") return "API 生成";
  if (draft.generationMode === "mock") return "Mock 文档";
  return "提示词辅助生成";
}

function getDocumentStatus(draft: WorkspaceDraft, hasContent: boolean, generating?: boolean) {
  const chapters = draft.longDocumentPlan?.chapters ?? [];
  const longGenerating = chapters.some((chapter) => chapter.status === "generating");

  if (generating) return "正在生成";
  if (longGenerating) return "长文生成中";
  if (!hasContent) return "未生成";
  if (
    draft.initialDocumentContent?.trim() &&
    draft.documentContent.trim() !== draft.initialDocumentContent.trim()
  ) {
    return "已保存草稿";
  }
  return "已生成";
}

function StatBlock({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-950">
      <div className="text-xs text-slate-500 dark:text-slate-400">{label}</div>
      <div className="mt-1 truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
        {value}
      </div>
    </div>
  );
}

export function DocumentPreview({
  draft,
  content,
  onContentChange,
  onGenerateDocument,
  generating,
}: DocumentPreviewProps) {
  const router = useRouter();
  const [showExportDialog, setShowExportDialog] = useState(false);
  const trimmedContent = content.trim();
  const hasContent = trimmedContent.length > 0;
  const title = `${draft.moduleName || "功能模块"}${draft.documentType}`;
  const longPlan = draft.longDocumentPlan;
  const chapters = longPlan?.chapters ?? [];
  const completedChapters = chapters.filter((chapter) => chapter.status === "done").length;
  const failedChapters = chapters.filter((chapter) => chapter.status === "failed").length;
  const completedChars = chapters.reduce((sum, chapter) => sum + chapter.content.length, 0);
  const status = getDocumentStatus(draft, hasContent, generating);
  const generationMethod = getGenerationMethod(draft, content);

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

  async function handleExport(format: "formal" | "minimal" | "with-header-footer" = "formal") {
    if (!hasContent) {
      toast.warning("请先生成或填写文档正文");
      return;
    }

    try {
      await exportDocx(createRecord(draft, content), { format });
      toast.success("Word 文档已导出");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "导出失败");
    } finally {
      setShowExportDialog(false);
    }
  }

  function openEditor() {
    if (!hasContent) {
      toast.warning("请先生成或输入文档内容");
      return;
    }

    const saved = saveActiveDocument({
      draft: { ...draft, documentContent: content },
      content,
      initialContent: draft.initialDocumentContent,
      longPlan: draft.longDocumentPlan,
      updatedAt: new Date().toISOString(),
    });

    if (!saved) {
      toast.error("打开编辑器前保存当前文档失败，请检查本地存储空间");
      return;
    }

    router.push("/editor");
  }

  function restoreInitialContent() {
    if (!draft.initialDocumentContent?.trim()) {
      toast.warning("当前没有可恢复的初始生成结果");
      return;
    }

    onContentChange(draft.initialDocumentContent);
    toast.success("已恢复初始生成结果");
  }

  function clearContent() {
    if (!hasContent) return;
    onContentChange("");
    toast.success("结果已清空");
  }

  // Close export dialog on Escape
  useEffect(() => {
    if (!showExportDialog) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setShowExportDialog(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showExportDialog]);

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <FileText className="size-4 text-indigo-600" />
              <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
                {draft.documentType}
              </Badge>
              <Badge variant={hasContent ? "default" : "outline"} className="rounded-full">
                {status}
              </Badge>
            </div>
            <h2 className="truncate text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              {title}
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
              {draft.productName || "未填写产品名称"} · {draft.parentModule || "未填写一级模块"} / {draft.moduleName || "未填写功能模块"}
            </p>
          </div>
        </div>

        <Separator className="my-4" />

        <div className="grid gap-2">
          <StatBlock label="生成方式" value={generationMethod} />
          <StatBlock label="当前状态" value={status} />
          <StatBlock label="当前正文总字数" value={`${content.length} 字`} />
          {longPlan ? (
            <>
              <StatBlock label="长文目标字数" value={`${longPlan.totalTargetChars} 字`} />
              <StatBlock label="长文已完成字数" value={`${completedChars} 字`} />
            </>
          ) : null}
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <StatBlock label="总章节" value={chapters.length || "-"} />
          <StatBlock label="已完成" value={chapters.length ? completedChapters : "-"} />
          <StatBlock label="失败" value={chapters.length ? failedChapters : "-"} />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {hasContent ? (
              <CheckCircle2 className="size-4 text-emerald-600" />
            ) : (
              <AlertCircle className="size-4 text-amber-500" />
            )}
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">正文预览</h3>
          </div>
          {hasContent ? (
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {content.length} 字
            </span>
          ) : null}
        </div>

        {hasContent ? (
          <div className="relative mt-3">
            <div className="max-h-96 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm leading-7 text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
              <p className="whitespace-pre-wrap break-words">{compactText(trimmedContent)}</p>
            </div>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 rounded-b-xl bg-gradient-to-t from-slate-50 to-transparent dark:from-slate-950" />
          </div>
        ) : (
          <EmptyState
            title="还没有生成正文"
            description="Workspace 用于配置和生成。生成后这里只展示摘要，完整编辑会在独立编辑页完成。"
            compact
            illustration={
              <IllustrationImage
                src="/images/characters/document-writer.svg"
                alt="文档编辑人物插画"
                width={260}
                height={180}
              />
            }
            action={
              onGenerateDocument ? (
                <Button type="button" onClick={onGenerateDocument} disabled={generating}>
                  {generating ? <Loader2 className="size-4 animate-spin" /> : <WandSparkles className="size-4" />}
                  生成 Mock 文档
                </Button>
              ) : null
            }
          />
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="grid gap-2 sm:grid-cols-2">
          <Button type="button" className="min-h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 sm:col-span-2" onClick={openEditor} disabled={!hasContent}>
            <Maximize2 className="size-4" />
            打开全文编辑
          </Button>
          <Button type="button" variant="outline" className="min-h-10 rounded-xl bg-white dark:bg-slate-900" onClick={copyContent} disabled={!hasContent}>
            <Clipboard className="size-4" />
            复制全文
          </Button>
          <Button type="button" variant="outline" className="min-h-10 rounded-xl bg-white dark:bg-slate-900" onClick={() => setShowExportDialog(true)} disabled={!hasContent}>
            <Download className="size-4" />
            导出 Word
          </Button>
          <Button type="button" variant="outline" className="min-h-10 rounded-xl bg-white dark:bg-slate-900" onClick={saveRecord} disabled={!hasContent}>
            <Save className="size-4" />
            保存历史
          </Button>
          <Button type="button" variant="outline" className="min-h-10 rounded-xl bg-white dark:bg-slate-900" onClick={restoreInitialContent} disabled={!draft.initialDocumentContent}>
            <RotateCcw className="size-4" />
            恢复初稿
          </Button>
          <Button type="button" variant="ghost" className="min-h-10 rounded-xl text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-500/10" onClick={clearContent} disabled={!hasContent}>
            <Trash2 className="size-4" />
            清空结果
          </Button>
        </div>
      </section>

      {/* Export Format Dialog */}
      {showExportDialog ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="导出格式选择">
          <div className="mx-4 w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">导出格式</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">选择导出的 Word 文档格式</p>
            <div className="mt-4 space-y-2">
              {([
                { value: "formal" as const, label: "正式文档", desc: "标准格式化输出" },
                { value: "minimal" as const, label: "简洁报告", desc: "无页眉页脚的精简格式" },
                { value: "with-header-footer" as const, label: "带页眉页脚", desc: "文档标题作页眉，页码作页脚" },
              ]).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => void handleExport(option.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-indigo-200 hover:bg-indigo-50/50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-500/30"
                >
                  <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{option.label}</div>
                  <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{option.desc}</div>
                </button>
              ))}
            </div>
            <div className="mt-4">
              <Button
                type="button"
                variant="ghost"
                className="w-full rounded-xl"
                onClick={() => setShowExportDialog(false)}
              >
                取消
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
