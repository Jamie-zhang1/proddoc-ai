export type ProductType =
  | "SaaS 系统"
  | "后台管理系统"
  | "CRM 系统"
  | "ERP 系统"
  | "HRM 系统"
  | "BI 看板"
  | "内容管理系统"
  | "协作办公系统"
  | "低代码平台"
  | "数据分析平台"
  | "其他";

export type TargetUser =
  | "产品经理"
  | "产品运营"
  | "售前顾问"
  | "实施交付人员"
  | "客户培训人员"
  | "测试人员"
  | "客户方管理员"
  | "终端使用者";

export type DocumentType =
  | "产品说明书"
  | "操作手册"
  | "培训讲稿"
  | "售前介绍"
  | "功能补充说明";

export type DetailLevel = "简洁版" | "标准版" | "详细版";

export type OutputStyle =
  | "专业正式"
  | "售前展示"
  | "客户交付"
  | "培训讲解"
  | "简洁汇报";

export type ModuleNode = {
  name: string;
  children: string[];
};

export type DemoProject = {
  id: string;
  name: string;
  productName: string;
  productType: ProductType;
  modules: ModuleNode[];
};

export type ScreenshotItem = {
  id: string;
  name: string;
  dataUrl: string;
};

export type WorkspaceDraft = {
  productName: string;
  productType: ProductType;
  targetUser: TargetUser;
  parentModule: string;
  moduleName: string;
  documentType: DocumentType;
  detailLevel: DetailLevel;
  outputStyle: OutputStyle;
  keywords: string;
  referenceWriting: string;
  specialRequirements: string;
  activeTemplateId?: string;
  activeTemplateName?: string;
  activeTemplateStructure?: string[];
  prompt: string;
  documentContent: string;
  screenshots: ScreenshotItem[];
};

export type HistoryRecord = {
  id: string;
  title: string;
  productName: string;
  productType: ProductType;
  targetUser: TargetUser;
  moduleName: string;
  parentModule: string;
  documentType: DocumentType;
  content: string;
  prompt: string;
  createdAt: string;
  status: "已保存";
};

export type TemplateItem = {
  id: string;
  name: string;
  scenario: string;
  structure: string[];
  audience: string[];
};

export type ActiveTemplate = TemplateItem & {
  documentType: DocumentType;
  outputStyle: OutputStyle;
};
