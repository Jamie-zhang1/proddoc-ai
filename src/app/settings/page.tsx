"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Clipboard,
  Loader2,
  ServerCog,
  ShieldCheck,
  SlidersHorizontal,
  WandSparkles,
} from "lucide-react";
import { toast } from "sonner";
import { IllustrationImage } from "@/components/illustration-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { copyText } from "@/lib/clipboard";
import { defaultDraft, detailLevels, documentTypes, outputStyles } from "@/lib/mock-data";
import { getGenerationPreferences, saveGenerationPreferences } from "@/lib/storage";
import type {
  DetailLevel,
  DocumentType,
  EnvStatusResponse,
  GenerationMode,
  GenerationPreferences,
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

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const saved = getGenerationPreferences();
      if (saved) setPreferences(saved);
      void checkEnvStatus(false);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

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

      <section className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-5">
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
        </div>

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
    </main>
  );
}
