import type { CustomTemplate, WorkspaceDraft } from "@/lib/types";

const emptyText = "未填写";
const maxReferenceContextLength = 6000;

function compactText(text: string) {
  return text.replace(/\s+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

function keepHeadAndTail(text: string, limit = maxReferenceContextLength) {
  const normalized = compactText(text);
  if (normalized.length <= limit) return normalized;

  const headLength = Math.floor(limit * 0.65);
  const tailLength = limit - headLength;
  return `${normalized.slice(0, headLength)}

……以下内容较长，已保留开头结构与结尾信息，中间部分已截断……

${normalized.slice(-tailLength)}`;
}

export function buildReferenceContext(draft: WorkspaceDraft) {
  const parsedFiles = (draft.referenceFiles ?? []).filter(
    (file) => file.status === "parsed" && file.extractedText.trim()
  );

  if (!parsedFiles.length) return "";

  return keepHeadAndTail(
    parsedFiles
      .map(
        (file, index) => `参考材料 ${index + 1}：${file.name}
文件类型：${file.kind}
提取字数：${file.extractedText.length}
提取文本：
${file.extractedText}`
      )
      .join("\n\n---\n\n")
  );
}

function formatCustomTemplate(template?: CustomTemplate) {
  if (!template) return "";

  const outline = template.outline
    .map((item) => `- H${item.level}「${item.titlePattern}」：${item.description}`)
    .join("\n");
  const sections = template.sectionPatterns
    .map(
      (item) => `- ${item.name}
  用途：${item.purpose}
  写法：${item.writingPattern}
  必备元素：${item.requiredElements.join("、")}
  示例风格：${item.exampleStyle}`
    )
    .join("\n");
  const fieldRules = template.fieldRules
    .map((item) => `- ${item.field}：${item.rule}`)
    .join("\n");

  return `自定义模板约束：
模板名称：${template.name}
模板用途：${template.description}
文档类型：${template.documentType}

标题层级规则：
${outline || emptyText}

段落写作模式：
${sections || emptyText}

字段说明规则：
${fieldRules || emptyText}

语气规则：${template.toneRules.join("、") || emptyText}
必须遵守：${template.doRules.join("、") || emptyText}
禁止事项：${template.dontRules.join("、") || emptyText}
模板提示词说明：${template.promptInstruction || emptyText}

模板使用要求：
请优先按照所选模板的结构、标题层级、段落组织方式和表达规范生成新文档。
可以参考旧模板的写法，但不得复制旧文档中的真实数据、客户案例、公司信息或无关内容。`;
}

export function buildPrompt(draft: WorkspaceDraft) {
  const templateLine = draft.activeTemplateName
    ? `当前启用模板：${draft.activeTemplateName}
模板输出建议：${draft.activeTemplateStructure?.join("、") || emptyText}
`
    : "";
  const customTemplateLine = formatCustomTemplate(draft.customTemplate);
  const referenceContext = buildReferenceContext(draft);
  const referenceContextLine = referenceContext
    ? `上传材料与 OCR 识别文本：
${referenceContext}

参考材料使用要求：
请参考上传材料的写作风格、结构层次、功能描述方式和语气，但不要复制原文中的具体客户数据、真实案例或无关内容。
如果用户要求模仿某份说明书写法，请优先保留标题层级、功能入口描述、操作步骤描述、字段说明方式、使用价值表达、注意事项和权限边界表达。`
    : "";

  return `你是一名资深产品文档专家，擅长为 SaaS 系统、后台管理系统、CRM、ERP、HRM、BI 看板、内容管理系统、协作办公系统和低代码平台编写产品说明书、操作手册、培训材料和售前介绍文案。
请根据以下信息生成产品文档内容：

产品名称：${draft.productName || emptyText}
产品类型：${draft.productType || emptyText}
目标用户：${draft.targetUser || emptyText}
所属一级模块：${draft.parentModule || emptyText}
功能模块名称：${draft.moduleName || emptyText}
文档类型：${draft.documentType || emptyText}
输出详细程度：${draft.detailLevel || emptyText}
输出风格：${draft.outputStyle || emptyText}
${templateLine}${customTemplateLine}

功能关键词：${draft.keywords || emptyText}
参考写法：${draft.referenceWriting || emptyText}
特别要求：${draft.specialRequirements || emptyText}
${referenceContextLine}

输出质量要求：
1. 输出更像正式产品说明书，不要像聊天回答；
2. 每个功能模块尽量包含：功能入口、适用场景、核心能力、操作方式、关键字段、权限边界、使用价值、注意事项；
3. 内容应符合软件产品文档写作规范，语言专业、清晰、易懂；
4. 不要写成营销软文，不要堆砌“提升效率、赋能业务”等空泛套话；
5. 避免反复使用固定价值句式，对相似功能点进行合并归类；
6. 根据目标用户调整表达重点，保持标题层级和小标题结构清晰；
7. 如信息不足，可基于常见软件产品逻辑合理补全，但不得编造具体数据、客户名称、公司信息或真实案例；
8. 如果启用了自定义模板，应优先模仿模板的标题层级、字段说明方式、段落结构和语气规则；
9. 输出可直接粘贴到产品说明书、操作手册或培训材料中的正文。`;
}
