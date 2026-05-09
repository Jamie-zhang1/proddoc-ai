"use client";

import { Clipboard, Info } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { copyText } from "@/lib/clipboard";

type PromptPreviewProps = {
  prompt: string;
};

export function PromptPreview({ prompt }: PromptPreviewProps) {
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
        title="尚未生成提示词"
        description="填写基础信息、输出配置和内容要求后，点击生成提示词。"
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700">
        <Info className="mt-0.5 size-4 shrink-0" />
        当前版本采用 Prompt-assisted workflow，不直接接入大模型 API。请复制提示词到 ChatGPT、Kimi、DeepSeek 或 Claude 等工具中生成内容。
      </div>
      <div className="flex justify-end">
        <Button type="button" variant="outline" onClick={copyPrompt}>
          <Clipboard className="size-4" />
          复制提示词
        </Button>
      </div>
      <pre className="max-h-[58vh] overflow-auto rounded-lg border border-zinc-200 bg-zinc-100 p-4 text-sm leading-7 text-zinc-800 whitespace-pre-wrap">
        {prompt}
      </pre>
    </div>
  );
}
