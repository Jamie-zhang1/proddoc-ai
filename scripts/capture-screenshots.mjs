import { access, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "@playwright/test";
import { startCustomDevServer } from "./dev-server.mjs";

const baseUrl = process.env.PRODDOC_SCREENSHOT_BASE_URL || "http://localhost:3000";
const screenshotDir = resolve(process.cwd(), "public", "screenshots");

const pages = [
  { path: "/", file: "dashboard.png", label: "Dashboard" },
  { path: "/workspace", file: "workspace.png", label: "Workspace" },
  { path: "/templates", file: "templates.png", label: "Templates" },
  { path: "/history", file: "history.png", label: "History" },
];

const browserCandidates = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
];

const historyRecord = {
  id: "portfolio-demo-record",
  title: "客户列表产品说明书",
  productName: "SaaS 客户管理系统 Demo",
  productType: "CRM 系统",
  targetUser: "产品经理",
  moduleName: "客户列表",
  parentModule: "客户管理",
  documentType: "产品说明书",
  content:
    "# 客户列表产品说明书\n\n## 功能概述\n客户列表用于集中查看、筛选和维护客户资料，支持用户围绕客户状态、负责人、跟进记录和更新时间进行管理。\n\n## 核心能力\n- 支持按状态、负责人、更新时间等条件筛选。\n- 支持进入客户详情查看基础资料和关联记录。\n- 支持导出当前筛选结果，用于后续整理和交付。\n\n## 注意事项\n- 导出前应确认字段范围。\n- 不同角色可见字段和操作按钮可能不同。",
  prompt:
    "请基于通用 CRM 系统中的客户列表模块，生成产品说明书正文，保持专业、清晰、可交付。",
  createdAt: new Date().toISOString(),
  status: "已保存",
};

const workspaceDraft = {
  productName: "SaaS 客户管理系统 Demo",
  productType: "CRM 系统",
  targetUser: "产品经理",
  parentModule: "客户管理",
  moduleName: "客户列表",
  documentType: "产品说明书",
  detailLevel: "标准版",
  outputStyle: "专业正式",
  keywords: "客户列表、客户资料、跟进记录、状态流转、权限范围、数据导出",
  referenceWriting:
    "请围绕客户信息维护、业务推进、状态变化和记录追踪组织说明，保持产品说明书口径。",
  specialRequirements:
    "突出功能入口、关键字段、常见操作和权限边界，不编造客户案例或真实数据。",
  prompt:
    "你是一名资深产品文档专家，请根据 SaaS 客户管理系统 Demo 的客户列表模块，生成产品说明书正文。内容应包含功能概述、功能入口、核心能力、操作流程、页面说明、字段说明、应用场景和注意事项。",
  documentContent: historyRecord.content,
  screenshots: [],
};

async function isServerReady() {
  try {
    const response = await fetch(baseUrl);
    return response.ok;
  } catch {
    return false;
  }
}

async function waitForServer(timeoutMs = 60000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    if (await isServerReady()) return;
    await new Promise((resolveWait) => setTimeout(resolveWait, 1000));
  }

  throw new Error(`Dev server was not ready within ${timeoutMs}ms: ${baseUrl}`);
}

async function prepareBrowserPage(browser) {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
  });

  await page.addInitScript(
    ({ record, draft }) => {
      localStorage.setItem("proddoc-ai-history", JSON.stringify([record]));
      localStorage.setItem("proddoc-ai-workspace-draft", JSON.stringify(draft));
      localStorage.setItem(
        "proddoc-ai-active-template",
        JSON.stringify({
          id: "standard-product-manual",
          name: "标准产品说明书模板",
          scenario: "正式产品说明书、产品手册、功能介绍文档。",
          structure: ["功能概述", "核心能力", "页面说明", "字段说明", "注意事项"],
          audience: ["产品经理", "实施交付人员", "客户方管理员"],
          documentType: "产品说明书",
          outputStyle: "专业正式",
        })
      );
    },
    { record: historyRecord, draft: workspaceDraft }
  );

  return page;
}

async function findSystemBrowser() {
  for (const candidate of browserCandidates) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      // Try the next known browser path.
    }
  }

  return null;
}

async function launchBrowser() {
  try {
    return await chromium.launch();
  } catch (error) {
    const systemBrowser = await findSystemBrowser();
    if (!systemBrowser) throw error;

    console.log(`Playwright bundled Chromium is unavailable, using ${systemBrowser}`);
    return chromium.launch({ executablePath: systemBrowser });
  }
}

async function closeWithTimeout(label, closeFn, timeoutMs = 5000) {
  try {
    await Promise.race([
      closeFn(),
      new Promise((resolveClose) => setTimeout(resolveClose, timeoutMs)),
    ]);
  } catch (error) {
    console.warn(`Failed to close ${label}:`, error);
  }
}

async function capture() {
  let devServer = null;

  if (!(await isServerReady())) {
    devServer = await startCustomDevServer({ port: 3000, hostname: "localhost" });
    await waitForServer();
  }

  await mkdir(screenshotDir, { recursive: true });

  const browser = await launchBrowser();

  try {
    for (const item of pages) {
      const page = await prepareBrowserPage(browser);
      await page.goto(`${baseUrl}${item.path}`, { waitUntil: "networkidle" });
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(1000);

      const bodyBox = await page.locator("body").boundingBox();
      if (!bodyBox || bodyBox.width < 100 || bodyBox.height < 100) {
        throw new Error(`${item.label} appears blank or too small`);
      }

      await page.screenshot({
        path: resolve(screenshotDir, item.file),
        fullPage: false,
      });
      await page.close();
      console.log(`Captured ${item.label}: public/screenshots/${item.file}`);
    }
  } finally {
    await closeWithTimeout("browser", () => browser.close());
    if (devServer) {
      await closeWithTimeout(
        "dev server",
        () => new Promise((resolveClose) => devServer.close(resolveClose))
      );
    }
  }
}

capture()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
