"use client";

import { useState } from "react";
import { FileUp, Loader2, Save, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { CharacterCount } from "@/components/character-count";
import { ReferenceMaterialUploader } from "@/components/reference-material-uploader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveCustomTemplate } from "@/lib/storage";
import type { CustomTemplate, ReferenceFile, TemplateExtractResponse } from "@/lib/types";

type TemplateImporterProps = {
  onSaved?: (template: CustomTemplate) => void;
};

export function TemplateImporter({ onSaved }: TemplateImporterProps) {
  const [files, setFiles] = useState<ReferenceFile[]>([]);
  const [requirement, setRequirement] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [template, setTemplate] = useState<CustomTemplate | null>(null);

  const parsedFiles = files.filter((file) => file.status === "parsed" && file.extractedText.trim());
  const sourceText = parsedFiles.map((file) => `文件：${file.name}\n${file.extractedText}`).join("\n\n---\n\n");
  const sourceFileName = parsedFiles.map((file) => file.name).join("、") || files[0]?.name || "旧说明书";

  async function extractTemplate() {
    if (!sourceText.trim()) {
      toast.warning("请先上传并完成解析至少一个旧文件");
      return;
    }

    setExtracting(true);
    try {
      const response = await fetch("/api/templates/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceText,
          fileName: sourceFileName,
          userRequirement: requirement,
        }),
      });
      const data = (await response.json().catch(() => ({
        ok: false,
        error: "模板解析结果无法读取。",
      }))) as TemplateExtractResponse;

      if (!response.ok || !data.ok || !data.template) {
        throw new Error(data.error || "模板解析失败，请稍后重试。");
      }

      setTemplate(data.template);
      toast.success("已从旧文件中解析出可复用模板");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "模板解析失败，请稍后重试。");
    } finally {
      setExtracting(false);
    }
  }

  function updateTemplate(patch: Partial<CustomTemplate>) {
    if (!template) return;
    setTemplate({ ...template, ...patch, updatedAt: new Date().toISOString() });
  }

  function saveTemplate() {
    if (!template) {
      toast.warning("请先解析生成模板");
      return;
    }

    const saved = saveCustomTemplate(template);
    if (!saved) {
      toast.error("模板保存失败，请检查浏览器本地存储空间");
      return;
    }

    toast.success("已保存为自定义模板");
    onSaved?.(template);
  }

  return (
    <div className="space-y-5 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-5 shadow-sm dark:border-indigo-500/20 dark:bg-indigo-500/10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Badge className="mb-2 rounded-full bg-white text-indigo-700 hover:bg-white dark:bg-slate-900 dark:text-indigo-300">
            自定义模板
          </Badge>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            从旧文件生成模板
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
            上传旧说明书或截图，先提取文本/OCR，再调用模型抽取标题层级、段落写法、字段规则和语气规范。
          </p>
        </div>
        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-sm">
          <FileUp className="size-5" />
        </div>
      </div>

      <ReferenceMaterialUploader files={files} onChange={setFiles} />

      <div className="space-y-2">
        <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
          我希望模仿这份文档的哪些特点
        </Label>
        <Textarea
          value={requirement}
          maxLength={1000}
          onChange={(event) => setRequirement(event.target.value)}
          placeholder="例如：保留标题层级、字段表述方式、操作步骤写法和注意事项口径。"
          className="min-h-24 rounded-xl bg-white dark:bg-slate-900"
        />
        <CharacterCount value={requirement} limit={1000} />
      </div>

      <Button
        type="button"
        className="rounded-xl bg-indigo-600 hover:bg-indigo-500"
        onClick={() => void extractTemplate()}
        disabled={extracting || !sourceText.trim()}
      >
        {extracting ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
        {extracting ? "正在解析模板..." : "解析生成模板"}
      </Button>

      {template ? (
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label>模板名称</Label>
              <Input
                value={template.name}
                maxLength={100}
                onChange={(event) => updateTemplate({ name: event.target.value })}
              />
              <CharacterCount value={template.name} limit={100} />
            </div>
            <div className="space-y-2">
              <Label>文档类型</Label>
              <Input
                value={template.documentType}
                maxLength={100}
                onChange={(event) => updateTemplate({ documentType: event.target.value })}
              />
              <CharacterCount value={template.documentType} limit={100} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>模板用途说明</Label>
            <Textarea
              value={template.description}
              maxLength={1000}
              onChange={(event) => updateTemplate({ description: event.target.value })}
              className="min-h-20"
            />
            <CharacterCount value={template.description} limit={1000} />
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-950">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">标题层级</div>
              <div className="mt-2 space-y-2 text-xs leading-5 text-slate-600 dark:text-slate-400">
                {template.outline.map((item, index) => (
                  <div key={`${item.titlePattern}-${index}`}>
                    H{item.level} {item.titlePattern}：{item.description}
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-950">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">字段规则</div>
              <div className="mt-2 space-y-2 text-xs leading-5 text-slate-600 dark:text-slate-400">
                {template.fieldRules.map((item, index) => (
                  <div key={`${item.field}-${index}`}>
                    {item.field}：{item.rule}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>模板 Prompt Instruction</Label>
            <Textarea
              value={template.promptInstruction}
              maxLength={3000}
              onChange={(event) => updateTemplate({ promptInstruction: event.target.value })}
              className="min-h-28"
            />
            <CharacterCount value={template.promptInstruction} limit={3000} />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" className="rounded-xl bg-indigo-600 hover:bg-indigo-500" onClick={saveTemplate}>
              <Save className="size-4" />
              保存为自定义模板
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
