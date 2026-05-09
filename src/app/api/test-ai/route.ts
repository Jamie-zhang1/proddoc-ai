import { NextResponse } from "next/server";
import type { TestAiResponse } from "@/lib/types";

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
  return NextResponse.json<TestAiResponse>({ ok: false, error: message }, { status });
}

export async function POST() {
  const apiKey = process.env.AI_API_KEY;
  const baseUrl = process.env.AI_BASE_URL;
  const model = process.env.AI_MODEL;

  if (!apiKey || !baseUrl || !model) {
    return jsonError(missingConfigMessage, 500);
  }

  try {
    new URL(baseUrl);
  } catch {
    return jsonError("AI_BASE_URL 不是合法 URL，请检查 .env.local 配置。", 400);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  try {
    const response = await fetch(resolveChatCompletionUrl(baseUrl), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0,
        messages: [
          {
            role: "user",
            content: "请回复：连接正常",
          },
        ],
      }),
      signal: controller.signal,
    });

    const data = (await response.json().catch(() => null)) as ChatCompletionResponse | null;

    if (!response.ok) {
      return jsonError(data?.error?.message || `模型服务连接失败，状态码：${response.status}`, response.status);
    }

    const content = data?.choices?.[0]?.message?.content?.trim();
    if (!content) {
      return jsonError("模型服务已响应，但没有返回有效内容。", 502);
    }

    return NextResponse.json<TestAiResponse>({ ok: true, message: "API 连接正常" });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return jsonError("API 连接测试超时，请检查模型服务地址或网络。", 504);
    }

    return jsonError(error instanceof Error ? `API 连接测试失败：${error.message}` : "API 连接测试失败。", 502);
  } finally {
    clearTimeout(timeout);
  }
}
