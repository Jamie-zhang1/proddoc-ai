"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  Circle,
  Eraser,
  FileText,
  Info,
  Loader2,
  WandSparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { CharacterCount } from "@/components/character-count";
import { DocumentPreview } from "@/components/document-preview";
import { IllustrationImage } from "@/components/illustration-image";
import { PromptPreview } from "@/components/prompt-preview";
import { ReferenceMaterialUploader } from "@/components/reference-material-uploader";
import { ScreenshotUploader } from "@/components/screenshot-uploader";
import { buildPrompt } from "@/lib/prompt-builder";
import { generateMockDocument } from "@/lib/document-generator";
import {
  defaultDraft,
  demoProjects,
  detailLevels,
  documentTypes,
  getDemoModuleSample,
  getTemplateInstruction,
  outputStyles,
  productTypes,
  targetUsers,
} from "@/lib/mock-data";
import {
  getActiveTemplate,
  getGenerationPreferences,
  getWorkspaceDraft,
  saveWorkspaceDraft,
} from "@/lib/storage";
import type {
  ApiGenerateResponse,
  DemoProject,
  DetailLevel,
  DocumentType,
  GenerationMode,
  OutputStyle,
  ProductType,
  ScreenshotItem,
  ReferenceFile,
  TargetUser,
  WorkspaceDraft,
} from "@/lib/types";
import { cn } from "@/lib/utils";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</Label>
      {children}
    </div>
  );
}

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
  const [selectedProjectId, setSelectedProjectId] = useState(demoProjects[0].id);
  const [loading, setLoading] = useState(false);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [draftReady, setDraftReady] = useState(false);
  const [activeTemplateName, setActiveTemplateName] = useState<string | null>(null);
  const [resultTab, setResultTab] = useState<"prompt" | "document">("prompt");
  const userInteractedRef = useRef(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const restored = getWorkspaceDraft();
      if (restored && !userInteractedRef.current) {
        setDraft(restored);
        const matchedProject = demoProjects.find((project) => project.productName === restored.productName);
        if (matchedProject) setSelectedProjectId(matchedProject.id);
        if (restored.documentContent) setResultTab("document");
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

      setDraftReady(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!draftReady) return;
    saveWorkspaceDraft(draft);
  }, [draft, draftReady]);

  const selectedProject =
    demoProjects.find((project) => project.id === selectedProjectId) ?? demoProjects[0];
  const selectedParent =
    selectedProject.modules.find((module) => module.name === draft.parentModule) ??
    selectedProject.modules[0];

  function updateDraft<T extends keyof WorkspaceDraft>(key: T, value: WorkspaceDraft[T]) {
    userInteractedRef.current = true;
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function applyModule(project: DemoProject, parentModule: string, moduleName: string) {
    userInteractedRef.current = true;
    setSelectedProjectId(project.id);
    setDraft((current) => ({
      ...current,
      productName: project.productName,
      productType: project.productType,
      parentModule,
      moduleName,
      ...getDemoModuleSample(project.id, parentModule, moduleName),
    }));
  }

  function handleProjectSelect(project: DemoProject) {
    const firstModule = project.modules[0];
    applyModule(project, firstModule.name, firstModule.children[0]);
  }

  function handleParentSelect(parentModule: string) {
    const parentGroup = selectedProject.modules.find((item) => item.name === parentModule);
    if (!parentGroup) return;
    applyModule(selectedProject, parentGroup.name, parentGroup.children[0]);
  }

  function handleModuleSelect(moduleName: string) {
    applyModule(selectedProject, selectedParent.name, moduleName);
  }

  function canGenerate() {
    return Boolean(draft.productName.trim() && draft.parentModule.trim() && draft.moduleName.trim());
  }

  function handleBuildPrompt() {
    if (!canGenerate()) {
      toast.warning("请先填写产品名称和功能模块名称");
      return;
    }

    userInteractedRef.current = true;
    const prompt = buildPrompt(draft);
    setDraft((current) => ({ ...current, prompt, generationMode: "prompt" }));
    setResultTab("prompt");
    toast.success("提示词已生成");
  }

  async function handleGenerateWithApi() {
    if (apiLoading) return;
    if (!canGenerate()) {
      toast.warning("请先选择模块或填写基础信息");
      return;
    }

    userInteractedRef.current = true;
    setApiError(null);
    setApiLoading(true);
    setResultTab("document");

    const prompt = draft.prompt || buildPrompt(draft);
    setDraft((current) => ({ ...current, prompt, generationMode: "api" }));

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 95_000);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          mode: "document",
          documentType: draft.documentType,
          temperature: 0.7,
        }),
        signal: controller.signal,
      });

      const data = (await response.json().catch(() => ({
        error: "模型服务返回内容无法解析。",
      }))) as ApiGenerateResponse;

      if (!response.ok || !data.content) {
        throw new Error(data.error || "API 自动生成失败，请稍后重试。");
      }

      setDraft((current) => ({
        ...current,
        prompt,
        generationMode: "api",
        documentContent: data.content ?? "",
        initialDocumentContent: data.content ?? "",
      }));
      toast.success("API 正文已生成");
    } catch (error) {
      const message =
        error instanceof Error && error.name === "AbortError"
          ? "模型服务响应超时，请稍后重试。"
          : error instanceof Error
            ? error.message
            : "API 自动生成失败，请稍后重试。";
      setApiError(message);
      toast.error(message);
    } finally {
      window.clearTimeout(timeout);
      setApiLoading(false);
    }
  }

  async function handleGenerateDocument() {
    if (loading) return;
    if (!canGenerate()) {
      toast.warning("请先选择模块或填写基础信息");
      return;
    }

    userInteractedRef.current = true;
    setLoading(true);
    const prompt = draft.prompt || buildPrompt(draft);
    setDraft((current) => ({ ...current, prompt, generationMode: "mock" }));
    setResultTab("document");

    try {
      await new Promise((resolve) => setTimeout(resolve, 800));

      const documentContent = generateMockDocument({ ...draft, prompt });
      setDraft((current) => ({
        ...current,
        prompt,
        documentContent,
        initialDocumentContent: documentContent,
        generationMode: "mock",
      }));
      toast.success("Mock 文档已生成");
    } finally {
      setLoading(false);
    }
  }

  function handleClear() {
    userInteractedRef.current = true;
    setDraft({ ...defaultDraft, prompt: "", documentContent: "", screenshots: [], referenceFiles: [] });
    setApiError(null);
    setSelectedProjectId(demoProjects[0].id);
    setResultTab("prompt");
    toast.success("表单已清空并恢复默认 Demo");
  }

  const stepOneDone = Boolean(draft.productName && draft.parentModule && draft.moduleName);
  const stepTwoDone = Boolean(draft.documentType && draft.outputStyle && draft.detailLevel);
  const stepThreeDone = Boolean(draft.prompt || draft.generationMode === "api" || draft.generationMode === "mock");
  const stepFourDone = Boolean(draft.documentContent);

  return (
    <main className="page-shell min-h-[calc(100vh-4rem)]">
      <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <Badge className="mb-3 rounded-full bg-indigo-50 text-indigo-700 hover:bg-indigo-50 dark:bg-indigo-500/10 dark:text-indigo-300">
              新手友好的三步流程
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">文档生成工作台</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
              选择模块，配置内容，生成提示词和 Mock 文档，最后保存或导出 Word。
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-4 xl:min-w-[720px]">
            <FlowStep index={1} title="选择模块" active={!stepOneDone} done={stepOneDone} />
            <FlowStep index={2} title="配置内容" active={stepOneDone && !stepTwoDone} done={stepTwoDone} />
            <FlowStep index={3} title="选择模式" active={stepTwoDone && !stepThreeDone} done={stepThreeDone} />
            <FlowStep index={4} title="生成导出" active={stepThreeDone && !stepFourDone} done={stepFourDone} />
          </div>
        </div>

        <div className="mt-5 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["当前 Demo", selectedProject.name],
            ["当前模块", `${draft.parentModule} / ${draft.moduleName}`],
            ["当前模板", activeTemplateName || draft.activeTemplateName || "标准产品说明书模板"],
            ["生成模式", draft.generationMode === "api" ? "API 自动生成" : draft.generationMode === "mock" ? "Mock 文档" : "复制提示词"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
              <div className="text-xs text-slate-400">{label}</div>
              <div className="mt-1 truncate font-medium text-slate-900 dark:text-slate-100">{value}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[16rem_minmax(0,1fr)_24rem]">
        <aside className="space-y-4 xl:sticky xl:top-20 xl:self-start">
          <Card className="rounded-2xl border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <CardContent className="space-y-4 p-4">
              <div className="flex gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-cyan-50 text-blue-600">
                  <Info className="size-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">快速开始</div>
                  <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
                    先选择 Demo 项目和功能模块，再选择生成模式；可以复制提示词，也可以调用 API 或生成 Mock 文档。
                  </p>
                </div>
              </div>
              <IllustrationImage
                src="/images/characters/product-manager.svg"
                alt="产品经理整理文档插画"
                width={190}
                height={143}
                className="mx-auto flex rounded-2xl bg-slate-50 p-2 dark:bg-slate-950"
              />
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">项目与模块</CardTitle>
              <p className="text-sm text-slate-600 dark:text-slate-400">点击模块后会自动填入产品名称、关键词、参考写法和特别要求。</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2 sm:grid-cols-2">
                {demoProjects.map((project) => (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => handleProjectSelect(project)}
                    className={cn(
                      "rounded-2xl border p-3 text-left transition",
                      selectedProjectId === project.id
                        ? "border-l-4 border-l-indigo-600 border-indigo-200 bg-indigo-50 text-indigo-800 dark:border-indigo-500/30 dark:border-l-indigo-400 dark:bg-indigo-500/10 dark:text-indigo-200"
                        : "border-slate-200 bg-white text-slate-700 hover:border-indigo-100 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                    )}
                  >
                    <div className="line-clamp-1 text-sm font-semibold">{project.name}</div>
                    <div className="mt-1 text-xs text-slate-500">{project.productType}</div>
                  </button>
                ))}
              </div>

              <div>
                <div className="mb-2 text-sm font-medium text-slate-700">一级模块</div>
                <div className="flex flex-wrap gap-2">
                  {selectedProject.modules.map((module) => (
                    <button
                      key={module.name}
                      type="button"
                      onClick={() => handleParentSelect(module.name)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-sm transition",
                        draft.parentModule === module.name
                          ? "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      {module.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-2 text-sm font-medium text-slate-700">功能模块</div>
                <div className="flex flex-wrap gap-2">
                  {selectedParent.children.map((moduleName) => (
                    <button
                      key={moduleName}
                      type="button"
                      onClick={() => handleModuleSelect(moduleName)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-sm transition",
                        draft.moduleName === moduleName
                          ? "border-slate-950 bg-slate-950 text-white dark:border-indigo-500 dark:bg-indigo-600"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      {moduleName}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

        </aside>

        <div className="space-y-4">
          <Card className="rounded-2xl border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl font-semibold">告诉系统你要写什么</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field label="产品名称">
                <Input
                  className="rounded-lg focus-visible:ring-2 focus-visible:ring-indigo-500"
                  value={draft.productName}
                  maxLength={100}
                  onChange={(event) => updateDraft("productName", event.target.value)}
                />
                <CharacterCount value={draft.productName} limit={100} />
              </Field>
              <Field label="产品类型">
                <Select value={draft.productType} onValueChange={(value: ProductType) => updateDraft("productType", value)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {productTypes.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="目标用户">
                <Select value={draft.targetUser} onValueChange={(value: TargetUser) => updateDraft("targetUser", value)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {targetUsers.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="所属一级模块">
                <Input
                  className="rounded-lg focus-visible:ring-2 focus-visible:ring-indigo-500"
                  value={draft.parentModule}
                  maxLength={100}
                  onChange={(event) => updateDraft("parentModule", event.target.value)}
                />
                <CharacterCount value={draft.parentModule} limit={100} />
              </Field>
              <Field label="功能模块名称">
                <Input
                  className="rounded-lg focus-visible:ring-2 focus-visible:ring-indigo-500"
                  value={draft.moduleName}
                  maxLength={100}
                  onChange={(event) => updateDraft("moduleName", event.target.value)}
                />
                <CharacterCount value={draft.moduleName} limit={100} />
              </Field>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl font-semibold">选择输出成什么文档</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <Field label="文档类型">
                <Select value={draft.documentType} onValueChange={(value: DocumentType) => updateDraft("documentType", value)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {documentTypes.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="输出详细程度">
                <Select value={draft.detailLevel} onValueChange={(value: DetailLevel) => updateDraft("detailLevel", value)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {detailLevels.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="输出风格">
                <Select value={draft.outputStyle} onValueChange={(value: OutputStyle) => updateDraft("outputStyle", value)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {outputStyles.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <div className="space-y-2 sm:col-span-3">
                <Label className="text-sm font-medium text-slate-700">生成模式</Label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {[
                    { value: "prompt" as GenerationMode, title: "复制提示词模式", description: "生成结构化提示词，复制到常用 AI 工具中继续撰写。" },
                    { value: "api" as GenerationMode, title: "API 自动生成模式", description: "通过服务端 API Route 调用已配置的模型服务生成正文。" },
                  ].map((mode) => (
                    <button
                      key={mode.value}
                      type="button"
                      onClick={() => updateDraft("generationMode", mode.value)}
                      className={cn(
                        "rounded-2xl border p-3 text-left transition",
                        draft.generationMode === mode.value
                          ? "border-indigo-200 bg-indigo-50 text-indigo-800 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-200"
                          : "border-slate-200 bg-white text-slate-700 hover:border-indigo-100 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                      )}
                    >
                      <div className="text-sm font-semibold">{mode.title}</div>
                      <div className="mt-1 text-xs leading-5 text-slate-500">{mode.description}</div>
                    </button>
                  ))}
                </div>
                <div className="mt-2">
                  <Button asChild variant="link" className="h-auto px-0 text-indigo-700 dark:text-indigo-300">
                    <Link href="/settings">配置 API 环境</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <details className="group rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <summary className="flex cursor-pointer list-none items-center justify-between p-5 text-lg font-semibold text-slate-950">
              补充写作参考，可选
              <Circle className="size-3 text-slate-300 transition group-open:fill-blue-500 group-open:text-blue-500" />
            </summary>
            <div className="space-y-4 border-t border-slate-100 p-5 pt-4">
              <Field label="功能关键词">
                <Textarea
                  value={draft.keywords}
                  maxLength={500}
                  onChange={(event) => updateDraft("keywords", event.target.value)}
                  className="min-h-20"
                />
                <CharacterCount value={draft.keywords} limit={500} />
              </Field>
              <Field label="参考写法">
                <Textarea
                  value={draft.referenceWriting}
                  maxLength={1000}
                  onChange={(event) => updateDraft("referenceWriting", event.target.value)}
                  className="min-h-20"
                />
                <CharacterCount value={draft.referenceWriting} limit={1000} />
              </Field>
              <Field label="特别要求">
                <Textarea
                  value={draft.specialRequirements}
                  maxLength={1000}
                  onChange={(event) => updateDraft("specialRequirements", event.target.value)}
                  className="min-h-20"
                />
                <CharacterCount value={draft.specialRequirements} limit={1000} />
              </Field>
            </div>
          </details>

          <details className="group rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <summary className="flex cursor-pointer list-none items-center justify-between p-5 text-lg font-semibold text-slate-950">
              参考材料上传与解析，可选
              <Circle className="size-3 text-slate-300 transition group-open:fill-blue-500 group-open:text-blue-500" />
            </summary>
            <div className="space-y-5 border-t border-slate-100 p-5 pt-4 dark:border-slate-800">
              <ReferenceMaterialUploader
                files={draft.referenceFiles ?? []}
                onChange={(referenceFiles: ReferenceFile[]) => updateDraft("referenceFiles", referenceFiles)}
              />
              <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                <div className="mb-3">
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">页面截图预览</div>
                  <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                    截图仍会保存在草稿中，适合辅助人工查看；如果需要提取图片文字，请在上方参考材料区上传图片进行 OCR。
                  </p>
                </div>
                <ScreenshotUploader
                  screenshots={draft.screenshots}
                  onChange={(screenshots: ScreenshotItem[]) => updateDraft("screenshots", screenshots)}
                />
              </div>
            </div>
          </details>
        </div>

        <div className="xl:sticky xl:top-20 xl:self-start">
          <Card className="rounded-2xl border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <CardHeader className="border-b border-slate-100 pb-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="size-5 text-indigo-600" />
                    生成结果
                  </CardTitle>
                  <p className="mt-1 text-sm text-slate-500">Workspace 只保留生成控制和结果摘要，完整正文请进入编辑页处理。</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" className="min-h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500" onClick={() => void handleGenerateWithApi()} disabled={loading || apiLoading}>
                    {apiLoading ? <Loader2 className="size-4 animate-spin" /> : <WandSparkles className="size-4" />}
                    {apiLoading ? "正在生成文档..." : "调用 API 生成正文"}
                  </Button>
                  <Button type="button" variant="outline" className="min-h-10 rounded-xl" onClick={handleBuildPrompt} disabled={loading || apiLoading}>
                    <WandSparkles className="size-4" />
                    生成提示词
                  </Button>
                  <Button type="button" variant="secondary" className="min-h-10 rounded-xl" onClick={() => void handleGenerateDocument()} disabled={loading || apiLoading}>
                    {loading ? <Loader2 className="size-4 animate-spin" /> : <WandSparkles className="size-4" />}
                    生成 Mock 文档
                  </Button>
                  <Button type="button" variant="ghost" onClick={handleClear} disabled={loading || apiLoading}>
                    <Eraser className="size-4" />
                  </Button>
                </div>
              </div>
              {apiError ? (
                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
                  {apiError} 可以继续使用“生成提示词”或“生成 Mock 文档”完成本地演示。
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
                    onContentChange={(content) => updateDraft("documentContent", content)}
                    onGenerateDocument={() => void handleGenerateDocument()}
                    generating={loading}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
