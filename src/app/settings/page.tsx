"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  Clipboard,
  Download,
  FileDown,
  FileUp,
  Info,
  Keyboard,
  Loader2,
  ServerCog,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Upload,
  WandSparkles,
} from "lucide-react";
import { toast } from "sonner";
import { IllustrationImage } from "@/components/illustration-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { copyText } from "@/lib/clipboard";
import { defaultDraft, detailLevels, documentTypes, outputStyles } from "@/lib/mock-data";
import {
  clearAllData,
  exportAllData,
  getExportSettings,
  getGenerationPreferences,
  getModelParams,
  getStorageUsageKB,
  getIndexedDBUsageKB,
  getIndexedDBQuotaMB,
  getIDBStatus,
  getIDBRecordCount,
  importAllData,
  saveExportSettings,
  saveGenerationPreferences,
  saveModelParams,
} from "@/lib/storage";
import type {
  DetailLevel,
  DocumentType,
  EnvStatusResponse,
  ExportFormat,
  ExportSettings,
  GenerationMode,
  GenerationPreferences,
  ModelParams,
  OutputStyle,
  TestAiResponse,
} from "@/lib/types";
import { cn } from "@/lib/utils";

const envTemplate = `AI_API_KEY=your_api_key_here
AI_BASE_URL=https://your-provider-compatible-endpoint
AI_MODEL=your-model-name`;

const generationModes: Array<{ value: GenerationMode; label: string; description: string }> = [
  { value: "prompt", label: "复制提示词模式", description: "生成结构化提示词，适合无 API 配置时使用。" },
  { value: "api", label: "API 自动生成模式", description: "通过服务端模型配置直接生成正文。" },
  { value: "mock", label: "本地 Mock 模式", description: "不依赖 API，适合演示和快速初稿。" },
];

function StatusPill({ ready, label }: { ready: boolean; label: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        ready
          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
          : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
      )}
    >
      {label}
    </span>
  );
}

const shortcuts = [
  { keys: ["Ctrl", "Enter"], description: "生成提示词" },
  { keys: ["Ctrl", "Shift", "Enter"], description: "API 生成" },
  { keys: ["Ctrl", "S"], description: "保存历史" },
];

const exportFormats: ExportFormat[] = ["正式文档", "简洁报告", "带页眉页脚"];

export default function SettingsPage() {
  const [envStatus, setEnvStatus] = useState<EnvStatusResponse | null>(null);
  const [checking, setChecking] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [preferences, setPreferences] = useState<GenerationPreferences>({
    generationMode: defaultDraft.generationMode,
    documentType: defaultDraft.documentType,
    detailLevel: defaultDraft.detailLevel,
    outputStyle: defaultDraft.outputStyle,
  });
  const [modelParams, setModelParams] = useState<ModelParams>({ temperature: 0.7, maxTokens: 4096, topP: 0.95 });
  const [exportSettings, setExportSettings] = useState<ExportSettings>({
    defaultFormat: "正式文档",
    filenamePattern: "{productName}_{moduleName}_{date}",
    includeMetadata: true,
  });
  const [storageUsage, setStorageUsage] = useState(0);
  const [idbUsageKB, setIdbUsageKB] = useState<number | null>(null);
  const [idbQuotaMB, setIdbQuotaMB] = useState<number | null>(null);
  const [idbAvailable, setIdbAvailable] = useState(false);
  const [idbDocCount, setIdbDocCount] = useState(0);
  const [idbScreenshotCount, setIdbScreenshotCount] = useState(0);
  const [confirmClear, setConfirmClear] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshStorage = useCallback(() => {
    setStorageUsage(getStorageUsageKB());
    void getIndexedDBUsageKB().then(setIdbUsageKB);
    void getIndexedDBQuotaMB().then(setIdbQuotaMB);
    void getIDBStatus().then((s: { available: boolean; stores: string[] }) => setIdbAvailable(s.available));
    void getIDBRecordCount("documents").then(setIdbDocCount);
    void getIDBRecordCount("screenshots").then(setIdbScreenshotCount);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const saved = getGenerationPreferences();
      if (saved) setPreferences(saved);
      setModelParams(getModelParams());
      setExportSettings(getExportSettings());
      refreshStorage();
      void checkEnvStatus(false);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [refreshStorage]);

  async function checkEnvStatus(showToast = true) {
    setChecking(true);
    try {
      const response = await fetch("/api/env-status", { method: "GET" });
      const data = (await response.json()) as EnvStatusResponse;
      setEnvStatus(data);

      if (showToast) {
        if (data.ready) toast.success("环境配置完整，可以测试 API 连接");
        else toast.warning(data.error || "环境配置不完整，请检查 .env.local");
      }
    } catch {
      toast.error("环境配置检查失败，请确认开发服务正在运行");
    } finally {
      setChecking(false);
    }
  }

  async function testAiConnection() {
    setTesting(true);
    try {
      const response = await fetch("/api/test-ai", { method: "POST" });
      const data = (await response.json()) as TestAiResponse;

      if (!response.ok || !data.ok) {
        toast.error(data.error || "API 连接测试失败");
        return;
      }

      toast.success(data.message || "API 连接正常");
      await checkEnvStatus(false);
    } catch {
      toast.error("API 连接测试失败，请检查网络或模型服务地址");
    } finally {
      setTesting(false);
    }
  }

  async function copyEnvTemplate() {
    const copied = await copyText(envTemplate);
    if (copied) {
      toast.success(".env.local 模板已复制");
      return;
    }

    toast.error("当前浏览器不支持自动复制，请手动选择模板内容复制");
  }

  function updatePreferences(next: GenerationPreferences) {
    setPreferences(next);
    const saved = saveGenerationPreferences(next);
    if (saved) toast.success("默认生成偏好已保存");
    else toast.error("偏好保存失败，请检查浏览器本地存储");
  }

  function updateModelParams(next: ModelParams) {
    setModelParams(next);
    const saved = saveModelParams(next);
    if (saved) toast.success("模型参数已保存");
    else toast.error("模型参数保存失败");
  }

  function updateExportSettings(next: ExportSettings) {
    setExportSettings(next);
    const saved = saveExportSettings(next);
    if (saved) toast.success("导出设置已保存");
    else toast.error("导出设置保存失败");
  }

  function handleClearAllData() {
    if (!confirmClear) {
      setConfirmClear(true);
      return;
    }
    const ok = clearAllData();
    if (ok) {
      toast.success("所有数据已清除");
      setConfirmClear(false);
      refreshStorage();
    } else {
      toast.error("清除失败");
    }
  }

  function handleExportData() {
    const data = exportAllData();
    if (!data) {
      toast.error("导出失败");
      return;
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `proddoc-ai-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("数据已导出");
  }

  function handleImportData(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string) as Record<string, unknown>;
        const ok = importAllData(data);
        if (ok) {
          toast.success("数据已导入");
          refreshStorage();
        } else {
          toast.error("导入失败");
        }
      } catch {
        toast.error("文件格式无效");
      }
    };
    reader.readAsText(file);
    // Reset so the same file can be re-imported
    event.target.value = "";
  }

  const ready = Boolean(envStatus?.ready);

  return (
    <main className="page-shell">
      <section className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/95">
        <div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-center">
          <div>
            <Badge className="mb-4 rounded-full bg-indigo-50 text-indigo-700 hover:bg-indigo-50 dark:bg-indigo-500/10 dark:text-indigo-300">
              本地环境与生成偏好
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">设置</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-400">
              管理本地运行环境、API 生成配置和默认生成偏好。API Key 只在服务端读取，页面不会展示真实密钥。
            </p>
          </div>
          <IllustrationImage
            src="/images/characters/ai-doc-assistant.svg"
            alt="设置页面 AI 文档助手插画"
            width={320}
            height={231}
            className="rounded-3xl bg-slate-50 p-3 dark:bg-slate-950"
          />
        </div>
      </section>

      {/* Row 1: API Config + Generation Preferences */}
      <section className="grid gap-5 lg:grid-cols-2">
        <Card className="rounded-2xl border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <ServerCog className="size-5 text-indigo-600" />
              API 环境配置
            </CardTitle>
            <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">
              检查 `.env.local` 中的模型服务配置状态。修改环境变量后，需要重启 `npm run dev`。
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                <div className="text-sm text-slate-400">API Key</div>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {envStatus?.hasApiKey ? "已配置" : "未配置"}
                  </span>
                  <StatusPill ready={Boolean(envStatus?.hasApiKey)} label={envStatus?.hasApiKey ? "安全读取" : "待配置"} />
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                <div className="text-sm text-slate-400">Base URL</div>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <span className="truncate font-semibold text-slate-900 dark:text-slate-100">
                    {envStatus?.baseUrlHost || "未配置"}
                  </span>
                  <StatusPill ready={Boolean(envStatus?.hasBaseUrl)} label={envStatus?.hasBaseUrl ? "已配置" : "待配置"} />
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                <div className="text-sm text-slate-400">Model</div>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <span className="truncate font-semibold text-slate-900 dark:text-slate-100">
                    {envStatus?.model || "未配置"}
                  </span>
                  <StatusPill ready={Boolean(envStatus?.hasModel)} label={envStatus?.hasModel ? "已配置" : "待配置"} />
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                <div className="text-sm text-slate-400">当前状态</div>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{ready ? "可调用" : "配置不完整"}</span>
                  <StatusPill ready={ready} label={ready ? "Ready" : "Not ready"} />
                </div>
              </div>
            </div>

            {envStatus?.error ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
                {envStatus.error}
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <Button type="button" className="rounded-xl bg-indigo-600 hover:bg-indigo-500" onClick={() => void checkEnvStatus()} disabled={checking}>
                {checking ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
                检查环境配置
              </Button>
              <Button type="button" variant="outline" className="rounded-xl bg-white dark:bg-slate-900" onClick={() => void testAiConnection()} disabled={testing}>
                {testing ? <Loader2 className="size-4 animate-spin" /> : <WandSparkles className="size-4" />}
                测试 API 连接
              </Button>
              <Button type="button" variant="outline" className="rounded-xl bg-white dark:bg-slate-900" onClick={() => void copyEnvTemplate()}>
                <Clipboard className="size-4" />
                复制 .env.local 模板
              </Button>
              <Button type="button" variant="ghost" onClick={() => setShowGuide((current) => !current)}>
                查看配置说明
              </Button>
              <Button asChild variant="secondary" className="rounded-xl">
                <Link href="/workspace">返回工作台</Link>
              </Button>
            </div>

            {showGuide ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">配置说明</div>
                <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-slate-600 dark:text-slate-400">
                  <li>在项目根目录创建 `.env.local` 文件。</li>
                  <li>填入自己的模型服务配置，格式见下方模板。</li>
                  <li>保存后重启 `npm run dev`，再回到本页检查配置。</li>
                </ol>
                <pre className="mt-4 overflow-auto rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                  {envTemplate}
                </pre>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <SlidersHorizontal className="size-5 text-indigo-600" />
              默认生成偏好
            </CardTitle>
            <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">
              偏好仅保存在当前浏览器 localStorage。Workspace 有草稿时以草稿优先，不会强行覆盖。
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>默认生成模式</Label>
              <Select
                value={preferences.generationMode}
                onValueChange={(value: GenerationMode) =>
                  updatePreferences({ ...preferences, generationMode: value })
                }
              >
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {generationModes.map((mode) => (
                    <SelectItem key={mode.value} value={mode.value}>
                      {mode.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs leading-5 text-slate-400">
                {generationModes.find((mode) => mode.value === preferences.generationMode)?.description}
              </p>
            </div>

            <div className="space-y-2">
              <Label>默认文档类型</Label>
              <Select
                value={preferences.documentType}
                onValueChange={(value: DocumentType) =>
                  updatePreferences({ ...preferences, documentType: value })
                }
              >
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {documentTypes.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>默认输出详细程度</Label>
              <Select
                value={preferences.detailLevel}
                onValueChange={(value: DetailLevel) =>
                  updatePreferences({ ...preferences, detailLevel: value })
                }
              >
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {detailLevels.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>默认输出风格</Label>
              <Select
                value={preferences.outputStyle}
                onValueChange={(value: OutputStyle) =>
                  updatePreferences({ ...preferences, outputStyle: value })
                }
              >
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {outputStyles.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4 text-sm leading-6 text-indigo-800 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-200">
              <div className="mb-1 flex items-center gap-2 font-semibold">
                <CheckCircle2 className="size-4" />
                已启用本地偏好
              </div>
              下次进入 Workspace 且没有已有草稿时，会自动使用这里的默认生成偏好。
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Row 2: Model Params + Export Settings */}
      <section className="grid gap-5 lg:grid-cols-2">
        <Card className="rounded-2xl border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Sparkles className="size-5 text-indigo-600" />
              模型参数
            </CardTitle>
            <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">
              调整 API 生成时的模型行为参数。修改后将应用到后续的 API 自动生成。
            </p>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Temperature</Label>
                <span className="rounded-lg bg-indigo-50 px-2 py-0.5 text-sm font-mono text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
                  {modelParams.temperature}
                </span>
              </div>
              <Slider
                value={[modelParams.temperature]}
                onValueChange={([value]) => updateModelParams({ ...modelParams, temperature: value })}
                min={0}
                max={2}
                step={0.1}
              />
              <p className="text-xs leading-5 text-slate-400">
                控制生成内容的随机性。较低值更确定，较高值更多样。
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Max Output Tokens</Label>
                <span className="rounded-lg bg-indigo-50 px-2 py-0.5 text-sm font-mono text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
                  {modelParams.maxTokens}
                </span>
              </div>
              <Slider
                value={[modelParams.maxTokens]}
                onValueChange={([value]) => updateModelParams({ ...modelParams, maxTokens: value })}
                min={1000}
                max={8000}
                step={256}
              />
              <p className="text-xs leading-5 text-slate-400">
                生成内容的最大长度。较长文档建议设置较高值。
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Top P</Label>
                <span className="rounded-lg bg-indigo-50 px-2 py-0.5 text-sm font-mono text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
                  {modelParams.topP}
                </span>
              </div>
              <Slider
                value={[modelParams.topP]}
                onValueChange={([value]) => updateModelParams({ ...modelParams, topP: value })}
                min={0}
                max={1}
                step={0.05}
              />
              <p className="text-xs leading-5 text-slate-400">
                核采样参数，控制概率分布截断。通常保持默认即可。
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <FileDown className="size-5 text-indigo-600" />
              导出设置
            </CardTitle>
            <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">
              自定义文档导出时的默认格式和文件命名规则。
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>默认导出格式</Label>
              <Select
                value={exportSettings.defaultFormat}
                onValueChange={(value: ExportFormat) =>
                  updateExportSettings({ ...exportSettings, defaultFormat: value })
                }
              >
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {exportFormats.map((fmt) => <SelectItem key={fmt} value={fmt}>{fmt}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>文件名模式</Label>
              <Input
                value={exportSettings.filenamePattern}
                onChange={(e) => updateExportSettings({ ...exportSettings, filenamePattern: e.target.value })}
                placeholder="{productName}_{moduleName}_{date}"
                className="rounded-xl"
              />
              <p className="text-xs leading-5 text-slate-400">
                可用占位符: {'{productName}'} {'{moduleName}'} {'{date}'} {'{docType}'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Checkbox
                id="include-metadata"
                checked={exportSettings.includeMetadata}
                onCheckedChange={(checked) =>
                  updateExportSettings({ ...exportSettings, includeMetadata: Boolean(checked) })
                }
              />
              <Label htmlFor="include-metadata" className="text-sm font-normal">
                导出时包含元数据（产品信息、生成日期等）
              </Label>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Row 3: Data Management + Keyboard Shortcuts */}
      <section className="grid gap-5 lg:grid-cols-2">
        <Card className="rounded-2xl border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Trash2 className="size-5 text-indigo-600" />
              数据管理
            </CardTitle>
            <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">
              管理浏览器本地存储的历史记录、草稿和偏好设置。
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
              <div className="text-sm text-slate-400">存储使用量</div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{storageUsage}</span>
                <span className="text-sm text-slate-500">KB / 5 MB (localStorage)</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                <div
                  className="h-full rounded-full bg-indigo-500 transition-all"
                  style={{ width: `${Math.min((storageUsage / 5120) * 100, 100)}%` }}
                />
              </div>
              <div className="mt-3">
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {idbUsageKB !== null ? idbUsageKB : (idbAvailable ? "~0" : "—")}
                  </span>
                  <span className="text-sm text-slate-500">
                    KB{idbQuotaMB !== null ? ` / ${idbQuotaMB} MB` : ""} (IndexedDB)
                  </span>
                  <span className={`ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${idbAvailable ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"}`}
                  >
                    {idbAvailable ? "可用" : "不可用（需 HTTPS）"}
                  </span>
                </div>
                {idbAvailable && (
                  <div className="mt-2 flex gap-4 text-xs text-slate-500">
                    <span>📄 文档: {idbDocCount} 条</span>
                    <span>🖼️ 截图: {idbScreenshotCount} 条</span>
                  </div>
                )}
                <p className="mt-1 text-xs leading-5 text-slate-400">
                  截图和大型文档内容自动存储在 IndexedDB 中，不受 5MB 限制。
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" className="rounded-xl bg-white dark:bg-slate-900" onClick={handleExportData}>
                <Download className="size-4" />
                导出所有数据
              </Button>
              <Button type="button" variant="outline" className="rounded-xl bg-white dark:bg-slate-900" onClick={() => fileInputRef.current?.click()}>
                <Upload className="size-4" />
                导入数据
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImportData}
              />
              <Button
                type="button"
                variant={confirmClear ? "destructive" : "outline"}
                className="rounded-xl"
                onClick={handleClearAllData}
                onMouseLeave={() => setConfirmClear(false)}
              >
                <Trash2 className="size-4" />
                {confirmClear ? "确认清除？点击再次确认" : "清除所有数据"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Keyboard className="size-5 text-indigo-600" />
              快捷键
            </CardTitle>
            <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">
              工作台中可用的键盘快捷键。
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {shortcuts.map((shortcut) => (
                <div key={shortcut.description} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
                  <span className="text-sm text-slate-700 dark:text-slate-300">{shortcut.description}</span>
                  <div className="flex items-center gap-1">
                    {shortcut.keys.map((key) => (
                      <kbd
                        key={key}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-xs font-mono text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
                      >
                        {key}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs leading-5 text-slate-400">
              快捷键在工作台页面生效，设置页面不可用。
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Row 4: About (full width) */}
      <section>
        <Card className="rounded-2xl border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Info className="size-5 text-indigo-600" />
              关于
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-slate-900 dark:text-slate-100">ProdDoc AI</span>
                  <Badge variant="secondary" className="rounded-full text-xs">v0.1.0</Badge>
                </div>
                <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">
                  智能产品文档生成助手 · 基于 AI 的售前/实施文档自动化工具
                </p>
                <p className="text-xs leading-5 text-slate-400">
                  技术栈: Next.js / TypeScript / Tailwind CSS / shadcn/ui
                </p>
              </div>
              <Button type="button" variant="outline" className="rounded-xl bg-white dark:bg-slate-900">
                检查更新
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
