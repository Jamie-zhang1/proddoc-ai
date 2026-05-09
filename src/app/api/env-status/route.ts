import { NextResponse } from "next/server";
import type { EnvStatusResponse } from "@/lib/types";

function getBaseUrlHost(baseUrl: string | undefined) {
  if (!baseUrl) return undefined;

  try {
    return new URL(baseUrl).host;
  } catch {
    return undefined;
  }
}

export function GET() {
  try {
    const apiKey = process.env.AI_API_KEY;
    const baseUrl = process.env.AI_BASE_URL;
    const model = process.env.AI_MODEL;
    const baseUrlHost = getBaseUrlHost(baseUrl);
    const hasBaseUrl = Boolean(baseUrl && baseUrlHost);

    const response: EnvStatusResponse = {
      hasApiKey: Boolean(apiKey),
      hasBaseUrl,
      hasModel: Boolean(model),
      baseUrlHost,
      model: model || undefined,
      ready: Boolean(apiKey && hasBaseUrl && model),
      error: baseUrl && !baseUrlHost ? "AI_BASE_URL 不是合法 URL，请检查 .env.local 配置。" : undefined,
    };

    return NextResponse.json(response);
  } catch {
    return NextResponse.json<EnvStatusResponse>(
      {
        hasApiKey: false,
        hasBaseUrl: false,
        hasModel: false,
        ready: false,
        error: "环境配置读取失败，请检查本地运行环境。",
      },
      { status: 500 }
    );
  }
}
