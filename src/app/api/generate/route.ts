import { NextResponse } from "next/server";
import type { ApiGenerateRequest, ApiGenerateResponse, ApiStreamChunk } from "@/lib/types";
import { checkRateLimit } from "@/lib/rate-limit";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type ChatCompletionChunk = {
  choices?: Array<{
    delta?: { content?: string };
    finish_reason?: string | null;
  }>;
  error?: { message?: string };
};

type ChatCompletionResponse = {
  choices?: Array<{
    message?: { content?: string };
  }>;
  error?: { message?: string };
};

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const KEEPALIVE_INTERVAL_MS = 15_000;
const MAX_CACHE_ENTRIES = 64;
const CACHE_TTL_MS = 5 * 60 * 1_000; // 5 minutes
const REQUEST_TIMEOUT_MS = 120_000;

const missingConfigMessage =
  "尚未配置 AI_API_KEY / AI_BASE_URL / AI_MODEL，请先在 .env.local 中配置模型服务。";

const SYSTEM_PROMPT =
  "你是一名资深产品文档专家，请输出结构清晰、专业克制、可直接用于通用软件产品说明书或操作文档的正文。";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function resolveChatCompletionUrl(baseUrl: string) {
  const trimmed = baseUrl.trim().replace(/\/+$/, "");
  return trimmed.endsWith("/chat/completions") ? trimmed : `${trimmed}/chat/completions`;
}

function jsonError(message: string, status = 400) {
  return NextResponse.json<ApiGenerateResponse>({ error: message }, { status });
}

/* ---- In-memory response cache (prompt hash → { content, ts }) ---- */

interface CacheEntry {
  content: string;
  ts: number;
}

const cache = new Map<string, CacheEntry>();

function cacheKey(prompt: string, model: string, temperature: number) {
  return `${model}:${temperature}:${prompt}`;
}

function getCached(key: string): string | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return entry.content;
}

function setCache(key: string, content: string) {
  if (cache.size >= MAX_CACHE_ENTRIES) {
    // Evict oldest
    let oldestKey: string | null = null;
    let oldestTs = Infinity;
    for (const [k, v] of cache) {
      if (v.ts < oldestTs) {
        oldestTs = v.ts;
        oldestKey = k;
      }
    }
    if (oldestKey) cache.delete(oldestKey);
  }
  cache.set(key, { content, ts: Date.now() });
}

/* ------------------------------------------------------------------ */
/*  POST handler                                                       */
/* ------------------------------------------------------------------ */

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
  if (!checkRateLimit(ip, 10, 60000)) {
    return NextResponse.json<ApiGenerateResponse>({ error: "请求过于频繁，请稍后再试" }, { status: 429 });
  }

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

  // Input validation
  if (body.prompt.length > 50000) {
    return jsonError("提示词长度超过限制（最大 50000 字符）。");
  }

  const temperature = body.temperature ?? 0.7;
  if (temperature < 0 || temperature > 2) {
    return jsonError("temperature 值必须在 0 到 2 之间。");
  }

  const allowedDocumentTypes = ["产品说明书", "操作手册", "培训讲稿", "售前介绍", "功能补充说明"];
  if (body.documentType && !allowedDocumentTypes.includes(body.documentType)) {
    return jsonError(`无效的文档类型：${body.documentType}。允许的类型：${allowedDocumentTypes.join("、")}。`);
  }

  /* ---- Non-streaming (cache-aware) path ---- */
  if (!body.stream) {
    const cKey = cacheKey(body.prompt, model, temperature);
    const cached = getCached(cKey);
    if (cached) {
      return NextResponse.json<ApiGenerateResponse>(
        { content: cached },
        { headers: { "X-Cache": "HIT" } },
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(resolveChatCompletionUrl(baseUrl), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          temperature,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: body.prompt },
          ],
        }),
        signal: controller.signal,
      });

      const data = (await response.json().catch(() => null)) as ChatCompletionResponse | null;

      if (!response.ok) {
        const msg = data?.error?.message || `模型服务调用失败，状态码：${response.status}`;
        // Don't cache errors
        return jsonError(msg, response.status);
      }

      const content = data?.choices?.[0]?.message?.content?.trim();
      if (!content) {
        return jsonError("模型服务未返回有效正文，请稍后重试。", 502);
      }

      setCache(cKey, content);
      return NextResponse.json<ApiGenerateResponse>({ content });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return jsonError("模型服务响应超时，请稍后重试或降低输入长度。", 504);
      }
      return jsonError(
        error instanceof Error ? `模型服务网络错误：${error.message}` : "模型服务网络错误。",
        502,
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  /* ---- Streaming (SSE) path ---- */
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      let cancelled = false;

      // Keepalive timer — sends SSE comment every 15 s
      const keepalive = setInterval(() => {
        if (!cancelled) {
          controller.enqueue(encoder.encode(": keepalive\n\n"));
        }
      }, KEEPALIVE_INTERVAL_MS);

      const timeout = setTimeout(() => {
        cancelled = true;
        clearInterval(keepalive);
        sendError("模型服务响应超时，请稍后重试或降低输入长度。");
        controller.close();
      }, REQUEST_TIMEOUT_MS);

      function sendChunk(chunk: ApiStreamChunk) {
        if (cancelled) return;
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
      }

      function sendError(message: string) {
        sendChunk({ error: message, done: true });
      }

      function sendDone() {
        sendChunk({ done: true });
      }

      const upstreamController = new AbortController();

      // If the client disconnects, abort upstream
      request.signal?.addEventListener("abort", () => {
        cancelled = true;
        upstreamController.abort();
        clearInterval(keepalive);
        clearTimeout(timeout);
        controller.close();
      });

      try {
        const response = await fetch(resolveChatCompletionUrl(baseUrl), {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            temperature,
            stream: true,
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              { role: "user", content: body.prompt },
            ],
          }),
          signal: upstreamController.signal,
        });

        if (!response.ok) {
          const data = (await response.json().catch(() => null)) as ChatCompletionResponse | null;
          sendError(data?.error?.message || `模型服务调用失败，状态码：${response.status}`);
          clearInterval(keepalive);
          clearTimeout(timeout);
          controller.close();
          return;
        }

        const reader = response.body?.getReader();
        if (!reader) {
          sendError("模型服务未返回流式数据。");
          clearInterval(keepalive);
          clearTimeout(timeout);
          controller.close();
          return;
        }

        const decoder = new TextDecoder();
        let buffer = "";
        let fullContent = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done || cancelled) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith(":")) continue; // skip comments / empty
            if (!trimmed.startsWith("data: ")) continue;

            const jsonStr = trimmed.slice(6);
            if (jsonStr === "[DONE]") {
              sendDone();
              clearInterval(keepalive);
              clearTimeout(timeout);
              controller.close();
              return;
            }

            try {
              const chunk = JSON.parse(jsonStr) as ChatCompletionChunk;
              const delta = chunk.choices?.[0]?.delta?.content ?? "";
              if (delta) {
                fullContent += delta;
                sendChunk({ content: delta });
              }
            } catch {
              // Malformed JSON line — skip
            }
          }
        }

        // Cache the full result if we collected content
        if (fullContent) {
          const cKey = cacheKey(body.prompt, model, temperature);
          setCache(cKey, fullContent);
        }

        sendDone();
      } catch (error) {
        if (!cancelled) {
          const msg =
            error instanceof Error && error.name === "AbortError"
              ? "模型服务响应超时，请稍后重试或降低输入长度。"
              : error instanceof Error
                ? `模型服务网络错误：${error.message}`
                : "模型服务网络错误。";
          sendError(msg);
        }
      } finally {
        clearInterval(keepalive);
        clearTimeout(timeout);
        controller.close();
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Cache": "MISS",
    },
  });
}
