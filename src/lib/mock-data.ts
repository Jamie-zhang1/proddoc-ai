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

export const demoProjects: DemoProject[] = [
  {
    id: "saas-crm-demo",
    name: "SaaS 客户管理系统 Demo",
    productName: "SaaS 客户管理系统 Demo",
    productType: "CRM 系统",
    modules: [
      { name: "首页概览", children: ["核心指标", "待办事项", "快捷入口"] },
      { name: "客户管理", children: ["客户列表", "客户档案", "客户分层", "跟进记录"] },
      { name: "商机管理", children: ["商机列表", "商机阶段", "成交预测", "商机复盘"] },
      { name: "合同管理", children: ["合同列表", "合同审批", "回款记录", "发票管理"] },
      { name: "系统设置", children: ["角色权限", "字段配置", "操作日志"] },
    ],
  },
  {
    id: "content-ops-demo",
    name: "内容运营后台 Demo",
    productName: "内容运营后台 Demo",
    productType: "内容管理系统",
    modules: [
      { name: "内容管理", children: ["内容列表", "内容编辑", "内容审核", "分类管理"] },
      { name: "用户管理", children: ["用户列表", "用户画像", "用户分群", "权限配置"] },
      { name: "运营配置", children: ["活动配置", "推荐位配置", "消息推送", "弹窗配置"] },
      { name: "数据统计", children: ["访问数据", "转化数据", "留存数据", "内容效果"] },
      { name: "系统管理", children: ["账号管理", "操作日志", "参数配置"] },
    ],
  },
  {
    id: "collaboration-demo",
    name: "企业协作平台 Demo",
    productName: "企业协作平台 Demo",
    productType: "协作办公系统",
    modules: [
      { name: "工作台", children: ["我的待办", "最近访问", "快捷应用"] },
      { name: "项目管理", children: ["项目列表", "任务看板", "进度跟踪", "项目成员"] },
      { name: "文档协作", children: ["文档列表", "权限管理", "版本记录", "评论协作"] },
      { name: "通知中心", children: ["消息列表", "通知规则", "已读状态"] },
      { name: "组织管理", children: ["部门管理", "成员管理", "角色权限"] },
    ],
  },
  {
    id: "bi-dashboard-demo",
    name: "BI 数据看板 Demo",
    productName: "BI 数据看板 Demo",
    productType: "BI 看板",
    modules: [
      { name: "数据总览", children: ["核心指标", "趋势图表", "异常提醒"] },
      { name: "报表管理", children: ["报表列表", "报表配置", "报表订阅", "报表导出"] },
      { name: "指标分析", children: ["指标库", "维度筛选", "对比分析", "下钻分析"] },
      { name: "数据源管理", children: ["数据连接", "字段映射", "更新记录"] },
      { name: "权限管理", children: ["看板权限", "数据权限", "访问日志"] },
    ],
  },
];

export const templates: TemplateItem[] = [
  {
    id: "standard-product-manual",
    name: "标准产品说明书模板",
    scenario: "正式产品说明书、产品手册、功能介绍文档。",
    structure: ["功能概述", "核心能力", "页面说明", "字段说明", "注意事项"],
    audience: ["产品经理", "实施交付人员", "客户方管理员"],
  },
  {
    id: "feature-addendum",
    name: "新增功能补充模板",
    scenario: "新功能上线、版本迭代、已有说明书补充。",
    structure: ["更新背景", "功能说明", "影响范围", "操作说明", "配置建议"],
    audience: ["产品运营", "测试人员", "客户培训人员"],
  },
  {
    id: "similar-module-rewrite",
    name: "同类模块改写模板",
    scenario: "根据已有模块风格生成同类功能说明。",
    structure: ["参考风格", "模块差异", "功能描述", "流程说明", "输出口径"],
    audience: ["产品经理", "产品运营", "售前顾问"],
  },
  {
    id: "operation-guide",
    name: "操作手册模板",
    scenario: "客户交付、系统培训、实施操作指导。",
    structure: ["使用前准备", "操作入口", "操作步骤", "结果说明", "常见提醒"],
    audience: ["实施交付人员", "客户培训人员", "终端使用者"],
  },
  {
    id: "training-script",
    name: "培训讲稿模板",
    scenario: "录屏讲解、客户培训、内部培训、售前演示。",
    structure: ["开场说明", "场景引入", "功能讲解", "演示流程", "总结提示"],
    audience: ["客户培训人员", "售前顾问", "产品运营"],
  },
  {
    id: "presales-introduction",
    name: "售前介绍模板",
    scenario: "方案汇报、客户演示、产品能力介绍。",
    structure: ["能力定位", "适用场景", "关键能力", "演示建议", "交付边界"],
    audience: ["售前顾问", "产品经理", "实施交付人员"],
  },
];

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
  productName: demoProjects[0].productName,
  productType: demoProjects[0].productType,
  targetUser: "产品经理",
  parentModule: "客户管理",
  moduleName: "客户列表",
  documentType: "产品说明书",
  detailLevel: "标准版",
  outputStyle: "专业正式",
  keywords: "列表筛选、批量操作、详情查看、状态标识、导出数据",
  referenceWriting: "请使用清晰的小标题描述模块定位、关键能力、操作入口和注意事项。",
  specialRequirements: "避免编造具体客户案例和真实业务数据，保持通用软件产品语境。",
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
