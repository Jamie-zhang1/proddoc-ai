"use client";

import Link from "next/link";
import { Circle } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { CharacterCount } from "@/components/character-count";
import { ReferenceMaterialUploader } from "@/components/reference-material-uploader";
import { ScreenshotUploader } from "@/components/screenshot-uploader";
import {
  detailLevels,
  documentTypes,
  outputStyles,
  productTypes,
  targetUsers,
} from "@/lib/mock-data";
import type {
  DetailLevel,
  DocumentType,
  GenerationMode,
  OutputStyle,
  ProductType,
  ReferenceFile,
  ScreenshotItem,
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

type DocumentConfigProps = {
  draft: WorkspaceDraft;
  activeTemplateName: string | null;
  onUpdateDraft: <T extends keyof WorkspaceDraft>(key: T, value: WorkspaceDraft[T]) => void;
};

export function DocumentConfig({ draft, activeTemplateName, onUpdateDraft }: DocumentConfigProps) {
  return (
    <div className="space-y-4">
      <Card className="rounded-2xl border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl font-semibold">告诉系统你要写什么</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="产品名称">
            <Input
              className="rounded-lg focus-visible:ring-2 focus-visible:ring-indigo-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              value={draft.productName}
              maxLength={100}
              onChange={(event) => onUpdateDraft("productName", event.target.value)}
            />
            <CharacterCount value={draft.productName} limit={100} />
          </Field>
          <Field label="产品类型">
            <Select value={draft.productType} onValueChange={(value: ProductType) => onUpdateDraft("productType", value)}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {productTypes.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="目标用户">
            <Select value={draft.targetUser} onValueChange={(value: TargetUser) => onUpdateDraft("targetUser", value)}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {targetUsers.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="所属一级模块">
            <Input
              className="rounded-lg focus-visible:ring-2 focus-visible:ring-indigo-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              value={draft.parentModule}
              maxLength={100}
              onChange={(event) => onUpdateDraft("parentModule", event.target.value)}
            />
            <CharacterCount value={draft.parentModule} limit={100} />
          </Field>
          <Field label="功能模块名称">
            <Input
              className="rounded-lg focus-visible:ring-2 focus-visible:ring-indigo-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              value={draft.moduleName}
              maxLength={100}
              onChange={(event) => onUpdateDraft("moduleName", event.target.value)}
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
            <Select value={draft.documentType} onValueChange={(value: DocumentType) => onUpdateDraft("documentType", value)}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {documentTypes.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="输出详细程度">
            <Select value={draft.detailLevel} onValueChange={(value: DetailLevel) => onUpdateDraft("detailLevel", value)}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {detailLevels.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="输出风格">
            <Select value={draft.outputStyle} onValueChange={(value: OutputStyle) => onUpdateDraft("outputStyle", value)}>
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
                  onClick={() => onUpdateDraft("generationMode", mode.value)}
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
              onChange={(event) => onUpdateDraft("keywords", event.target.value)}
              className="min-h-20 placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
            <CharacterCount value={draft.keywords} limit={500} />
          </Field>
          <Field label="参考写法">
            <Textarea
              value={draft.referenceWriting}
              maxLength={1000}
              onChange={(event) => onUpdateDraft("referenceWriting", event.target.value)}
              className="min-h-20 placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
            <CharacterCount value={draft.referenceWriting} limit={1000} />
          </Field>
          <Field label="特别要求">
            <Textarea
              value={draft.specialRequirements}
              maxLength={1000}
              onChange={(event) => onUpdateDraft("specialRequirements", event.target.value)}
              className="min-h-20 placeholder:text-slate-400 dark:placeholder:text-slate-500"
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
            onChange={(referenceFiles: ReferenceFile[]) => onUpdateDraft("referenceFiles", referenceFiles)}
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
              onChange={(screenshots: ScreenshotItem[]) => onUpdateDraft("screenshots", screenshots)}
            />
          </div>
        </div>
      </details>
    </div>
  );
}
