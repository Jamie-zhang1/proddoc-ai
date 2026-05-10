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

export type GenerationMode = "prompt" | "api" | "mock";

export type GeneratedBy = "prompt-assisted" | "api" | "mock";

export type GenerationPreferences = {
  generationMode: GenerationMode;
  documentType: DocumentType;
  detailLevel: DetailLevel;
  outputStyle: OutputStyle;
};

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

export type ReferenceFileStatus = "pending" | "parsing" | "parsed" | "failed";

export type ReferenceFileKind = "text" | "markdown" | "docx" | "pdf" | "image" | "unknown";

export type ReferenceFile = {
  id: string;
  name: string;
  kind: ReferenceFileKind;
  mimeType: string;
  size: number;
  status: ReferenceFileStatus;
  extractedText: string;
  error?: string;
};

export type RewriteMode = "full" | "selection" | "append" | "polish";

export type RewriteRequest = {
  documentText: string;
  selectedText?: string;
  instruction: string;
  mode: RewriteMode;
  referenceContext?: string;
};

export type RewriteResponse = {
  ok: boolean;
  result?: string;
  error?: string;
};

export type TemplateOutlineItem = {
  level: number;
  titlePattern: string;
  description: string;
};

export type TemplateSectionPattern = {
  name: string;
  purpose: string;
  writingPattern: string;
  requiredElements: string[];
  exampleStyle: string;
};

export type TemplateFieldRule = {
  field: string;
  rule: string;
};

export type OutlineNodeRole = "keep" | "ignore" | "merge" | "split" | "sample";

export type ExtractedOutlineNode = {
  id: string;
  level: number;
  title: string;
  estimatedChars: number;
  summary: string;
  children: ExtractedOutlineNode[];
  selected: boolean;
  role: OutlineNodeRole;
};

export type WritingPattern = {
  id: string;
  name: string;
  description: string;
  applicableSections: string[];
  structure: string[];
  styleRules: string[];
  exampleExcerpt: string;
  selected: boolean;
};

export type SectionSchema = {
  id: string;
  name: string;
  purpose: string;
  requiredParts: string[];
  optionalParts: string[];
  writingRules: string[];
  selected: boolean;
};

export type TableSchema = {
  id: string;
  name: string;
  columns: string[];
  purpose: string;
  reuseInNewDocument: boolean;
};

export type GenerationPlanSuggestion = {
  recommendedTotalChars: number;
  recommendedSections: Array<{
    title: string;
    targetChars: number;
    generationOrder: number;
  }>;
};

export type ExtractedDocumentStructure = {
  fileName: string;
  fileType: string;
  totalChars: number;
  detectedTitleCount: number;
  detectedSectionCount: number;
  detectedTableCount: number;
  detectedModuleCount: number;
  hasOperationSteps: boolean;
  hasPermissionBoundary: boolean;
  hasValueExpression: boolean;
  outline: ExtractedOutlineNode[];
  writingPatterns: WritingPattern[];
  sectionSchemas: SectionSchema[];
  tableSchemas: TableSchema[];
  generationPlanSuggestion: GenerationPlanSuggestion;
  templateInstruction: string;
};

export type CustomTemplate = {
  id: string;
  name: string;
  description: string;
  documentType: string;
  outline: TemplateOutlineItem[];
  sectionPatterns: TemplateSectionPattern[];
  fieldRules: TemplateFieldRule[];
  toneRules: string[];
  doRules: string[];
  dontRules: string[];
  promptInstruction: string;
  sourceFileName?: string;
  extractedStructure?: ExtractedDocumentStructure;
  createdAt: string;
  updatedAt: string;
};

export type TemplateExtractRequest = {
  sourceText: string;
  fileName: string;
  userRequirement?: string;
};

export type TemplateExtractResponse = {
  ok: boolean;
  structure?: ExtractedDocumentStructure;
  template?: CustomTemplate;
  error?: string;
};

export type LongDocumentChapterStatus = "pending" | "generating" | "done" | "failed" | "skipped";

export type LongDocumentChapter = {
  id: string;
  title: string;
  targetChars: number;
  order: number;
  status: LongDocumentChapterStatus;
  content: string;
  error?: string;
};

export type LongDocumentPlan = {
  id: string;
  title: string;
  totalTargetChars: number;
  paused: boolean;
  chapters: LongDocumentChapter[];
  updatedAt: string;
};

export type PartialRewriteOperation =
  | "supplement"
  | "rewrite"
  | "expand"
  | "align-style"
  | "add-fields";

export type PartialRewriteCandidate = {
  id: string;
  chapterId: string;
  chapterTitle: string;
  operation: PartialRewriteOperation;
  originalText: string;
  candidateText: string;
  status: "draft" | "applied" | "discarded";
  createdAt: string;
};

export type ActiveDocument = {
  draft: WorkspaceDraft;
  content: string;
  initialContent?: string;
  longPlan?: LongDocumentPlan;
  rewriteCandidates?: PartialRewriteCandidate[];
  updatedAt: string;
};

export type WorkspaceModuleItem = {
  parent: string;
  child: string;
};

export type WorkspaceDraft = {
  productName: string;
  productType: ProductType;
  targetUser: TargetUser;
  parentModule: string;
  moduleName: string;
  modules: WorkspaceModuleItem[];
  documentType: DocumentType;
  detailLevel: DetailLevel;
  outputStyle: OutputStyle;
  keywords: string;
  referenceWriting: string;
  specialRequirements: string;
  activeTemplateId?: string;
  activeTemplateName?: string;
  activeTemplateStructure?: string[];
  customTemplate?: CustomTemplate;
  generationMode: GenerationMode;
  prompt: string;
  documentContent: string;
  screenshots: ScreenshotItem[];
  referenceFiles: ReferenceFile[];
  initialDocumentContent?: string;
  extractedStructure?: ExtractedDocumentStructure;
  longDocumentPlan?: LongDocumentPlan;
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
  generationMode?: GenerationMode;
  generatedBy?: GeneratedBy;
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
  customTemplate?: CustomTemplate;
};

export type ApiGenerateRequest = {
  prompt: string;
  mode: "document";
  documentType: DocumentType;
  temperature?: number;
  stream?: boolean;
};

export type ApiGenerateResponse = {
  content?: string;
  error?: string;
};

/** SSE chunk sent during streaming */
export type ApiStreamChunk = {
  content?: string;
  done?: boolean;
  error?: string;
};

export type EnvStatusResponse = {
  hasApiKey: boolean;
  hasBaseUrl: boolean;
  hasModel: boolean;
  baseUrlHost?: string;
  model?: string;
  ready: boolean;
  error?: string;
};

export type TestAiResponse = {
  ok: boolean;
  message?: string;
  error?: string;
};

export type ModelParams = {
  temperature: number;
  maxTokens: number;
  topP: number;
};

export type ExportFormat = "正式文档" | "简洁报告" | "带页眉页脚";

export type ExportSettings = {
  defaultFormat: ExportFormat;
  filenamePattern: string;
  includeMetadata: boolean;
};

export type HistoryActivityType = "document" | "prompt" | "template-export" | "api-call";

export type HistoryActivity = {
  id: string;
  type: HistoryActivityType;
  title: string;
  description: string;
  productName?: string;
  moduleName?: string;
  content?: string;
  createdAt: string;
};
