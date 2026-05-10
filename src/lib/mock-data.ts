import type {
  DemoProject,
  DetailLevel,
  DocumentType,
  OutputStyle,
  ProductType,
  TargetUser,
  TemplateItem,
  WorkspaceDraft,
} from "@/lib/types";

// Data loaded from external JSON files for easier maintenance
import demoProjectsData from "@/data/demo-projects.json";
import templatesData from "@/data/templates.json";

export const productTypes: ProductType[] = [
  "SaaS 系统",
  "后台管理系统",
  "CRM 系统",
  "ERP 系统",
  "HRM 系统",
  "BI 看板",
  "内容管理系统",
  "协作办公系统",
  "低代码平台",
  "数据分析平台",
  "其他",
];

export const targetUsers: TargetUser[] = [
  "产品经理",
  "产品运营",
  "售前顾问",
  "实施交付人员",
  "客户培训人员",
  "测试人员",
  "客户方管理员",
  "终端使用者",
];

export const documentTypes: DocumentType[] = [
  "产品说明书",
  "操作手册",
  "培训讲稿",
  "售前介绍",
  "功能补充说明",
];

export const detailLevels: DetailLevel[] = ["简洁版", "标准版", "详细版"];

export const outputStyles: OutputStyle[] = [
  "专业正式",
  "售前展示",
  "客户交付",
  "培训讲解",
  "简洁汇报",
];

export const demoProjects: DemoProject[] = demoProjectsData as DemoProject[];

export const templates: TemplateItem[] = templatesData as TemplateItem[];

export function getTemplateConfig(template: TemplateItem) {
  switch (template.id) {
    case "operation-guide":
      return { documentType: "操作手册" as const, outputStyle: "客户交付" as const };
    case "training-script":
      return { documentType: "培训讲稿" as const, outputStyle: "培训讲解" as const };
    case "presales-introduction":
      return { documentType: "售前介绍" as const, outputStyle: "售前展示" as const };
    case "feature-addendum":
      return { documentType: "功能补充说明" as const, outputStyle: "专业正式" as const };
    default:
      return { documentType: "产品说明书" as const, outputStyle: "专业正式" as const };
  }
}

export function getDemoModuleSample(projectId: string, parentModule: string, moduleName: string) {
  if (projectId === "saas-crm-demo") {
    return {
      keywords: `${moduleName}、客户资料、跟进记录、状态流转、权限范围、数据导出`,
      referenceWriting:
        "请围绕客户信息维护、业务推进、状态变化和记录追踪组织说明，保持产品说明书口径。",
      specialRequirements:
        "突出功能入口、关键字段、常见操作和权限边界，不编造客户案例或真实数据。",
    };
  }

  if (projectId === "content-ops-demo") {
    return {
      keywords: `${moduleName}、内容审核、分类管理、发布状态、操作记录、权限控制`,
      referenceWriting:
        "请按照后台管理页面写法描述列表筛选、新增编辑、审核发布和状态反馈。",
      specialRequirements:
        "说明内容应适用于通用内容运营后台，不绑定具体内容形态或业务平台。",
    };
  }

  if (projectId === "collaboration-demo") {
    return {
      keywords: `${moduleName}、任务协作、文档协作、成员权限、消息通知、版本记录`,
      referenceWriting:
        "请从团队协作视角描述入口、协作对象、成员操作、状态同步和记录追溯。",
      specialRequirements:
        "保持通用协作办公产品语境，避免出现具体组织、客户或行业流程。",
    };
  }

  if (projectId === "bi-dashboard-demo") {
    return {
      keywords: `${moduleName}、指标展示、趋势图表、维度筛选、对比分析、报表导出`,
      referenceWriting:
        "请围绕指标口径、图表查看、筛选联动、下钻分析和导出结果组织说明。",
      specialRequirements:
        "不得编造真实数据、具体指标数值或客户案例，重点说明通用分析能力。",
    };
  }

  return {
    keywords: `${parentModule}、${moduleName}、列表管理、详情查看、状态管理、操作记录`,
    referenceWriting: "请使用通用软件产品说明书结构描述功能定位、页面说明和操作流程。",
    specialRequirements: "保持通用软件产品语境，不引入具体客户、行业平台或真实案例。",
  };
}

export function getTemplateInstruction(template: TemplateItem) {
  return `当前启用「${template.name}」，建议输出结构包含：${template.structure.join("、")}。`;
}

export const defaultDraft: WorkspaceDraft = {
  productName: "",
  productType: "SaaS 系统",
  targetUser: "产品经理",
  parentModule: "",
  moduleName: "",
  modules: [],
  documentType: "产品说明书",
  detailLevel: "标准版",
  outputStyle: "专业正式",
  keywords: "",
  referenceWriting: "",
  specialRequirements: "",
  generationMode: "prompt",
  prompt: "",
  documentContent: "",
  screenshots: [],
  referenceFiles: [],
};

export function getModuleCount() {
  return demoProjects.reduce(
    (count, project) =>
      count + project.modules.reduce((sum, module) => sum + module.children.length, 0),
    0
  );
}
