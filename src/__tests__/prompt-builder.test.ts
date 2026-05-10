import { describe, it, expect } from "vitest";
import { buildPrompt } from "@/lib/prompt-builder";
import type { WorkspaceDraft } from "@/lib/types";

const baseDraft: WorkspaceDraft = {
  productName: "测试产品",
  productType: "SaaS 系统",
  targetUser: "产品经理",
  parentModule: "用户管理",
  moduleName: "角色权限",
  modules: [],
  documentType: "产品说明书",
  detailLevel: "标准版",
  outputStyle: "专业正式",
  keywords: "权限, 角色",
  referenceWriting: "",
  specialRequirements: "",
  generationMode: "prompt",
  prompt: "",
  documentContent: "",
  screenshots: [],
  referenceFiles: [],
};

describe("buildPrompt", () => {
  it("should generate a prompt with all base fields", () => {
    const prompt = buildPrompt(baseDraft);
    expect(prompt).toContain("测试产品");
    expect(prompt).toContain("SaaS 系统");
    expect(prompt).toContain("产品经理");
    expect(prompt).toContain("用户管理");
    expect(prompt).toContain("角色权限");
    expect(prompt).toContain("产品说明书");
    expect(prompt).toContain("标准版");
    expect(prompt).toContain("专业正式");
  });

  it("should include keywords", () => {
    const prompt = buildPrompt(baseDraft);
    expect(prompt).toContain("权限, 角色");
  });

  it("should handle empty fields gracefully", () => {
    const emptyDraft: WorkspaceDraft = {
      ...baseDraft,
      productName: "",
      productType: "" as WorkspaceDraft["productType"],
      targetUser: "" as WorkspaceDraft["targetUser"],
      parentModule: "",
      moduleName: "",
      keywords: "",
      specialRequirements: "",
    };
    const prompt = buildPrompt(emptyDraft);
    expect(prompt).toContain("未填写");
  });

  it("should include special requirements when provided", () => {
    const draft: WorkspaceDraft = {
      ...baseDraft,
      specialRequirements: "需要包含 API 接口说明",
    };
    const prompt = buildPrompt(draft);
    expect(prompt).toContain("需要包含 API 接口说明");
  });

  it("should include template name when active", () => {
    const draft: WorkspaceDraft = {
      ...baseDraft,
      activeTemplateName: "我的模板",
      activeTemplateStructure: ["概述", "功能", "操作"],
    };
    const prompt = buildPrompt(draft);
    expect(prompt).toContain("我的模板");
    expect(prompt).toContain("概述、功能、操作");
  });

  it("should handle special characters in input", () => {
    const draft: WorkspaceDraft = {
      ...baseDraft,
      productName: "产品<script>alert(1)</script>",
      specialRequirements: "使用\"引号\"和'单引号'",
    };
    const prompt = buildPrompt(draft);
    expect(prompt).toContain("产品<script>alert(1)</script>");
    expect(prompt).toContain("使用\"引号\"和'单引号'");
  });

  it("should include reference files content", () => {
    const draft: WorkspaceDraft = {
      ...baseDraft,
      referenceFiles: [
        {
          id: "1",
          name: "ref.md",
          kind: "markdown",
          mimeType: "text/markdown",
          size: 100,
          status: "parsed",
          extractedText: "这是参考文档内容",
        },
      ],
    };
    const prompt = buildPrompt(draft);
    expect(prompt).toContain("这是参考文档内容");
  });

  it("should include OCR text from screenshots as reference context", () => {
    const draft: WorkspaceDraft = {
      ...baseDraft,
      referenceFiles: [
        {
          id: "1",
          name: "screenshot.png",
          kind: "image",
          mimeType: "image/png",
          size: 5000,
          status: "parsed",
          extractedText: "OCR识别结果",
        },
      ],
    };
    const prompt = buildPrompt(draft);
    expect(prompt).toContain("OCR识别结果");
  });
});
