import { NextResponse } from "next/server";
import type { ApiGenerateRequest, ApiGenerateResponse } from "@/lib/types";

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
  return NextResponse.json<ApiGenerateResponse>({ error: message }, { status });
}

export async function POST(request: Request) {
  const apiKey = process.env.AI_API_KEY;
  const baseUrl = process.env.AI_BASE_URL;
  const model = process.env.AI_MODEL;

  if (!apiKey || !baseUrl || !model) {
    return jsonError(missingConfigMessage, 500);
  }

  let body: ApiGenerateRequest;

  try {
    body = (await request.json()) as ApiGenerateRequest;
  } catch {
    return jsonError("请求体格式不正确，请提交 JSON 数据。");
  }

  if (!body.prompt?.trim()) {
    return jsonError("缺少完整提示词，无法生成正文。");
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
        temperature: body.temperature ?? 0.7,
        messages: [
          {
            role: "system",
            content:
              "你是一名资深产品文档专家，请输出结构清晰、专业克制、可直接用于通用软件产品说明书或操作文档的正文。",
          },
          {
            role: "user",
            content: body.prompt,
          },
        ],
      }),
      signal: controller.signal,
    });

    const data = (await response.json().catch(() => null)) as ChatCompletionResponse | null;

    if (!response.ok) {
      return jsonError(data?.error?.message || `模型服务调用失败，状态码：${response.status}`, response.status);
    }

    const content = data?.choices?.[0]?.message?.content?.trim();
    if (!content) {
      return jsonError("模型服务未返回有效正文，请稍后重试。", 502);
    }

    return NextResponse.json<ApiGenerateResponse>({ content });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return jsonError("模型服务响应超时，请稍后重试或降低输入长度。", 504);
    }

    return jsonError(error instanceof Error ? `模型服务网络错误：${error.message}` : "模型服务网络错误。", 502);
  } finally {
    clearTimeout(timeout);
  }
}
