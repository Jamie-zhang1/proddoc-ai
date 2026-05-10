"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Check, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const TOUR_KEY = "proddoc-ai-tour-completed";

const steps = [
  {
    title: "选择产品模块",
    description: "在左侧填写产品名称、选择模块，或从 Demo 快速填充。支持批量导入多个模块。",
    icon: "📦",
    color: "from-blue-500 to-cyan-500",
    bgLight: "bg-blue-50",
    bgDark: "dark:bg-blue-500/10",
  },
  {
    title: "配置文档类型",
    description: "在中间区域选择文档类型、输出风格和详细程度。应用模板可一键配置。",
    icon: "⚙️",
    color: "from-violet-500 to-purple-500",
    bgLight: "bg-violet-50",
    bgDark: "dark:bg-violet-500/10",
  },
  {
    title: "生成并导出",
    description: "调用 AI 生成正文，或使用提示词/Mock 模式。支持多种 Word 导出格式。",
    icon: "🚀",
    color: "from-amber-500 to-orange-500",
    bgLight: "bg-amber-50",
    bgDark: "dark:bg-amber-500/10",
  },
] as const;

export function isTourCompleted(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(TOUR_KEY) === "true";
}

export function TourOverlay() {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(true);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    // Clear the flag so next workspace visit shows tour again
    // (only if user hasn't completed it)
  }, []);

  if (!visible) return null;

  const current = steps[step];
  const isLast = step === steps.length - 1;
  const progress = ((step + 1) / steps.length) * 100;

  function complete() {
    localStorage.setItem(TOUR_KEY, "true");
    setVisible(false);
  }

  function next() {
    setAnimating(true);
    setTimeout(() => {
      if (isLast) {
        complete();
      } else {
        setStep((s) => s + 1);
      }
      setAnimating(false);
    }, 200);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md">
      {/* Ambient glow */}
      <div
        className={`absolute inset-0 opacity-30 transition-all duration-700 bg-gradient-to-br ${current.color}`}
        style={{ filter: "blur(120px)" }}
      />

      <div className="relative mx-4 w-full max-w-lg overflow-hidden rounded-3xl border border-white/20 bg-white/90 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/90">
        {/* Top gradient bar */}
        <div className={`h-1.5 bg-gradient-to-r ${current.color}`} />

        {/* Close button */}
        <button
          type="button"
          onClick={complete}
          className="absolute right-4 top-5 rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
        >
          <X className="size-4" />
        </button>

        {/* Progress bar */}
        <div className="px-8 pt-6">
          <div className="flex items-center justify-between text-xs font-medium text-slate-400 dark:text-slate-500">
            <span>步骤 {step + 1} / {steps.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${current.color} transition-all duration-500 ease-out`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className={`px-8 pt-8 pb-6 transition-all duration-200 ${animating ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"}`}>
          {/* Icon */}
          <div className={`mb-6 flex size-16 items-center justify-center rounded-2xl ${current.bgLight} ${current.bgDark} text-3xl`}>
            {current.icon}
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            {current.title}
          </h2>

          {/* Description */}
          <p className="mt-3 text-sm leading-7 text-slate-500 dark:text-slate-400">
            {current.description}
          </p>

          {/* Feature hints */}
          <div className="mt-6 space-y-2">
            {step === 0 && (
              <>
                <FeatureHint text="支持批量导入模块列表" />
                <FeatureHint text="Demo 数据可一键填充" />
                <FeatureHint text="可随时添加或删除模块" />
              </>
            )}
            {step === 1 && (
              <>
                <FeatureHint text="5 种文档类型可选" />
                <FeatureHint text="模板可一键应用配置" />
                <FeatureHint text="偏好自动保存到本地" />
              </>
            )}
            {step === 2 && (
              <>
                <FeatureHint text="AI 自动生成正文" />
                <FeatureHint text="3 种 Word 导出格式" />
                <FeatureHint text="历史记录自动追踪" />
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 border-t border-slate-100 px-8 py-5 dark:border-slate-800">
          <Button
            type="button"
            variant="ghost"
            className="rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            onClick={complete}
          >
            跳过引导
          </Button>

          {/* Step dots */}
          <div className="mx-auto flex gap-1.5">
            {steps.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setStep(i)}
                className={`rounded-full transition-all duration-300 ${
                  i === step
                    ? `h-2 w-6 bg-gradient-to-r ${current.color}`
                    : "h-2 w-2 bg-slate-200 dark:bg-slate-700"
                }`}
                aria-label={`步骤 ${i + 1}`}
              />
            ))}
          </div>

          <Button
            type="button"
            className={`min-w-[120px] rounded-xl bg-gradient-to-r ${current.color} text-white shadow-lg hover:shadow-xl hover:brightness-110 transition-all`}
            onClick={next}
          >
            {isLast ? (
              <>
                <Sparkles className="size-4" />
                开始使用
              </>
            ) : (
              <>
                下一步
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

function FeatureHint({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
      <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/20">
        <Check className="size-3 text-emerald-600 dark:text-emerald-400" />
      </div>
      {text}
    </div>
  );
}
