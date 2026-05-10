import { NextResponse } from "next/server";
import type {
  CustomTemplate,
  ExtractedDocumentStructure,
  ExtractedOutlineNode,
  GenerationPlanSuggestion,
  SectionSchema,
  TableSchema,
  TemplateExtractRequest,
  TemplateExtractResponse,
  TemplateFieldRule,
  TemplateOutlineItem,
  TemplateSectionPattern,
  WritingPattern,
} from "@/lib/types";
import { checkRateLimit } from "@/lib/rate-limit";

type ChatCompletionResponse = {
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message?: string };
};

const missingConfigMessage =
  "尚未配置 AI_API_KEY / AI_BASE_URL / AI_MODEL，请先在 .env.local 中配置模型服务。";
const maxSourceLength = 16000;

function resolveChatCompletionUrl(baseUrl: string) {
  const trimmed = baseUrl.trim().replace(/\/+$/, "");
  return trimmed.endsWith("/chat/completions") ? trimmed : `${trimmed}/chat/completions`;
}

function jsonError(message: string, status = 400) {
  return NextResponse.json<TemplateExtractResponse>({ ok: false, error: message }, { status });
}

function createId(prefix = "item") {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
}

function keepHeadAndTail(text: string) {
  const normalized = text.replace(/\n{3,}/g, "\n\n").trim();
  if (normalized.length <= maxSourceLength) return normalized;
  const headLength = Math.floor(maxSourceLength * 0.7);
  const tailLength = maxSourceLength - headLength;
  return `${normalized.slice(0, headLength)}

……旧文件内容较长，已保留开头结构与结尾信息，中间部分已截断……

${normalized.slice(-tailLength)}`;
}

function extractJson(content: string) {
  const fenced = content.match(/```json\s*([\s\S]*?)```/i);
  const raw = fenced?.[1] ?? content;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("模型未返回可解析的 JSON 结构。");
  return JSON.parse(raw.slice(start, end + 1)) as Record<string, unknown>;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function bool(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function num(value: unknown, fallback = 0) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function normalizeOutline(value: unknown, fallbackTitle = "文档概述", level = 1): ExtractedOutlineNode[] {
  if (!Array.isArray(value) || !value.length) {
    return [
      {
        id: createId("outline"),
        level,
        title: fallbackTitle,
        estimatedChars: 1200,
        summary: "识别到的默认章节，可作为模板样例。",
        children: [],
        selected: true,
        role: "sample",
      },
    ];
  }

  return value.map((item, index) => {
    const record = asRecord(item);
    return {
      id: String(record.id || createId("outline")),
      level: Math.min(Math.max(num(record.level, level), 1), 4),
      title: String(record.title || `章节 ${index + 1}`),
      estimatedChars: num(record.estimatedChars, 1000),
      summary: String(record.summary || "该章节用于说明功能定位、页面能力或操作规则。"),
      children: normalizeOutline(record.children, "子章节", Math.min(level + 1, 4)).filter(
        (_, childIndex) => Array.isArray(record.children) || childIndex < 0
      ),
      selected: bool(record.selected, true),
      role: ["keep", "ignore", "merge", "split", "sample"].includes(String(record.role))
        ? (record.role as ExtractedOutlineNode["role"])
        : "keep",
    };
  });
}

function normalizeWritingPatterns(value: unknown): WritingPattern[] {
  if (!Array.isArray(value) || !value.length) {
    return [
      {
        id: createId("pattern"),
        name: "功能模块介绍型",
        description: "围绕功能入口、核心能力、操作方式、字段说明和注意事项组织内容。",
        applicableSections: ["功能说明", "操作说明"],
        structure: ["功能入口", "功能定位", "操作方式", "字段说明", "注意事项"],
        styleRules: ["专业清晰", "避免营销化空话", "保留权限边界"],
        exampleExcerpt: "进入对应模块后，用户可通过筛选条件定位记录，并查看关键字段与操作状态。",
        selected: true,
      },
    ];
  }

  return value.map((item) => {
    const record = asRecord(item);
    return {
      id: String(record.id || createId("pattern")),
      name: String(record.name || "功能模块介绍型"),
      description: String(record.description || "说明该写法类型适用的章节和表达方式。"),
      applicableSections: stringArray(record.applicableSections),
      structure: stringArray(record.structure),
      styleRules: stringArray(record.styleRules),
      exampleExcerpt: String(record.exampleExcerpt || ""),
      selected: bool(record.selected, true),
    };
  });
}

function normalizeSectionSchemas(value: unknown): SectionSchema[] {
  if (!Array.isArray(value) || !value.length) {
    return [
      {
        id: createId("schema"),
        name: "功能模块说明结构",
        purpose: "约束功能模块章节的稳定写法。",
        requiredParts: ["功能入口", "功能定位", "页面展示内容", "操作方式", "字段说明", "权限边界"],
        optionalParts: ["使用价值", "注意事项", "数据来源"],
        writingRules: ["先说明入口，再说明能力和操作结果", "字段说明应具体但不编造数据"],
        selected: true,
      },
    ];
  }

  return value.map((item) => {
    const record = asRecord(item);
    return {
      id: String(record.id || createId("schema")),
      name: String(record.name || "章节结构模式"),
      purpose: String(record.purpose || "说明该章节结构的用途。"),
      requiredParts: stringArray(record.requiredParts),
      optionalParts: stringArray(record.optionalParts),
      writingRules: stringArray(record.writingRules),
      selected: bool(record.selected, true),
    };
  });
}

function normalizeTableSchemas(value: unknown): TableSchema[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const record = asRecord(item);
    return {
      id: String(record.id || createId("table")),
      name: String(record.name || "字段说明表"),
      columns: stringArray(record.columns),
      purpose: String(record.purpose || "用于说明字段含义、来源或操作规则。"),
      reuseInNewDocument: bool(record.reuseInNewDocument, true),
    };
  });
}

function normalizePlan(value: unknown, outline: ExtractedOutlineNode[]): GenerationPlanSuggestion {
  const record = asRecord(value);
  const recommendedSections = Array.isArray(record.recommendedSections)
    ? record.recommendedSections.map((item, index) => {
        const section = asRecord(item);
        return {
          title: String(section.title || `章节 ${index + 1}`),
          targetChars: num(section.targetChars, 2500),
          generationOrder: num(section.generationOrder, index + 1),
        };
      })
    : outline.map((item, index) => ({
        title: item.title,
        targetChars: Math.max(item.estimatedChars, 2500),
        generationOrder: index + 1,
      }));

  return {
    recommendedTotalChars: num(
      record.recommendedTotalChars,
      recommendedSections.reduce((sum, item) => sum + item.targetChars, 0)
    ),
    recommendedSections,
  };
}

function normalizeStructure(raw: Record<string, unknown>, body: TemplateExtractRequest): ExtractedDocumentStructure {
  const sourceText = body.sourceText || "";
  const structureRaw = asRecord(raw.structure ?? raw);
  const outline = normalizeOutline(structureRaw.outline, body.fileName);
  const writingPatterns = normalizeWritingPatterns(structureRaw.writingPatterns);
  const sectionSchemas = normalizeSectionSchemas(structureRaw.sectionSchemas);
  const tableSchemas = normalizeTableSchemas(structureRaw.tableSchemas);
  const flatOutlineCount = countOutline(outline);

  return {
    fileName: String(structureRaw.fileName || body.fileName),
    fileType: String(structureRaw.fileType || body.fileName.split(".").pop() || "unknown"),
    totalChars: num(structureRaw.totalChars, sourceText.length),
    detectedTitleCount: num(structureRaw.detectedTitleCount, flatOutlineCount),
    detectedSectionCount: num(structureRaw.detectedSectionCount, flatOutlineCount),
    detectedTableCount: num(structureRaw.detectedTableCount, tableSchemas.length),
    detectedModuleCount: num(structureRaw.detectedModuleCount, Math.max(1, outline.length)),
    hasOperationSteps: bool(structureRaw.hasOperationSteps, sourceText.includes("步骤")),
    hasPermissionBoundary: bool(structureRaw.hasPermissionBoundary, sourceText.includes("权限")),
    hasValueExpression: bool(structureRaw.hasValueExpression, sourceText.includes("价值")),
    outline,
    writingPatterns,
    sectionSchemas,
    tableSchemas,
    generationPlanSuggestion: normalizePlan(structureRaw.generationPlanSuggestion, outline),
    templateInstruction: String(
      structureRaw.templateInstruction ||
        "请按照识别出的标题层级、章节结构、字段说明方式和语气规则生成新说明书，不要复制旧文档中的真实客户数据、公司信息或案例。"
    ),
  };
}

function countOutline(nodes: ExtractedOutlineNode[]): number {
  return nodes.reduce((sum, node) => sum + 1 + countOutline(node.children), 0);
}

function normalizeTemplate(
  raw: Record<string, unknown>,
  structure: ExtractedDocumentStructure,
  fileName: string
): CustomTemplate {
  const templateRaw = asRecord(raw.template);
  const now = new Date().toISOString();
  const selectedSections = structure.sectionSchemas.filter((item) => item.selected);
  const outlineItems: TemplateOutlineItem[] = structure.outline.map((item) => ({
    level: item.level,
    titlePattern: item.title,
    description: item.summary,
  }));
  const sectionPatterns: TemplateSectionPattern[] = selectedSections.map((item) => ({
    name: item.name,
    purpose: item.purpose,
    writingPattern: item.writingRules.join("；") || item.purpose,
    requiredElements: item.requiredParts,
    exampleStyle: "保持专业、清晰、适合 B 端产品说明书的表达方式。",
  }));
  const fieldRules: TemplateFieldRule[] = structure.tableSchemas.flatMap((table) =>
    table.columns.map((column) => ({ field: column, rule: `${table.name}中的字段，用于${table.purpose}` }))
  );

  return {
    id: String(templateRaw.id || createId("template")),
    name: String(templateRaw.name || `${fileName} 写作模板`),
    description: String(templateRaw.description || "从旧说明书中抽取的可复用写作模板。"),
    documentType: String(templateRaw.documentType || "产品说明书"),
    outline: Array.isArray(templateRaw.outline) ? (templateRaw.outline as TemplateOutlineItem[]) : outlineItems,
    sectionPatterns: Array.isArray(templateRaw.sectionPatterns)
      ? (templateRaw.sectionPatterns as TemplateSectionPattern[])
      : sectionPatterns,
    fieldRules: Array.isArray(templateRaw.fieldRules) ? (templateRaw.fieldRules as TemplateFieldRule[]) : fieldRules,
    toneRules: stringArray(templateRaw.toneRules).length
      ? stringArray(templateRaw.toneRules)
      : ["专业", "清晰", "适合 B 端产品说明书", "避免营销化空话"],
    doRules: stringArray(templateRaw.doRules).length
      ? stringArray(templateRaw.doRules)
      : ["保留功能入口", "说明关键字段", "说明操作路径", "说明权限或使用边界"],
    dontRules: stringArray(templateRaw.dontRules).length
      ? stringArray(templateRaw.dontRules)
      : ["不要编造客户案例", "不要复制旧文档中的真实客户数据", "不要输出空泛价值表达"],
    promptInstruction: String(templateRaw.promptInstruction || structure.templateInstruction),
    sourceFileName: fileName,
    extractedStructure: structure,
    createdAt: String(templateRaw.createdAt || now),
    updatedAt: now,
  };
}

function buildPrompt(body: TemplateExtractRequest) {
  return `请从以下旧产品说明书中识别结构，并抽取一个可复用的软件产品文档模板。

文件名：${body.fileName}
用户额外要求：${body.userRequirement || "无"}

旧文档提取文本：
${keepHeadAndTail(body.sourceText)}

输出要求：
1. 必须返回 JSON，不要输出 Markdown 解释；
2. 不要直接复制旧文档原文；
3. 不得保留旧文档中的真实客户数据、公司信息、业务数据或案例；
4. 必须识别目录结构、写法类型、章节结构模式、表格规则和长篇生成计划；
5. 模板应是抽象后的结构和规则，可用于新说明书生成。

JSON 结构：
{
  "structure": {
    "fileName": "文件名",
    "fileType": "docx/pdf/image/text",
    "totalChars": 12345,
    "detectedTitleCount": 12,
    "detectedSectionCount": 12,
    "detectedTableCount": 3,
    "detectedModuleCount": 5,
    "hasOperationSteps": true,
    "hasPermissionBoundary": true,
    "hasValueExpression": true,
    "outline": [
      {
        "id": "outline_1",
        "level": 1,
        "title": "一级标题",
        "estimatedChars": 3000,
        "summary": "章节摘要",
        "children": [],
        "selected": true,
        "role": "keep"
      }
    ],
    "writingPatterns": [
      {
        "id": "pattern_1",
        "name": "功能模块介绍型",
        "description": "适合说明功能定位、入口和能力",
        "applicableSections": ["功能说明"],
        "structure": ["功能入口", "功能定位", "操作方式", "字段说明", "权限边界"],
        "styleRules": ["专业清晰", "避免空泛表达"],
        "exampleExcerpt": "脱敏后的示例片段",
        "selected": true
      }
    ],
    "sectionSchemas": [
      {
        "id": "schema_1",
        "name": "功能模块说明结构",
        "purpose": "约束功能模块章节写法",
        "requiredParts": ["功能入口", "功能定位", "检索条件", "页面展示内容", "操作方式", "字段说明", "使用场景", "使用价值", "注意事项", "权限边界"],
        "optionalParts": ["数据来源", "报告下载"],
        "writingRules": ["先说明入口，再说明能力和操作结果"],
        "selected": true
      }
    ],
    "tableSchemas": [
      {
        "id": "table_1",
        "name": "功能字段说明表",
        "columns": ["字段名称", "字段说明", "是否必填", "展示规则"],
        "purpose": "作为字段说明模板",
        "reuseInNewDocument": true
      }
    ],
    "generationPlanSuggestion": {
      "recommendedTotalChars": 50000,
      "recommendedSections": [
        { "title": "章节标题", "targetChars": 3000, "generationOrder": 1 }
      ]
    },
    "templateInstruction": "可放入生成 prompt 的模板使用说明"
  },
  "template": {
    "name": "模板名称",
    "description": "模板用途",
    "documentType": "产品说明书",
    "toneRules": ["专业", "清晰"],
    "doRules": ["保留功能入口"],
    "dontRules": ["不要复制真实客户数据"],
    "promptInstruction": "模板约束"
  }
}`;
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
  if (!checkRateLimit(ip, 10, 60000)) {
    return NextResponse.json<TemplateExtractResponse>({ ok: false, error: "请求过于频繁，请稍后再试" }, { status: 429 });
  }

  const apiKey = process.env.AI_API_KEY;
  const baseUrl = process.env.AI_BASE_URL;
  const model = process.env.AI_MODEL;

  if (!apiKey || !baseUrl || !model) return jsonError(missingConfigMessage, 500);

  let body: TemplateExtractRequest;
  try {
    body = (await request.json()) as TemplateExtractRequest;
  } catch {
    return jsonError("请求体格式不正确，请提交 JSON 数据。");
  }

  if (!body.sourceText?.trim()) return jsonError("旧文件解析文本为空，无法识别结构。");

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
        temperature: 0.25,
        messages: [
          {
            role: "system",
            content:
              "你是一名资深产品说明书架构师，负责识别旧说明书目录、章节模式、表格规则和长篇生成计划，只输出可解析 JSON。",
          },
          { role: "user", content: buildPrompt(body) },
        ],
      }),
      signal: controller.signal,
    });

    const data = (await response.json().catch(() => null)) as ChatCompletionResponse | null;
    if (!response.ok) {
      return jsonError(data?.error?.message || `模型服务调用失败，状态码：${response.status}`, response.status);
    }

    const content = data?.choices?.[0]?.message?.content?.trim();
    if (!content) return jsonError("模型服务未返回结构识别内容，请稍后重试。", 502);

    const raw = extractJson(content);
    const structure = normalizeStructure(raw, body);
    const template = normalizeTemplate(raw, structure, body.fileName);
    return NextResponse.json<TemplateExtractResponse>({ ok: true, structure, template });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return jsonError("结构识别响应超时，请缩短旧文件内容后重试。", 504);
    }

    return jsonError(error instanceof Error ? error.message : "结构识别失败，请稍后重试。", 502);
  } finally {
    clearTimeout(timeout);
  }
}
