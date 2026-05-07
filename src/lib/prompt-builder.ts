import type { WorkspaceDraft } from "@/lib/types";

const emptyText = "未填写";

export function buildPrompt(draft: WorkspaceDraft) {
  const templateLine = draft.activeTemplateName
    ? `当前启用模板：${draft.activeTemplateName}
模板输出建议：${draft.activeTemplateStructure?.join("、") || emptyText}
`
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
${templateLine}功能关键词：${draft.keywords || emptyText}
参考写法：${draft.referenceWriting || emptyText}
特别要求：${draft.specialRequirements || emptyText}

输出要求：

1. 内容应符合软件产品文档写作规范；
2. 语言专业、清晰、易懂；
3. 不要写成营销软文；
4. 不要过度堆砌空泛价值表达；
5. 避免反复使用固定价值句式；
6. 对相似功能点进行合并归类；
7. 根据目标用户调整表达重点；
8. 保持小标题结构清晰；
9. 输出可直接粘贴到产品说明书、操作手册或培训材料中的正文；
10. 如信息不足，可基于常见软件产品逻辑合理补全，但不得编造具体数据、客户名称或真实案例。`;
}
