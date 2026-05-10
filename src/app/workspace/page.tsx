"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { CheckCircle2, ChevronDown, RotateCcw, X } from "lucide-react";
import { toast } from "sonner";
import { ModuleSelector } from "@/components/workspace/module-selector";
import { DocumentConfig } from "@/components/workspace/document-config";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buildPrompt } from "@/lib/prompt-builder";
import {
  defaultDraft,
  demoProjects,
  getTemplateInstruction,
} from "@/lib/mock-data";
import {
  getActiveTemplate,
  getGenerationPreferences,
  getWorkspaceDraftAsync,
  saveWorkspaceDraft,
} from "@/lib/storage";
import type { GenerationMode, WorkspaceDraft } from "@/lib/types";
import { cn } from "@/lib/utils";
import { isTourCompleted } from "@/components/tour-overlay";
import { SkeletonCard } from "@/components/skeleton";

const GenerationPanel = dynamic(
  () => import("@/components/workspace/generation-panel").then((mod) => ({ default: mod.GenerationPanel })),
  {
    loading: () => (
      <div className="space-y-4">
        <SkeletonCard />
      </div>
    ),
    ssr: false,
  }
);

const TourOverlay = dynamic(
  () => import("@/components/tour-overlay").then((mod) => ({ default: mod.TourOverlay })),
  { ssr: false }
);

function FlowStep({
  index,
  title,
  active,
  done,
}: {
  index: number;
  title: string;
  active?: boolean;
  done?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 items-center gap-2 rounded-2xl border px-3 py-2 text-sm",
        active || done
          ? "border-indigo-100 bg-indigo-50 text-indigo-700 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300"
          : "border-slate-200 bg-white text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400"
      )}
    >
      <span
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
          done ? "bg-indigo-600 text-white" : active ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
        )}
      >
        {done ? <CheckCircle2 className="size-4" /> : index}
      </span>
      <span className="truncate font-medium">{title}</span>
    </div>
  );
}

export default function WorkspacePage() {
  const [draft, setDraft] = useState<WorkspaceDraft>(defaultDraft);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [draftReady, setDraftReady] = useState(false);
  const [activeTemplateName, setActiveTemplateName] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [showModePopover, setShowModePopover] = useState(false);
  const modePopoverRef = useRef<HTMLDivElement>(null);
  const userInteractedRef = useRef(false);
  const router = useRouter();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!isTourCompleted()) {
        setShowTour(true);
      }

      void (async () => {
        const restored = await getWorkspaceDraftAsync();
        if (restored && !userInteractedRef.current) {
          setDraft(restored);
          const matchedProject = demoProjects.find((project) => project.productName === restored.productName);
          if (matchedProject) setSelectedProjectId(matchedProject.id);
        } else if (!userInteractedRef.current) {
          const preferences = getGenerationPreferences();
          if (preferences) {
            setDraft((current) => ({
              ...current,
              generationMode: preferences.generationMode,
              documentType: preferences.documentType,
              detailLevel: preferences.detailLevel,
              outputStyle: preferences.outputStyle,
            }));
          }
        }

        const activeTemplate = getActiveTemplate();
        if (activeTemplate && !userInteractedRef.current) {
          setActiveTemplateName(activeTemplate.name);
          setDraft((current) => ({
            ...current,
            documentType: activeTemplate.documentType,
            outputStyle: activeTemplate.outputStyle,
            activeTemplateId: activeTemplate.id,
            activeTemplateName: activeTemplate.name,
            activeTemplateStructure: activeTemplate.structure,
            customTemplate: activeTemplate.customTemplate,
            referenceWriting: current.referenceWriting.includes(activeTemplate.name)
              ? current.referenceWriting
              : `${current.referenceWriting}\n${getTemplateInstruction(activeTemplate)}`,
          }));
          toast.success(`已应用「${activeTemplate.name}」`);
        }
      })();

      setDraftReady(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  // Close mode popover on outside click
  // Close mode popover on outside click
  useEffect(() => {
    if (!showModePopover) return;
    function handleClickOutside(e: MouseEvent) {
      if (modePopoverRef.current && !modePopoverRef.current.contains(e.target as Node)) {
        setShowModePopover(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showModePopover]);

  // Close reset dialog on Escape
  useEffect(() => {
    if (!showResetConfirm) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setShowResetConfirm(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showResetConfirm]);

  useEffect(() => {
    if (!draftReady) return;
    saveWorkspaceDraft(draft);
  }, [draft, draftReady]);

  const selectedProject =
    demoProjects.find((project) => project.id === selectedProjectId) ?? demoProjects[0];

  function updateDraft<T extends keyof WorkspaceDraft>(key: T, value: WorkspaceDraft[T]) {
    userInteractedRef.current = true;
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function handleClear() {
    userInteractedRef.current = true;
    setDraft({ ...defaultDraft, prompt: "", documentContent: "", screenshots: [], referenceFiles: [], modules: [] });
    setSelectedProjectId("");
    setActiveTemplateName(null);
    toast.success("工作区已清空");
  }

  const stepOneDone = Boolean(draft.productName && draft.parentModule && draft.moduleName);
  const stepTwoDone = Boolean(draft.documentType && draft.outputStyle && draft.detailLevel);
  const stepThreeDone = Boolean(draft.prompt || draft.generationMode === "api" || draft.generationMode === "mock");
  const stepFourDone = Boolean(draft.documentContent);

  return (
    <>
      {showTour ? <TourOverlay /> : null}

      <main className="page-shell min-h-[calc(100vh-4rem)]">
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">文档生成工作台</h1>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                选择模块，配置内容，生成提示词和 Mock 文档，最后保存或导出 Word。
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="grid gap-2 sm:grid-cols-4 xl:min-w-[720px]">
                <FlowStep index={1} title="选择模块" active={!stepOneDone} done={stepOneDone} />
                <FlowStep index={2} title="配置内容" active={stepOneDone && !stepTwoDone} done={stepTwoDone} />
                <FlowStep index={3} title="选择模式" active={stepTwoDone && !stepThreeDone} done={stepThreeDone} />
                <FlowStep index={4} title="生成导出" active={stepThreeDone && !stepFourDone} done={stepFourDone} />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0 rounded-xl"
                onClick={() => setShowResetConfirm(true)}
              >
                <RotateCcw className="size-4" />
                重置工作区
              </Button>
            </div>
          </div>

          {activeTemplateName && (
            <div className="mt-5 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
              <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>已应用「{activeTemplateName}」</span>
              <button
                type="button"
                onClick={() => {
                  setActiveTemplateName(null);
                  toast.info("模板已移除");
                }}
                className="ml-1 inline-flex items-center gap-1 rounded-full border border-emerald-300 px-2 py-0.5 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-500/40 dark:text-emerald-300 dark:hover:bg-emerald-500/20"
                aria-label="移除当前模板"
              >
                <X className="size-3" />
                移除
              </button>
            </div>
          )}

          <div className="mt-5 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
            {/* 产品名称 - 点击聚焦输入框 */}
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById("product-name-input");
                if (el) {
                  el.scrollIntoView({ behavior: "smooth", block: "center" });
                  (el as HTMLInputElement).focus();
                }
              }}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition hover:border-indigo-200 hover:bg-indigo-50/50 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-indigo-500/30 dark:hover:bg-indigo-500/5"
            >
              <div className="text-xs text-slate-400">产品名称</div>
              <div className="mt-1 truncate font-medium text-slate-900 dark:text-slate-100">
                {draft.productName || "未填写"}
              </div>
            </button>

            {/* 功能模块 - 点击滚动到模块区域 */}
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById("module-section");
                if (el) {
                  el.scrollIntoView({ behavior: "smooth", block: "center" });
                }
              }}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition hover:border-indigo-200 hover:bg-indigo-50/50 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-indigo-500/30 dark:hover:bg-indigo-500/5"
            >
              <div className="text-xs text-slate-400">功能模块</div>
              <div className="mt-1 truncate font-medium text-slate-900 dark:text-slate-100">
                {draft.moduleName || "未选择"}
              </div>
            </button>

            {/* 当前模板 - 点击跳转模板页 */}
            <button
              type="button"
              onClick={() => router.push("/templates")}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition hover:border-indigo-200 hover:bg-indigo-50/50 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-indigo-500/30 dark:hover:bg-indigo-500/5"
            >
              <div className="text-xs text-slate-400">当前模板</div>
              <div className="mt-1 truncate font-medium text-slate-900 dark:text-slate-100">
                {activeTemplateName || draft.activeTemplateName || "未选择"}
              </div>
            </button>

            {/* 生成模式 - 点击弹出选择 */}
            <div className="relative" ref={modePopoverRef}>
              <button
                type="button"
                onClick={() => setShowModePopover((prev) => !prev)}
                className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition hover:border-indigo-200 hover:bg-indigo-50/50 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-indigo-500/30 dark:hover:bg-indigo-500/5"
              >
                <div>
                  <div className="text-xs text-slate-400">生成模式</div>
                  <div className="mt-1 truncate font-medium text-slate-900 dark:text-slate-100">
                    {draft.generationMode === "api" ? "API 自动生成" : draft.generationMode === "mock" ? "Mock 文档" : "复制提示词"}
                  </div>
                </div>
                <ChevronDown className="size-4 shrink-0 text-slate-400" />
              </button>
              {showModePopover && (
                <div className="absolute right-0 top-full z-50 mt-1 w-full min-w-[160px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
                  {([
                    { mode: "prompt" as GenerationMode, label: "复制提示词", desc: "生成后手动粘贴" },
                    { mode: "api" as GenerationMode, label: "API 自动生成", desc: "调用模型生成正文" },
                    { mode: "mock" as GenerationMode, label: "Mock 文档", desc: "本地模拟生成" },
                  ]).map((option) => (
                    <button
                      key={option.mode}
                      type="button"
                      onClick={() => {
                        updateDraft("generationMode", option.mode);
                        setShowModePopover(false);
                      }}
                      className={cn(
                        "flex w-full flex-col px-4 py-2.5 text-left text-sm transition hover:bg-indigo-50 dark:hover:bg-indigo-500/10",
                        draft.generationMode === option.mode && "bg-indigo-50 dark:bg-indigo-500/10"
                      )}
                    >
                      <span className="font-medium text-slate-900 dark:text-slate-100">{option.label}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{option.desc}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[14rem_minmax(0,1fr)] xl:grid-cols-[18rem_minmax(0,1fr)_24rem]">
          <ModuleSelector
            draft={draft}
            onUpdateDraft={updateDraft}
          />

          <DocumentConfig
            draft={draft}
            activeTemplateName={activeTemplateName}
            onUpdateDraft={updateDraft}
          />

          <div className="hidden xl:block">
            <GenerationPanel
              draft={draft}
              onUpdateDraft={updateDraft}
              onClear={handleClear}
              activeTemplateName={activeTemplateName}
            />
          </div>
        </section>

        {/* Mobile: GenerationPanel below the grid */}
        <div className="mt-6 xl:hidden">
          <GenerationPanel
            draft={draft}
            onUpdateDraft={updateDraft}
            onClear={handleClear}
            activeTemplateName={activeTemplateName}
          />
        </div>
      </main>

      {/* Reset Confirmation Dialog */}
      {showResetConfirm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="重置确认">
          <div className="mx-4 w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">确定要清空所有内容吗？</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              这将重置所有配置和生成结果，操作不可撤销。
            </p>
            <div className="mt-5 flex gap-3">
              <Button
                type="button"
                variant="ghost"
                className="flex-1 rounded-xl"
                onClick={() => setShowResetConfirm(false)}
              >
                取消
              </Button>
              <Button
                type="button"
                className="flex-1 rounded-xl bg-rose-600 hover:bg-rose-500"
                onClick={() => {
                  handleClear();
                  setShowResetConfirm(false);
                }}
              >
                确认重置
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
