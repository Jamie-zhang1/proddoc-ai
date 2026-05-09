import { NextResponse } from "next/server";
import type { RewriteRequest, RewriteResponse } from "@/lib/types";

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
};

const missingConfigMessage =
  "尚未配置 AI_API_KEY / AI_BASE_URL / AI_MODEL，请先在 .env.local 中配置模型服务。";

function resolveChatCompletionUrl(baseUrl: string) {
  const trimmed = baseUrl.trim().replace(/\/+$/, "");
  return trimmed.endsWith("/chat/completions") ? trimmed : `${trimmed}/chat/completions`;
}

function jsonError(message: string, status = 400) {
  return NextResponse.json<RewriteResponse>({ ok: false, error: message }, { status });
}

function buildRewritePrompt(body: RewriteRequest) {
  const selectedText = body.selectedText?.trim();
  const targetText = selectedText || body.documentText;
  const modeInstruction = {
    full: "请根据修改要求重写全文，并保持产品文档结构完整。",
    selection: "请仅改写选中文本，返回改写后的选中文本。",
    append: "请根据修改要求生成可追加到文末的新内容。",
    polish: "请润色当前段落或选中文本，使其更专业、清晰、适合产品说明书。",
  }[body.mode];

  return `你是一名资深产品文档编辑，请基于用户的修改要求调整软件产品文档内容。

修改模式：${body.mode}
修改说明：${modeInstruction}
用户修改要求：${body.instruction}

参考材料摘要（可选）：
${body.referenceContext || "无"}

修改对象：
${targetText}

输出要求：
1. 只输出修改后的正文，不要解释过程；
2. 保持通用软件产品文档语境；
3. 不要编造具体客户、真实数据或行业案例；
4. 不要泄露或复述无关参考材料；
5. 如果是追加内容，请输出可直接追加到文末的段落。`;
}

export async function POST(request: Request) {
  const apiKey = process.env.AI_API_KEY;
  const baseUrl = process.env.AI_BASE_URL;
  const model = process.env.AI_MODEL;

  if (!apiKey || !baseUrl || !model) {
    return jsonError(missingConfigMessage, 500);
  }

  let body: RewriteRequest;

  try {
    body = (await request.json()) as RewriteRequest;
  } catch {
    return jsonError("请求体格式不正确，请提交 JSON 数据。");
  }

  if (!body.documentText?.trim()) {
    return jsonError("当前预览文本为空，无法进行 AI 修改。");
  }

  if (!body.instruction?.trim()) {
    return jsonError("请先填写修改要求。");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90_000);

  try {
    const response = await fetch(resolveChatCompletionUrl(baseUrl), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.5,
        messages: [
          {
            role: "system",
            content:
              "你是一名资深产品文档编辑，擅长将软件产品说明书内容改写得专业、清晰、结构稳定。",
          },
          {
            role: "user",
            content: buildRewritePrompt(body),
          },
        ],
      }),
      signal: controller.signal,
    });

    const data = (await response.json().catch(() => null)) as ChatCompletionResponse | null;

    if (!response.ok) {
      return jsonError(data?.error?.message || `模型服务调用失败，状态码：${response.status}`, response.status);
    }

    const result = data?.choices?.[0]?.message?.content?.trim();
    if (!result) {
      return jsonError("模型服务未返回有效修改结果，请稍后重试。", 502);
    }

    return NextResponse.json<RewriteResponse>({ ok: true, result });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return jsonError("模型服务响应超时，请稍后重试或缩短修改文本。", 504);
    }

    return jsonError(error instanceof Error ? `模型服务网络错误：${error.message}` : "模型服务网络错误。", 502);
  } finally {
    clearTimeout(timeout);
  }
}
