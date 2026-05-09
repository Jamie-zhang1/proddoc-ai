import { chromium } from "@playwright/test";
import { startCustomDevServer } from "../scripts/dev-server.mjs";
const baseUrl = "http://localhost:3000";
async function ready(){ try { return (await fetch(baseUrl)).ok; } catch { return false; } }
let server=null; if(!(await ready())) server=await startCustomDevServer({port:3000,hostname:"localhost"});
const browser=await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe" });
const page=await browser.newPage({ viewport: { width: 1440, height: 1000 } });
page.on('console', msg => console.log('CONSOLE', msg.type(), msg.text()));
page.on('pageerror', err => console.log('PAGEERROR', err.message));
await page.addInitScript(() => localStorage.setItem('theme','dark'));
await page.goto(baseUrl, { waitUntil: 'networkidle' });
await page.waitForTimeout(3000);
await browser.close();
if(server) await new Promise(r=>server.close(r));
