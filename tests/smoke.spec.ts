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
    await expect(page.getByRole("link", { name: /进入工作台/ })).toBeVisible();
  });

  test("Workspace is accessible and shows the demo module tree", async ({ page }) => {
    await page.goto("/workspace");

    await expectPageNotBlank(page);
    await expect(page.getByText(/工作台|快速开始/).first()).toBeVisible();
    await expect(page.getByText("项目与模块")).toBeVisible();
    await expect(page.getByText(/SaaS 客户管理系统 Demo|客户列表/).first()).toBeVisible();
  });

  test("Templates is accessible and shows template cards", async ({ page }) => {
    await page.goto("/templates");

    await expectPageNotBlank(page);
    await expect(page.getByRole("heading", { name: "文档模板" })).toBeVisible();
    await expect(page.getByText("标准产品说明书模板")).toBeVisible();
  });

  test("History is accessible and shows records or empty state", async ({ page }) => {
    await page.goto("/history");

    await expectPageNotBlank(page);
    await expect(page.getByRole("heading", { name: "历史记录", exact: true })).toBeVisible();
    await expect(page.getByText(/暂无历史记录|文档标题|搜索文档标题/).first()).toBeVisible();
  });
});
