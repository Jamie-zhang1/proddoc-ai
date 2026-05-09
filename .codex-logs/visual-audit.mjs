import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "@playwright/test";
import { startCustomDevServer } from "../scripts/dev-server.mjs";

const baseUrl = "http://localhost:3000";
const outDir = resolve(process.cwd(), ".codex-logs", "visual-audit");
const pages = ["/", "/workspace", "/templates", "/history", "/settings"];
const widths = [375, 768, 1024, 1440];
const browserCandidates = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
];
async function ready(){ try { return (await fetch(baseUrl)).ok; } catch { return false; } }
async function waitReady(){ for(let i=0;i<60;i++){ if(await ready()) return; await new Promise(r=>setTimeout(r,1000)); } throw new Error("server not ready"); }
async function launch(){ try { return await chromium.launch(); } catch { for (const executablePath of browserCandidates) { try { return await chromium.launch({ executablePath }); } catch {} } throw new Error("No browser"); } }
let server = null;
if(!(await ready())) { server = await startCustomDevServer({ port: 3000, hostname: "localhost" }); await waitReady(); }
await mkdir(outDir, { recursive: true });
const browser = await launch();
const results = [];
for (const theme of ["light", "dark"]) {
  for (const width of widths) {
    for (const path of pages) {
      const page = await browser.newPage({ viewport: { width, height: width === 375 ? 900 : 1000 }, deviceScaleFactor: 1 });
      await page.addInitScript((theme) => localStorage.setItem("theme", theme), theme);
      await page.goto(`${baseUrl}${path}`, { waitUntil: "networkidle" });
      await page.waitForTimeout(700);
      const metrics = await page.evaluate(() => {
        const nav = document.querySelector("header")?.getBoundingClientRect();
        return {
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
          bodyHeight: document.body.getBoundingClientRect().height,
          navBottom: nav?.bottom ?? 0,
          firstTop: document.querySelector("main")?.getBoundingClientRect().top ?? 0,
          text: document.body.innerText.slice(0, 120),
        };
      });
      results.push({ theme, width, path, overflow: metrics.scrollWidth > metrics.clientWidth + 2, ...metrics });
      if ((theme === "dark" && width === 1440) || (theme === "light" && width === 375) || (theme === "light" && width === 1440)) {
        const name = `${theme}-${width}-${path === "/" ? "dashboard" : path.slice(1)}.png`;
        await page.screenshot({ path: resolve(outDir, name), fullPage: false });
      }
      await page.close();
    }
  }
}
await browser.close();
if(server) await new Promise((resolveClose) => server.close(resolveClose));
console.table(results.map(({theme,width,path,overflow,scrollWidth,clientWidth,bodyHeight}) => ({theme,width,path,overflow,scrollWidth,clientWidth,bodyHeight: Math.round(bodyHeight)})));
const bad = results.filter((item) => item.overflow || item.bodyHeight < 300);
if (bad.length) {
  console.error("VISUAL_AUDIT_ISSUES", JSON.stringify(bad, null, 2));
  process.exitCode = 2;
}

