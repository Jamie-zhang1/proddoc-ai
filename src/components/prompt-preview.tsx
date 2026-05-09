"use client";

import { Clipboard, Info } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { IllustrationImage } from "@/components/illustration-image";
import { copyText } from "@/lib/clipboard";

type PromptPreviewProps = {
  prompt: string;
  onGeneratePrompt?: () => void;
};

export function PromptPreview({ prompt, onGeneratePrompt }: PromptPreviewProps) {
  async function copyPrompt() {
    if (!prompt.trim()) {
      toast.warning("请先生成提示词");
      return;
    }

    const copied = await copyText(prompt);
    if (copied) {
      toast.success("提示词已复制");
      return;
    }

    toast.error("当前浏览器不支持自动复制，请手动选择文本复制");
  }

  if (!prompt.trim()) {
    return (
      <EmptyState
        title="完成左侧配置后，生成结构化提示词"
        description="提示词可复制到常用 AI 工具中继续生成正文。"
        illustration={
          <IllustrationImage
            src="/images/characters/product-manager.svg"
            alt="写作配置人物插画"
            width={320}
            height={240}
          />
        }
        action={
          onGeneratePrompt ? (
            <Button type="button" onClick={onGeneratePrompt}>
              生成提示词
            </Button>
          ) : null
        }
        className="border-slate-200 bg-white text-slate-950"
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2 rounded-2xl border border-blue-100 bg-blue-50 p-3 text-sm leading-6 text-slate-600">
        <Info className="mt-0.5 size-4 shrink-0 text-blue-600" />
        当前支持提示词辅助与 API 自动生成双模式。你仍可复制提示词到常用 AI 工具中继续生成正文。
      </div>
      <div className="flex justify-end">
        <Button type="button" variant="outline" className="bg-white" onClick={copyPrompt}>
          <Clipboard className="size-4" />
          复制提示词
        </Button>
      </div>
      <pre className="max-h-[58vh] overflow-auto rounded-2xl border border-slate-200 bg-white p-5 text-sm leading-7 text-slate-700 shadow-inner whitespace-pre-wrap">
        {prompt}
      </pre>
    </div>
  );
}
