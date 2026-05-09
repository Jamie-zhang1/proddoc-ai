import { expect, test } from "@playwright/test";

async function expectPageNotBlank(page: import("@playwright/test").Page) {
  await expect(page.locator("body")).toBeVisible();
  const bodyText = await page.locator("body").innerText();
  expect(bodyText.trim().length).toBeGreaterThan(20);
}

test.describe("ProdDoc AI smoke test", () => {
  test("Dashboard is accessible and shows the primary entry", async ({ page }) => {
    await page.goto("/");

    await expectPageNotBlank(page);
    await expect(page.getByText("ProdDoc AI").first()).toBeVisible();
    await expect(page.getByRole("link", { name: /开始生成文档/ }).first()).toBeVisible();
  });

  test("Workspace is accessible and shows the demo module tree", async ({ page }) => {
    await page.goto("/workspace");

    await expectPageNotBlank(page);
    await expect(page.getByText(/工作台|快速开始/).first()).toBeVisible();
    await expect(page.getByText("项目与模块")).toBeVisible();
    await expect(page.getByText(/SaaS 客户管理系统 Demo|客户列表/).first()).toBeVisible();
  });

  test("Workspace folds long generated documents into a compact result card", async ({ page }) => {
    const longContent = `# 客户列表产品说明书\n\n${"客户列表用于集中查看和维护客户资料。".repeat(220)}TAIL_SHOULD_NOT_RENDER`;

    await page.addInitScript((content) => {
      localStorage.setItem(
        "proddoc-ai-workspace-draft",
        JSON.stringify({
          productName: "SaaS 客户管理系统 Demo",
          productType: "CRM 系统",
          targetUser: "产品经理",
          parentModule: "客户管理",
          moduleName: "客户列表",
          documentType: "产品说明书",
          detailLevel: "标准版",
          outputStyle: "专业正式",
          keywords: "",
          referenceWriting: "",
          specialRequirements: "",
          generationMode: "mock",
          prompt: "生成客户列表产品说明书",
          documentContent: content,
          initialDocumentContent: content,
          screenshots: [],
          referenceFiles: [],
        })
      );
    }, longContent);

    await page.goto("/workspace");

    await expect(page.getByText("正文较长，已折叠预览。")).toBeVisible();
    await expect(page.getByRole("button", { name: /打开全文编辑/ })).toBeVisible();
    await expect(page.getByText("TAIL_SHOULD_NOT_RENDER")).toHaveCount(0);
  });

  test("Templates is accessible and shows template cards", async ({ page }) => {
    await page.goto("/templates");

    await expectPageNotBlank(page);
    await expect(page.getByRole("heading", { name: "选择一种文档模板" })).toBeVisible();
    await expect(page.getByText("标准产品说明书模板")).toBeVisible();
  });

  test("History is accessible and shows records or empty state", async ({ page }) => {
    await page.goto("/history");

    await expectPageNotBlank(page);
    await expect(page.getByRole("heading", { name: "文档历史" })).toBeVisible();
    await expect(page.getByText(/暂无文档记录|文档标题|搜索文档标题/).first()).toBeVisible();
  });

  test("Settings is accessible and shows API configuration actions", async ({ page }) => {
    await page.goto("/settings");

    await expectPageNotBlank(page);
    await expect(page.getByRole("heading", { name: "设置" })).toBeVisible();
    await expect(page.getByText("API 环境配置")).toBeVisible();
    await expect(page.getByRole("button", { name: /检查环境配置/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /复制 .env.local 模板/ })).toBeVisible();
  });
});
