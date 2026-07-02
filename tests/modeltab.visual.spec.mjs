import { test, expect } from "@playwright/test";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
let server;
let baseUrl;

const mime = new Map([
  [".css", "text/css"],
  [".html", "text/html"],
  [".js", "text/javascript"],
  [".json", "application/json"],
  [".svg", "image/svg+xml"],
  [".webmanifest", "application/manifest+json"]
]);

test.beforeAll(async () => {
  server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url || "/", "http://127.0.0.1");
      const rawPath = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
      const filePath = normalize(join(root, rawPath));
      if (!filePath.startsWith(normalize(root))) {
        response.writeHead(403).end("Forbidden");
        return;
      }
      const body = await readFile(filePath);
      response.writeHead(200, { "content-type": mime.get(extname(filePath)) || "application/octet-stream" });
      response.end(body);
    } catch {
      response.writeHead(404).end("Not found");
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}/`;
});

test.afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
});

for (const viewport of [
  { width: 360, height: 740 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1280, height: 800 },
  { width: 1920, height: 1080 },
  { width: 3840, height: 2160 }
]) {
  test(`responsive shell has no horizontal scroll at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    page.on("dialog", (dialog) => {
      throw new Error(`Unexpected JavaScript dialog: ${dialog.type()}`);
    });
    await page.setViewportSize(viewport);
    await page.goto(baseUrl);
    await expect(page.locator(".workspace")).toBeVisible();
    await expect(page.locator("#promptInput")).toBeVisible();

    const audit = await page.evaluate(() => {
      const rect = (selector) => {
        const element = document.querySelector(selector);
        const box = element?.getBoundingClientRect();
        return box ? { width: box.width, height: box.height, x: box.x } : null;
      };
      return {
        overflowX: Math.max(
          0,
          document.documentElement.scrollWidth - document.documentElement.clientWidth,
          document.body.scrollWidth - document.body.clientWidth
        ),
        workspace: rect(".workspace"),
        composer: rect(".composer-panel"),
        messageList: rect("#messageList"),
        sidebarHidden: document.querySelector(".sidebar")?.getAttribute("aria-hidden") === "true",
        settingsHidden: document.querySelector(".settings-panel")?.getAttribute("aria-hidden") === "true",
        promptVisible: getComputedStyle(document.querySelector("#promptInput")).display !== "none",
        undersizedButtons: [...document.querySelectorAll("button")]
          .filter((button) => {
            const box = button.getBoundingClientRect();
            const style = getComputedStyle(button);
            return style.display !== "none" && style.visibility !== "hidden" && box.width > 0 && box.height > 0 && box.height < 32;
          })
          .map((button) => button.id || button.textContent.trim() || button.getAttribute("aria-label"))
      };
    });

    expect(audit.overflowX).toBe(0);
    expect(audit.workspace?.width).toBeGreaterThan(0);
    expect(audit.messageList?.height).toBeGreaterThan(120);
    expect(audit.composer?.height).toBeGreaterThan(70);
    expect(audit.promptVisible).toBe(true);
    expect(audit.undersizedButtons).toEqual([]);
    if (viewport.width < 980) expect(audit.sidebarHidden).toBe(true);
    if (viewport.width < 1600) expect(audit.settingsHidden).toBe(true);
  });
}

test("mobile drawer and prompt-library affordances are reachable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(baseUrl);
  await page.getByRole("button", { name: "Toggle conversations" }).click();
  await expect(page.locator(".sidebar")).toHaveClass(/open/);
  await page.keyboard.press("Escape");
  await expect(page.locator(".sidebar")).not.toHaveClass(/open/);

  await page.getByRole("button", { name: "Settings" }).click();
  await expect(page.locator("#settingsPanel")).toHaveClass(/open/);
  await page.keyboard.press("Escape");
  await expect(page.locator("#settingsPanel")).not.toHaveClass(/open/);

  await page.getByRole("button", { name: "Prompt library" }).click();
  await expect(page.locator("#settingsPanel")).toHaveClass(/open/);
  await expect(page.locator("#promptLibrarySettingsDetails")).toHaveJSProperty("open", true);
  await expect(page.locator("#promptSearchInput")).toBeFocused();
});

test("downloaded index.html launches directly from file mode", async ({ page }) => {
  page.on("dialog", (dialog) => {
    throw new Error(`Unexpected JavaScript dialog: ${dialog.type()}`);
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(pathToFileURL(join(root, "index.html")).href);
  await expect(page.locator(".workspace")).toBeVisible();
  await expect(page.locator("#promptInput")).toBeVisible();
  await expect(page.locator("#runtimeNotice")).toContainText("Local file mode");

  const audit = await page.evaluate(() => ({
    overflowX: Math.max(
      0,
      document.documentElement.scrollWidth - document.documentElement.clientWidth,
      document.body.scrollWidth - document.body.clientWidth
    ),
    hasManifestLink: Boolean(document.querySelector('link[rel="manifest"]')),
    serviceWorkerControlled: Boolean(navigator.serviceWorker?.controller)
  }));
  expect(audit.overflowX).toBe(0);
  expect(audit.hasManifestLink).toBe(false);
  expect(audit.serviceWorkerControlled).toBe(false);
});
