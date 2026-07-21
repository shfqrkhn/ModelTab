import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";

const liveUrl = process.env.MODELTAB_LIVE_URL || "https://shfqrkhn.github.io/ModelTab/";
const requireCurrentDeployment = process.env.MODELTAB_REQUIRE_CURRENT_DEPLOYMENT === "true";
const localServiceWorker = readFileSync(new URL("../service-worker.js", import.meta.url), "utf8");
const expectedCacheName = localServiceWorker.match(/const CACHE_NAME = "([^"]+)";/)?.[1];

if (!expectedCacheName) {
  throw new Error("Unable to read the local ModelTab service-worker cache name.");
}

for (const viewport of [
  { width: 390, height: 844 },
  { width: 1440, height: 900 }
]) {
  test(`live GitHub Pages app is usable at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    const consoleIssues = [];
    page.on("console", (message) => {
      if (["warning", "error"].includes(message.type())) consoleIssues.push(`${message.type()}: ${message.text()}`);
    });
    page.on("pageerror", (error) => consoleIssues.push(`pageerror: ${error.message}`));
    page.on("dialog", (dialog) => {
      throw new Error(`Unexpected JavaScript dialog: ${dialog.type()}`);
    });

    await page.setViewportSize(viewport);
    await page.goto(liveUrl, { waitUntil: "domcontentloaded" });
    await expect(page.locator(".workspace")).toBeVisible();
    await expect(page.locator("#promptInput")).toBeVisible();
    await expect(page.locator("#runtimeNotice")).toContainText("ModelTab direct mode");

    const audit = await page.evaluate(() => ({
      overflowX: Math.max(
        0,
        document.documentElement.scrollWidth - document.documentElement.clientWidth,
        document.body.scrollWidth - document.body.clientWidth
      ),
      offscreenVisible: [...document.querySelectorAll("body *")]
        .filter((element) => {
          if (element.closest('.sidebar[aria-hidden="true"], .settings-panel[aria-hidden="true"]')) return false;
          const style = getComputedStyle(element);
          if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) return false;
          const box = element.getBoundingClientRect();
          return box.width > 0 && box.height > 0 && (box.left < -1 || box.right > window.innerWidth + 1);
        })
        .map((element) => {
          const box = element.getBoundingClientRect();
          return {
            tag: element.tagName.toLowerCase(),
            id: element.id,
            className: String(element.className || "").slice(0, 80),
            text: (element.textContent || "").trim().slice(0, 80),
            left: Math.round(box.left),
            right: Math.round(box.right)
          };
        })
    }));

    expect(audit.overflowX).toBe(0);
    expect(audit.offscreenVisible).toEqual([]);
    expect(consoleIssues).toEqual([]);
  });
}

test("live GitHub Pages PWA metadata and preview assets are deployed", async ({ request }) => {
  const manifestResponse = await request.get(new URL("manifest.webmanifest", liveUrl).href);
  expect(manifestResponse.status()).toBe(200);
  const manifest = await manifestResponse.json();

  expect(manifest.id).toBe("./");
  expect(manifest.start_url).toBe("./");
  expect(manifest.scope).toBe("./");
  expect(manifest.categories).toEqual(expect.arrayContaining(["productivity", "utilities", "developer"]));
  expect(manifest.icons.map((icon) => icon.src)).toEqual(expect.arrayContaining(["./icons/icon.svg", "./icons/icon-192.png", "./icons/icon-512.png"]));
  expect(manifest.screenshots.map((screenshot) => screenshot.src)).toContain("./screenshot.png");

  for (const ref of [
    "./icons/icon.svg",
    "./icons/icon-192.png",
    "./icons/icon-512.png",
    "./icons/apple-touch-icon.png",
    "./screenshot.png"
  ]) {
    const response = await request.get(new URL(ref, liveUrl).href);
    expect(response.status()).toBe(200);
    expect((await response.body()).length).toBeGreaterThan(500);
  }

  const htmlResponse = await request.get(liveUrl);
  expect(htmlResponse.status()).toBe(200);
  const html = await htmlResponse.text();
  expect(html).toContain('rel="apple-touch-icon"');
  expect(html).toContain('name="application-name"');

  const serviceWorkerUrl = new URL("service-worker.js", liveUrl).href;
  if (requireCurrentDeployment) {
    await expect
      .poll(
        async () => {
          const response = await request.get(`${serviceWorkerUrl}?deployment-check=${Date.now()}`, {
            headers: { "cache-control": "no-cache" }
          });
          return response.status() === 200 ? response.text() : "";
        },
        {
          message: `Waiting for live Pages to deploy ${expectedCacheName}`,
          timeout: 180_000,
          intervals: [2_000, 5_000, 10_000]
        }
      )
      .toContain(`const CACHE_NAME = "${expectedCacheName}";`);
  }

  const serviceWorkerResponse = await request.get(serviceWorkerUrl, {
    headers: { "cache-control": "no-cache" }
  });
  expect(serviceWorkerResponse.status()).toBe(200);
  const serviceWorker = await serviceWorkerResponse.text();
  expect(serviceWorker).toMatch(/const CACHE_NAME = "modeltab-shell-v\d+";/);
  expect(serviceWorker).toContain("./tools/ai-studio-cleaner/index.html");
  expect(serviceWorker).toContain("./icons/icon-512.png");
  expect(serviceWorker).toContain("./screenshot.png");
});
