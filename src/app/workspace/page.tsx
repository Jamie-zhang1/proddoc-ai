"use client";

import { useEffect, useRef, useState } from "react";
import { Eraser, Info, Loader2, WandSparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { DocumentPreview } from "@/components/document-preview";
import { ModuleTree } from "@/components/module-tree";
import { PromptPreview } from "@/components/prompt-preview";
import { ScreenshotUploader } from "@/components/screenshot-uploader";
import { SectionCard } from "@/components/section-card";
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
import { getActiveTemplate, getWorkspaceDraft, saveWorkspaceDraft } from "@/lib/storage";
import type {
  DemoProject,
  DetailLevel,
  DocumentType,
  OutputStyle,
  ProductType,
  ScreenshotItem,
  TargetUser,
  WorkspaceDraft,
} from "@/lib/types";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-sm text-zinc-700">{label}</Label>
      {children}
    </div>
  );
}

export default function WorkspacePage() {
  const [draft, setDraft] = useState<WorkspaceDraft>(defaultDraft);
  const [selectedProjectId, setSelectedProjectId] = useState(demoProjects[0].id);
  const [loading, setLoading] = useState(false);
  const [draftReady, setDraftReady] = useState(false);
  const [activeTemplateName, setActiveTemplateName] = useState<string | null>(null);
  const userInteractedRef = useRef(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const restored = getWorkspaceDraft();
      if (restored && !userInteractedRef.current) {
        setDraft(restored);
        const matchedProject = demoProjects.find((project) => project.productName === restored.productName);
        if (matchedProject) setSelectedProjectId(matchedProject.id);
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
          referenceWriting: `${current.referenceWriting}\n${getTemplateInstruction(activeTemplate)}`,
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

  function updateDraft<T extends keyof WorkspaceDraft>(key: T, value: WorkspaceDraft[T]) {
    userInteractedRef.current = true;
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function handleProjectSelect(project: DemoProject) {
    userInteractedRef.current = true;
    const firstModule = project.modules[0];
    const firstChild = firstModule.children[0];
    setSelectedProjectId(project.id);
    setDraft((current) => ({
      ...current,
      productName: project.productName,
      productType: project.productType,
      parentModule: firstModule.name,
      moduleName: firstChild,
      ...getDemoModuleSample(project.id, firstModule.name, firstChild),
    }));
  }

  function handleModuleSelect(project: DemoProject, parentModule: string, moduleName: string) {
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

  function handleBuildPrompt() {
    userInteractedRef.current = true;
    const prompt = buildPrompt(draft);
    setDraft((current) => ({ ...current, prompt }));
    toast.success("提示词已生成");
  }

  async function handleGenerateDocument() {
    if (loading) return;

    userInteractedRef.current = true;
    setLoading(true);
    const prompt = draft.prompt || buildPrompt(draft);
    setDraft((current) => ({ ...current, prompt }));

    try {
      await new Promise((resolve) => setTimeout(resolve, 800));

      const documentContent = generateMockDocument({ ...draft, prompt });
      setDraft((current) => ({ ...current, prompt, documentContent }));
      toast.success("Mock 文档已生成");
    } finally {
      setLoading(false);
    }
  }

  function handleClear() {
    userInteractedRef.current = true;
    setDraft({ ...defaultDraft, prompt: "", documentContent: "", screenshots: [] });
    setSelectedProjectId(demoProjects[0].id);
    toast.success("表单已清空并恢复默认 Demo");
  }

  return (
    <main className="mx-auto flex w-full max-w-[1800px] flex-col gap-4 px-4 py-4 sm:px-6 xl:flex-row">
      <ModuleTree
        projects={demoProjects}
        selectedProjectId={selectedProjectId}
        selectedParentModule={draft.parentModule}
        selectedModule={draft.moduleName}
        onProjectSelect={handleProjectSelect}
        onModuleSelect={handleModuleSelect}
      />

      <section className="min-h-[640px] flex-1 overflow-auto rounded-lg border border-zinc-200 bg-zinc-50 p-4 xl:h-[calc(100vh-5.5rem)]">
        <div className="mb-4 flex flex-col gap-3 2xl:flex-row 2xl:items-center 2xl:justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-zinc-950">文档生成工作台</h1>
            <p className="mt-1 text-sm text-zinc-500">填写模块信息，生成提示词，回填 AI 输出并导出 Word。</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={handleBuildPrompt} disabled={loading}>
              <WandSparkles className="size-4" />
              生成提示词
            </Button>
            <Button type="button" onClick={() => void handleGenerateDocument()} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <WandSparkles className="size-4" />}
              生成 Mock 文档
            </Button>
            <Button type="button" variant="ghost" onClick={handleClear} disabled={loading}>
              <Eraser className="size-4" />
              清空表单
            </Button>
          </div>
        </div>

        <div className="mb-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                <Info className="size-4" />
              </div>
              <div>
                <div className="text-sm font-semibold text-zinc-950">快速开始</div>
                <p className="mt-1 text-sm leading-6 text-zinc-500">
                  先从左侧选择 Demo 模块，再生成提示词，随后生成 Mock 文档，最后保存历史或导出 Word。
                </p>
              </div>
            </div>
            {activeTemplateName ? (
              <Badge variant="secondary" className="w-fit bg-slate-100 text-slate-700">
                已启用：{activeTemplateName}
              </Badge>
            ) : null}
          </div>
        </div>

        <div className="space-y-4">
          <SectionCard title="基础信息" description="用于确定文档对象、产品类型和目标阅读者。">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="产品名称">
                <Input value={draft.productName} onChange={(event) => updateDraft("productName", event.target.value)} />
              </Field>
              <Field label="产品类型">
                <Select value={draft.productType} onValueChange={(value: ProductType) => updateDraft("productType", value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {productTypes.map((item) => (
                      <SelectItem key={item} value={item}>{item}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="目标用户">
                <Select value={draft.targetUser} onValueChange={(value: TargetUser) => updateDraft("targetUser", value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {targetUsers.map((item) => (
                      <SelectItem key={item} value={item}>{item}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="所属一级模块">
                <Input value={draft.parentModule} onChange={(event) => updateDraft("parentModule", event.target.value)} />
              </Field>
              <Field label="功能模块名称">
                <Input value={draft.moduleName} onChange={(event) => updateDraft("moduleName", event.target.value)} />
              </Field>
            </div>
          </SectionCard>

          <SectionCard title="输出配置" description="控制文档类型、详细程度和表达风格。">
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="文档类型">
                <Select value={draft.documentType} onValueChange={(value: DocumentType) => updateDraft("documentType", value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {documentTypes.map((item) => (
                      <SelectItem key={item} value={item}>{item}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="输出详细程度">
                <Select value={draft.detailLevel} onValueChange={(value: DetailLevel) => updateDraft("detailLevel", value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {detailLevels.map((item) => (
                      <SelectItem key={item} value={item}>{item}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="输出风格">
                <Select value={draft.outputStyle} onValueChange={(value: OutputStyle) => updateDraft("outputStyle", value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {outputStyles.map((item) => (
                      <SelectItem key={item} value={item}>{item}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </SectionCard>

          <SectionCard title="内容输入" description="补充关键词、参考写法和特别要求，提升提示词质量。">
            <div className="space-y-4">
              <Field label="功能关键词">
                <Textarea
                  value={draft.keywords}
                  onChange={(event) => updateDraft("keywords", event.target.value)}
                  className="min-h-24"
                />
              </Field>
              <Field label="参考写法">
                <Textarea
                  value={draft.referenceWriting}
                  onChange={(event) => updateDraft("referenceWriting", event.target.value)}
                  className="min-h-24"
                />
              </Field>
              <Field label="特别要求">
                <Textarea
                  value={draft.specialRequirements}
                  onChange={(event) => updateDraft("specialRequirements", event.target.value)}
                  className="min-h-24"
                />
              </Field>
            </div>
          </SectionCard>

          <SectionCard title="页面截图" description="上传多张页面截图作为外部 AI 写作时的视觉参考。">
            <ScreenshotUploader
              screenshots={draft.screenshots}
              onChange={(screenshots: ScreenshotItem[]) => updateDraft("screenshots", screenshots)}
            />
          </SectionCard>
        </div>
      </section>

      <section className="min-h-[680px] w-full shrink-0 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm xl:h-[calc(100vh-5.5rem)] xl:w-[520px] 2xl:w-[560px]">
        <Tabs defaultValue="prompt" className="flex h-full flex-col">
          <div className="border-b border-zinc-200 p-3">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="prompt">提示词</TabsTrigger>
              <TabsTrigger value="document">文档预览</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="prompt" className="m-0 flex-1 overflow-auto p-4">
            <PromptPreview prompt={draft.prompt} />
          </TabsContent>
          <TabsContent value="document" className="m-0 flex-1 overflow-auto p-4">
            <DocumentPreview
              draft={draft}
              content={draft.documentContent}
              onContentChange={(content) => updateDraft("documentContent", content)}
            />
          </TabsContent>
        </Tabs>
      </section>
    </main>
  );
}
