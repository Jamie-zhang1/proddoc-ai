"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Clipboard,
  Download,
  Loader2,
  RotateCcw,
  Save,
  WandSparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CharacterCount } from "@/components/character-count";
import { EmptyState } from "@/components/empty-state";
import { copyText } from "@/lib/clipboard";
import { exportDocx } from "@/lib/export-docx";
import { buildReferenceContext } from "@/lib/prompt-builder";
import {
  getActiveDocument,
  saveHistoryRecord,
  updateActiveDocument,
} from "@/lib/storage";
import type {
  ActiveDocument,
  GeneratedBy,
  HistoryRecord,
  RewriteMode,
  RewriteResponse,
} from "@/lib/types";

type SelectedRange = {
  start: number;
  end: number;
  text: string;
};

const rewriteModes: Array<{ value: RewriteMode; label: string }> = [
  { value: "full", label: "修改全文" },
  { value: "selection", label: "修改选中文本" },
  { value: "append", label: "追加内容" },
  { value: "polish", label: "润色当前段落" },
];

const quickInstructions = [
  "改成更正式的产品说明书语气",
  "补充操作步骤",
  "补充功能价值",
  "压缩选中文本",
  "扩写选中文本",
  "检查并减少空泛表达",
  "检查是否遗漏功能入口、关键字段、权限边界",
];

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createRecord(document: ActiveDocument, content: string): HistoryRecord {
  const generatedBy: GeneratedBy =
    document.draft.generationMode === "api"
      ? "api"
      : document.draft.generationMode === "mock"
        ? "mock"
        : "prompt-assisted";

  return {
    id: createId(),
    title: `${document.draft.moduleName || "功能模块"}${document.draft.documentType}`,
    productName: document.draft.productName,
    productType: document.draft.productType,
    targetUser: document.draft.targetUser,
    parentModule: document.draft.parentModule,
    moduleName: document.draft.moduleName,
    documentType: document.draft.documentType,
    content,
    prompt: document.draft.prompt,
    generationMode: document.draft.generationMode,
    generatedBy,
    createdAt: new Date().toISOString(),
    status: "已保存",
  };
}

function replaceRange(content: string, range: SelectedRange, replacement: string) {
  return `${content.slice(0, range.start)}${replacement}${content.slice(range.end)}`;
}

export default function EditorPage() {
  const [activeDocument, setActiveDocument] = useState<ActiveDocument | null>(null);
  const [content, setContent] = useState("");
  const [selectedRange, setSelectedRange] = useState<SelectedRange | null>(null);
  const [rewriteMode, setRewriteMode] = useState<RewriteMode>("full");
  const [instruction, setInstruction] = useState("");
  const [rewriteResult, setRewriteResult] = useState("");
  const [rewriting, setRewriting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const document = getActiveDocument();
      setActiveDocument(document);
      setContent(document?.content ?? "");
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!activeDocument) return;
    const timer = window.setTimeout(() => {
      updateActiveDocument({
        ...activeDocument,
        content,
        draft: { ...activeDocument.draft, documentContent: content },
      });
    }, 500);
    return () => window.clearTimeout(timer);
  }, [activeDocument, content]);

  function captureSelection() {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = content.slice(start, end);
    setSelectedRange(text ? { start, end, text } : null);
  }

  function saveDraft() {
    if (!activeDocument) return;
    const saved = updateActiveDocument({
      ...activeDocument,
      content,
      draft: { ...activeDocument.draft, documentContent: content },
    });
    if (saved) toast.success("编辑草稿已保存");
    else toast.error("草稿保存失败，请检查本地存储空间");
  }

  async function copyContent() {
    if (!content.trim()) {
      toast.warning("当前正文为空");
      return;
    }
    const copied = await copyText(content);
    if (copied) toast.success("全文已复制");
    else toast.error("当前浏览器不支持自动复制，请手动复制");
  }

  async function exportCurrentDocx() {
    if (!activeDocument || !content.trim()) {
      toast.warning("当前正文为空，不能导出");
      return;
    }
    try {
      await exportDocx(createRecord(activeDocument, content));
      toast.success("Word 文档已导出");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "导出失败");
    }
  }

  function saveHistory() {
    if (!activeDocument || !content.trim()) {
      toast.warning("当前正文为空，不能保存历史");
      return;
    }
    const saved = saveHistoryRecord(createRecord(activeDocument, content));
    if (saved) toast.success("已保存到历史记录");
    else toast.error("保存失败，请检查本地存储空间");
  }

  function restoreInitial() {
    if (!activeDocument?.initialContent?.trim()) {
      toast.warning("没有可恢复的初始生成版本");
      return;
    }
    setContent(activeDocument.initialContent);
    toast.success("已恢复初始生成版本");
  }

  async function rewrite() {
    if (!activeDocument || !content.trim()) {
      toast.warning("请先输入或生成文档内容");
      return;
    }
    if (!instruction.trim()) {
      toast.warning("请先填写修改要求");
      return;
    }

    const selectedText =
      rewriteMode === "full" || rewriteMode === "append"
        ? ""
        : selectedRange?.text || content;

    setRewriting(true);
    setRewriteResult("");
    try {
      const response = await fetch("/api/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentText: content,
          selectedText,
          instruction,
          mode: rewriteMode,
          referenceContext: buildReferenceContext(activeDocument.draft),
        }),
      });
      const data = (await response.json().catch(() => ({
        ok: false,
        error: "模型服务返回内容无法解析。",
      }))) as RewriteResponse;
      if (!response.ok || !data.ok || !data.result) {
        throw new Error(data.error || "AI 修改失败，请稍后重试。");
      }
      setRewriteResult(data.result);
      toast.success("AI 修改结果已生成，请确认后应用");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "AI 修改失败，请稍后重试。");
    } finally {
      setRewriting(false);
    }
  }

  function applyRewrite(strategy: "replace" | "selection" | "append") {
    if (!rewriteResult.trim()) {
      toast.warning("暂无可应用的修改结果");
      return;
    }
    if (strategy === "append" || rewriteMode === "append") {
      setContent(`${content.trimEnd()}\n\n${rewriteResult.trim()}`);
      toast.success("已追加到文末");
      return;
    }
    if (strategy === "selection" && selectedRange) {
      setContent(replaceRange(content, selectedRange, rewriteResult));
      setSelectedRange(null);
      toast.success("已替换选中文本");
      return;
    }
    setContent(rewriteResult);
    toast.success("已应用修改结果");
  }

  if (!activeDocument) {
    return (
      <main className="page-shell">
        <EmptyState
          title="请先生成或输入文档内容"
          description="从 Workspace 生成正文后，点击“打开全文编辑”即可进入沉浸式编辑页面。"
          action={
            <Button asChild className="rounded-xl bg-indigo-600 hover:bg-indigo-500">
              <Link href="/workspace">返回工作台</Link>
            </Button>
          }
        />
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-50 px-4 py-6 dark:bg-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px] space-y-5">
        <div className="sticky top-16 z-20 rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <Button asChild variant="ghost" className="mb-1 h-auto px-0 text-slate-600 dark:text-slate-400">
                <Link href="/workspace">
                  <ArrowLeft className="size-4" />
                  返回工作台
                </Link>
              </Button>
              <h1 className="truncate text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                文档编辑器
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {activeDocument.draft.productName} · {activeDocument.draft.parentModule} / {activeDocument.draft.moduleName}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="self-center">
                {content.length} 字
              </Badge>
              <Button type="button" variant="outline" className="rounded-xl bg-white dark:bg-slate-900" onClick={saveDraft}>
                <Save className="size-4" />
                保存草稿
              </Button>
              <Button type="button" variant="outline" className="rounded-xl bg-white dark:bg-slate-900" onClick={copyContent}>
                <Clipboard className="size-4" />
                复制全文
              </Button>
              <Button type="button" variant="outline" className="rounded-xl bg-white dark:bg-slate-900" onClick={restoreInitial}>
                <RotateCcw className="size-4" />
                恢复初稿
              </Button>
              <Button type="button" variant="outline" className="rounded-xl bg-white dark:bg-slate-900" onClick={saveHistory}>
                保存历史
              </Button>
              <Button type="button" className="rounded-xl bg-indigo-600 hover:bg-indigo-500" onClick={() => void exportCurrentDocx()}>
                <Download className="size-4" />
                导出 Word
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <Textarea
              ref={textareaRef}
              value={content}
              onChange={(event) => setContent(event.target.value)}
              onSelect={captureSelection}
              onKeyUp={captureSelection}
              onMouseUp={captureSelection}
              className="min-h-[calc(100vh-15rem)] resize-y rounded-2xl border-slate-200 bg-slate-50 p-6 text-base leading-8 text-slate-800 focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              placeholder="在这里精修生成后的产品文档正文。"
            />
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-slate-400">
                {selectedRange ? `已选中 ${selectedRange.text.length} 字，可交给 AI 修改。` : "支持直接编辑、保留段落换行，修改会自动同步到 Workspace 草稿。"}
              </p>
              <CharacterCount value={content} />
            </div>
          </section>

          <aside className="space-y-4 xl:sticky xl:top-36 xl:self-start">
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-2">
                <WandSparkles className="size-4 text-indigo-600" />
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">AI 修改助手</h2>
              </div>
              <div className="mt-4 space-y-3">
                <Select value={rewriteMode} onValueChange={(value: RewriteMode) => setRewriteMode(value)}>
                  <SelectTrigger className="w-full rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {rewriteModes.map((mode) => (
                      <SelectItem key={mode.value} value={mode.value}>
                        {mode.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex flex-wrap gap-2">
                  {quickInstructions.map((item) => (
                    <Button
                      key={item}
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="h-auto rounded-full px-3 py-1 text-xs"
                      onClick={() => setInstruction(item)}
                    >
                      {item}
                    </Button>
                  ))}
                </div>
                <Textarea
                  value={instruction}
                  maxLength={500}
                  onChange={(event) => setInstruction(event.target.value)}
                  className="min-h-28 rounded-xl"
                  placeholder="输入修改要求，例如：补充操作步骤，改成更正式的产品说明书语气。"
                />
                <CharacterCount value={instruction} limit={500} />
                <Button
                  type="button"
                  className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500"
                  onClick={() => void rewrite()}
                  disabled={rewriting || !content.trim()}
                >
                  {rewriting ? <Loader2 className="size-4 animate-spin" /> : <WandSparkles className="size-4" />}
                  {rewriting ? "正在修改..." : "让 AI 修改"}
                </Button>
              </div>
              {rewriteResult ? (
                <div className="mt-4 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-3 dark:border-indigo-500/20 dark:bg-indigo-500/10">
                  <div className="max-h-72 overflow-auto whitespace-pre-wrap rounded-xl bg-white p-3 text-sm leading-6 text-slate-700 dark:bg-slate-950 dark:text-slate-300">
                    {rewriteResult}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button type="button" size="sm" className="rounded-xl bg-indigo-600 hover:bg-indigo-500" onClick={() => applyRewrite("replace")}>
                      应用到原文
                    </Button>
                    <Button type="button" size="sm" variant="outline" className="rounded-xl bg-white dark:bg-slate-900" onClick={() => applyRewrite("selection")} disabled={!selectedRange}>
                      替换选中文本
                    </Button>
                    <Button type="button" size="sm" variant="outline" className="rounded-xl bg-white dark:bg-slate-900" onClick={() => applyRewrite("append")}>
                      追加到文末
                    </Button>
                    <Button type="button" size="sm" variant="ghost" onClick={() => setRewriteResult("")}>
                      放弃
                    </Button>
                  </div>
                </div>
              ) : null}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">模板与参考摘要</h2>
              <div className="mt-3 space-y-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
                <div>
                  <div className="text-xs text-slate-400">当前模板</div>
                  <div className="font-medium text-slate-900 dark:text-slate-100">
                    {activeDocument.draft.activeTemplateName || "标准产品说明书模板"}
                  </div>
                </div>
                {activeDocument.draft.customTemplate ? (
                  <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-950">
                    {activeDocument.draft.customTemplate.promptInstruction}
                  </div>
                ) : null}
                <div>
                  <div className="text-xs text-slate-400">参考材料</div>
                  <div>{activeDocument.draft.referenceFiles?.filter((file) => file.status === "parsed").length || 0} 个已解析文件</div>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
