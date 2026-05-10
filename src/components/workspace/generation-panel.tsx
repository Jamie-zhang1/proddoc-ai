"use client";

import { useEffect, useRef, useState } from "react";
import { Eraser, FileText, Keyboard, Loader2, WandSparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DocumentPreview } from "@/components/document-preview";
import { ProgressBar } from "@/components/progress-bar";
import { PromptPreview } from "@/components/prompt-preview";
import { buildPrompt } from "@/lib/prompt-builder";
import { generateMockDocument } from "@/lib/document-generator";
import { addActivity, getModelParams } from "@/lib/storage";
import type { ApiGenerateResponse, WorkspaceDraft } from "@/lib/types";

// --- API constants ---
const API_TIMEOUT_MS = 120_000;
const MAX_RETRIES = 1;

type GenerationStep = "idle" | "connecting" | "responding" | "processing" | "done";

type GenerationPanelProps = {
  draft: WorkspaceDraft;
  onUpdateDraft: <T extends keyof WorkspaceDraft>(key: T, value: WorkspaceDraft[T]) => void;
  onClear: () => void;
  onSaveRecord?: () => void;
  activeTemplateName: string | null;
};

export function GenerationPanel({
  draft,
  onUpdateDraft,
  onClear,
  onSaveRecord,
  activeTemplateName,
}: GenerationPanelProps) {
  const [loading, setLoading] = useState(false);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [resultTab, setResultTab] = useState<"prompt" | "document">("prompt");
  const [apiStep, setApiStep] = useState<GenerationStep>("idle");
  const [apiProgress, setApiProgress] = useState(0);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  function canGenerate() {
    return Boolean(draft.productName.trim() && draft.parentModule.trim() && draft.moduleName.trim());
  }

  function handleBuildPrompt() {
    if (!canGenerate()) {
      toast.warning("请先填写产品名称和功能模块名称");
      return;
    }

    const prompt = buildPrompt(draft);
    onUpdateDraft("prompt", prompt);
    onUpdateDraft("generationMode", "prompt");
    setResultTab("prompt");
    toast.success("提示词已生成");

    addActivity({
      type: "prompt",
      title: `提示词 · ${draft.parentModule}/${draft.moduleName}`,
      description: `为 ${draft.productName} 生成${draft.documentType}提示词`,
      productName: draft.productName,
      moduleName: draft.moduleName,
      content: prompt,
    });
  }

  async function handleGenerateWithApi(retryCount = 0) {
    if (apiLoading) return;
    if (!canGenerate()) {
      toast.warning("请先选择模块或填写基础信息");
      return;
    }

    setApiError(null);
    setApiLoading(true);
    setApiStep("connecting");
    setApiProgress(5);
    setResultTab("document");

    // Simulate progress
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    progressTimerRef.current = setInterval(() => {
      setApiProgress((prev) => {
        if (prev >= 92) return prev;
        return prev + Math.random() * 4 + 1;
      });
    }, 500);

    const prompt = draft.prompt || buildPrompt(draft);
    onUpdateDraft("prompt", prompt);
    onUpdateDraft("generationMode", "api");

    const controller = new AbortController();
    abortRef.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    try {
      // Transition to "responding" after 3s
      const stepTimer = window.setTimeout(() => setApiStep("responding"), 3000);

      const modelParams = getModelParams();
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          mode: "document",
          documentType: draft.documentType,
          temperature: modelParams.temperature,
        }),
        signal: controller.signal,
      });

      window.clearTimeout(stepTimer);
      setApiStep("processing");
      setApiProgress(75);

      const data = (await response.json().catch(() => ({
        error: "模型服务返回内容无法解析。",
      }))) as ApiGenerateResponse;

      if (!response.ok || !data.content) {
        throw new Error(data.error || "API 自动生成失败，请稍后重试。");
      }

      onUpdateDraft("prompt", prompt);
      onUpdateDraft("generationMode", "api");
      onUpdateDraft("documentContent", data.content ?? "");
      onUpdateDraft("initialDocumentContent", data.content ?? "");
      setApiStep("done");
      setApiProgress(100);
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      toast.success("API 正文已生成");

      addActivity({
        type: "api-call",
        title: `API 生成 · ${draft.parentModule}/${draft.moduleName}`,
        description: `通过 API 为 ${draft.productName} 生成${draft.documentType}`,
        productName: draft.productName,
        moduleName: draft.moduleName,
        content: data.content ?? "",
      });
    } catch (error) {
      const message =
        error instanceof Error && error.name === "AbortError"
          ? "模型服务响应超时，请稍后重试。"
          : error instanceof Error
            ? error.message
            : "API 自动生成失败，请稍后重试。";

      // Auto-retry once on network errors (not on 4xx)
      const isAbort = error instanceof Error && error.name === "AbortError";
      const isNetwork =
        error instanceof TypeError && error.message.includes("fetch");
      if (!isAbort && isNetwork && retryCount < MAX_RETRIES) {
        setApiStep("connecting");
        window.clearTimeout(timeout);
        return handleGenerateWithApi(retryCount + 1);
      }

      setApiError(message);
      toast.error(message);
      setApiStep("idle");
      setApiProgress(0);
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    } finally {
      window.clearTimeout(timeout);
      abortRef.current = null;
      setApiLoading(false);
    }
  }

  async function handleGenerateDocument() {
    if (loading) return;
    if (!canGenerate()) {
      toast.warning("请先选择模块或填写基础信息");
      return;

    }

    setLoading(true);
    const prompt = draft.prompt || buildPrompt(draft);
    onUpdateDraft("prompt", prompt);
    onUpdateDraft("generationMode", "mock");
    setResultTab("document");

    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      const documentContent = generateMockDocument({ ...draft, prompt });
      onUpdateDraft("prompt", prompt);
      onUpdateDraft("documentContent", documentContent);
      onUpdateDraft("initialDocumentContent", documentContent);
      onUpdateDraft("generationMode", "mock");
      toast.success("Mock 文档已生成");

      addActivity({
        type: "document",
        title: `Mock 文档 · ${draft.parentModule}/${draft.moduleName}`,
        description: `为 ${draft.productName} 生成 Mock ${draft.documentType}`,
        productName: draft.productName,
        moduleName: draft.moduleName,
        content: documentContent,
      });
    } finally {
      setLoading(false);
    }
  }

  // --- Keyboard shortcuts ---
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const isMod = e.ctrlKey || e.metaKey;

      // Ctrl+S → save
      if (isMod && e.key === "s") {
        e.preventDefault();
        onSaveRecord?.();
        return;
      }

      // Ctrl+Shift+Enter → API generate
      if (isMod && e.shiftKey && e.key === "Enter") {
        e.preventDefault();
        void handleGenerateWithApi();
        return;
      }

      // Ctrl+Enter → build prompt
      if (isMod && e.key === "Enter") {
        e.preventDefault();
        handleBuildPrompt();
        return;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [draft.productName, draft.parentModule, draft.moduleName]);

  const stepLabel =
    apiStep === "connecting"
      ? "正在连接模型服务..."
      : apiStep === "responding"
        ? "模型服务响应中..."
        : apiStep === "processing"
          ? "正在处理返回内容..."
          : apiStep === "done"
            ? "生成完成"
            : undefined;

  const busy = loading || apiLoading;

  return (
    <div className="xl:sticky xl:top-20 xl:self-start">
      <Card className="rounded-2xl border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <CardHeader className="border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <FileText className="size-5 shrink-0 text-indigo-600" />
            <CardTitle className="text-lg">生成结果</CardTitle>
          </div>
          <div className="mt-3 space-y-2">
            <Button
              type="button"
              className="min-h-12 w-full rounded-xl bg-indigo-600 text-base font-semibold hover:bg-indigo-500"
              onClick={() => void handleGenerateWithApi()}
              disabled={busy}
            >
              {apiLoading ? <Loader2 className="size-5 animate-spin" /> : <WandSparkles className="size-5" />}
              {apiLoading ? "正在生成文档..." : "🚀 调用 API 生成正文"}
            </Button>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" className="min-h-10 flex-1 rounded-xl" onClick={handleBuildPrompt} disabled={busy}>
                <WandSparkles className="size-4" />
                ✨ 生成提示词
              </Button>
              <Button type="button" variant="secondary" className="min-h-10 flex-1 rounded-xl" onClick={() => void handleGenerateDocument()} disabled={busy}>
                {loading ? <Loader2 className="size-4 animate-spin" /> : <FileText className="size-4" />}
                📄 生成 Mock 文档
              </Button>
              <Button type="button" variant="ghost" size="icon" className="shrink-0 rounded-xl" onClick={onClear} disabled={busy}>
                <Eraser className="size-4" />
              </Button>
            </div>
          </div>

          {/* API progress / step indicator */}
          {apiLoading && stepLabel && (
            <div className="mt-4 rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300">
              <div className="flex items-center gap-3">
                <Loader2 className="size-4 animate-spin" />
                <span>{stepLabel}</span>
              </div>
              <div className="mt-3">
                <ProgressBar
                  value={apiProgress}
                  showPercentage
                  color="from-indigo-500 to-indigo-600"
                />
              </div>
              {apiProgress < 100 && (
                <p className="mt-1.5 text-xs text-indigo-500 dark:text-indigo-400">
                  {apiStep === "connecting"
                    ? "正在建立连接..."
                    : apiStep === "responding"
                      ? "模型正在生成内容，预计需要 30-60 秒..."
                      : "正在处理返回内容..."}
                </p>
              )}
            </div>
          )}

          {apiError ? (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
              {apiError} 可以继续使用"生成提示词"或"生成 Mock 文档"完成本地演示。
            </div>
          ) : null}
        </CardHeader>
        <CardContent className="p-4">
          <Tabs value={resultTab} onValueChange={(value) => setResultTab(value as "prompt" | "document")}>
            <TabsList className="grid w-full grid-cols-2 rounded-2xl bg-slate-100">
              <TabsTrigger value="prompt">提示词</TabsTrigger>
              <TabsTrigger value="document">文档预览</TabsTrigger>
            </TabsList>
            <TabsContent value="prompt" className="mt-4">
              <PromptPreview prompt={draft.prompt} onGeneratePrompt={handleBuildPrompt} />
            </TabsContent>
            <TabsContent value="document" className="mt-4">
              <DocumentPreview
                draft={draft}
                content={draft.documentContent}
                onContentChange={(content) => onUpdateDraft("documentContent", content)}
                onGenerateDocument={() => void handleGenerateDocument()}
                generating={loading}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Keyboard shortcuts hint */}
      <div className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-400">
        <Keyboard className="size-3.5" />
        <span>快捷键: Ctrl+Enter 生成提示词 | Ctrl+Shift+Enter API 生成</span>
      </div>
    </div>
  );
}
