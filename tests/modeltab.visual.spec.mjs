import { test, expect } from "@playwright/test";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
let server;
let baseUrl;
const seededAuditState = {
  activeConversationId: "chat-audit",
  activeProviderId: "local-audit",
  sidebarCollapsed: false,
  settingsCollapsed: false,
  providers: [{
    id: "local-audit",
    name: "LM Studio Local",
    type: "openai",
    baseUrl: "http://localhost:1234/v1",
    model: "local-model",
    extraHeaders: "",
    noAuth: true,
    presetId: "lm-studio"
  }],
  conversations: [{
    id: "chat-audit",
    title: "Explain this step by step for a technical but busy reader",
    context: "",
    folderId: "",
    archivedAt: "",
    createdAt: "2026-07-03T00:00:00.000Z",
    updatedAt: "2026-07-03T00:00:00.000Z",
    messages: Array.from({ length: 12 }, (_, index) => ({
      id: `msg-${index}`,
      role: index % 2 ? "assistant" : "user",
      content: index % 2
        ? "A compact answer with a deliberately long token C:/workspace/project/really/really/long/path/that/must/wrap plus practical next steps."
        : "Explain the current result and next action for a technical but busy reader.",
      attachments: [],
      error: false,
      createdAt: "2026-07-03T00:00:00.000Z"
    }))
  }]
};
const cleanerSampleJson = JSON.stringify({
  chunkedPrompt: {
    systemInstruction: {
      parts: [{ text: "Use concise answers." }]
    },
    chunks: [
      { role: "user", parts: [{ text: "Hello from AI Studio." }] },
      {
        role: "model",
        parts: [
          { thought: true, text: "Identify the greeting and answer directly." },
          { text: "Hello from ModelTab." }
        ]
      }
    ]
  }
});

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

async function blockExternalRequests(page) {
  const localOrigin = new URL(baseUrl).origin;
  await page.route("**/*", (route) => {
    const url = new URL(route.request().url());
    if ((url.protocol === "http:" || url.protocol === "https:") && url.origin !== localOrigin) {
      return route.abort();
    }
    return route.continue();
  });
}

for (const viewport of [
  { width: 320, height: 568 },
  { width: 360, height: 740 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1280, height: 800 },
  { width: 1920, height: 1080 },
  { width: 3840, height: 2160 },
  { width: 7680, height: 4320 }
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
          }),
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
    expect(audit.offscreenVisible).toEqual([]);
    expect(audit.workspace?.width).toBeGreaterThan(0);
    expect(audit.messageList?.height).toBeGreaterThan(120);
    expect(audit.composer?.height).toBeGreaterThan(70);
    expect(audit.promptVisible).toBe(true);
    expect(audit.undersizedButtons).toEqual([]);
    if (viewport.width < 980) expect(audit.sidebarHidden).toBe(true);
    if (viewport.width < 1600) expect(audit.settingsHidden).toBe(true);
  });
}

test("seeded long chat keeps a usable composer and chat-first viewport on short phones", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.addInitScript((state) => localStorage.setItem("modeltab-state-v1", JSON.stringify(state)), seededAuditState);
  await page.goto(baseUrl);
  await expect(page.locator(".workspace")).toBeVisible();

  const audit = await page.evaluate(() => {
    const rect = (selector) => {
      const box = document.querySelector(selector)?.getBoundingClientRect();
      return box ? { width: box.width, height: box.height } : null;
    };
    return {
      overflowX: Math.max(
        0,
        document.documentElement.scrollWidth - document.documentElement.clientWidth,
        document.body.scrollWidth - document.body.clientWidth
      ),
      prompt: rect("#promptInput"),
      messageList: rect("#messageList"),
      composer: rect(".composer-panel"),
      offscreenVisible: [...document.querySelectorAll("body *")]
        .filter((element) => {
          if (element.closest('.sidebar[aria-hidden="true"], .settings-panel[aria-hidden="true"]')) return false;
          const style = getComputedStyle(element);
          if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) return false;
          const box = element.getBoundingClientRect();
          return box.width > 0 && box.height > 0 && (box.left < -1 || box.right > window.innerWidth + 1);
        })
        .map((element) => element.id || element.tagName.toLowerCase())
    };
  });

  expect(audit.overflowX).toBe(0);
  expect(audit.offscreenVisible).toEqual([]);
  expect(audit.prompt?.width).toBeGreaterThanOrEqual(280);
  expect(audit.messageList?.height).toBeGreaterThanOrEqual(170);
  expect(audit.composer?.height).toBeLessThanOrEqual(150);
});

test("seeded desktop chat uses compact composer controls", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addInitScript((state) => localStorage.setItem("modeltab-state-v1", JSON.stringify(state)), seededAuditState);
  await page.goto(baseUrl);

  const audit = await page.evaluate(() => ({
    overflowX: Math.max(
      0,
      document.documentElement.scrollWidth - document.documentElement.clientWidth,
      document.body.scrollWidth - document.body.clientWidth
    ),
    composerHeight: document.querySelector(".composer-panel")?.getBoundingClientRect().height || 0,
    messageListHeight: document.querySelector("#messageList")?.getBoundingClientRect().height || 0
  }));

  expect(audit.overflowX).toBe(0);
  expect(audit.composerHeight).toBeLessThanOrEqual(170);
  expect(audit.messageListHeight).toBeGreaterThanOrEqual(480);
});

test("AI Studio Cleaner opens as an integrated ModelTab tool", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await blockExternalRequests(page);
  await page.goto(baseUrl);
  await page.getByRole("link", { name: "Open AI Studio Cleaner in ModelTab" }).click();
  await expect(page.locator(".modeltab-tool-bar")).toBeVisible();
  await expect(page.locator(".modeltab-tool-brand")).toContainText("ModelTab");
  await expect(page.getByRole("link", { name: /^Back to ModelTab$/ })).toBeVisible();

  const cleanerAudit = await page.evaluate(() => ({
    overflowX: Math.max(
      0,
      document.documentElement.scrollWidth - document.documentElement.clientWidth,
      document.body.scrollWidth - document.body.clientWidth
    ),
    toolbarWidth: document.querySelector(".modeltab-tool-bar")?.getBoundingClientRect().width || 0,
    bodyClass: document.body.className,
    title: document.title
  }));

  expect(cleanerAudit.overflowX).toBe(0);
  expect(cleanerAudit.toolbarWidth).toBeGreaterThan(300);
  expect(cleanerAudit.bodyClass).toContain("modeltab-tool-body");
  expect(cleanerAudit.title).toContain("ModelTab");

  await page.getByRole("link", { name: /^Back to ModelTab$/ }).click();
  await expect(page.locator(".workspace")).toBeVisible();
});

test("AI Studio Cleaner keeps a compact integrated shell on phones", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await blockExternalRequests(page);
  await page.goto(new URL("tools/ai-studio-cleaner/index.html", baseUrl).href, { waitUntil: "domcontentloaded" });
  await expect(page.locator(".modeltab-tool-bar")).toBeVisible();
  await expect(page.getByRole("link", { name: /^Back to ModelTab$/ })).toBeVisible();

  const audit = await page.evaluate(() => {
    const toolbar = document.querySelector(".modeltab-tool-bar")?.getBoundingClientRect();
    const back = [...document.querySelectorAll("a")]
      .find((link) => link.textContent?.trim() === "Back to ModelTab")
      ?.getBoundingClientRect();
    return {
      overflowX: Math.max(
        0,
        document.documentElement.scrollWidth - document.documentElement.clientWidth,
        document.body.scrollWidth - document.body.clientWidth
      ),
      toolbarHeight: toolbar?.height || 0,
      toolbarRight: toolbar?.right || 0,
      backRight: back?.right || 0
    };
  });

  expect(audit.overflowX).toBe(0);
  expect(audit.toolbarHeight).toBeLessThanOrEqual(64);
  expect(audit.toolbarRight).toBeLessThanOrEqual(391);
  expect(audit.backRight).toBeLessThanOrEqual(391);
});

test("AI Studio Cleaner processes exports without external network", async ({ page }) => {
  page.on("dialog", (dialog) => {
    throw new Error(`Unexpected JavaScript dialog: ${dialog.type()}`);
  });
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (text) => { window.__cleanerCopiedText = text; }
      }
    });
  });
  await page.setViewportSize({ width: 1280, height: 800 });
  await blockExternalRequests(page);
  await page.goto(new URL("tools/ai-studio-cleaner/index.html", baseUrl).href);

  await page.getByLabel("Upload AI Studio JSON export").setInputFiles({
    name: "sample-ai-studio.json",
    mimeType: "application/json",
    buffer: Buffer.from(cleanerSampleJson)
  });

  await expect(page.locator("#statusDetail")).toContainText("1 cleaned, 0 errors");
  await expect(page.locator("#markdownOutput")).toHaveValue(/# Source: sample-ai-studio\.json/);
  await expect(page.locator("#markdownOutput")).toHaveValue(/Use concise answers\./);
  await expect(page.locator("#markdownOutput")).toHaveValue(/Hello from AI Studio\./);
  await expect(page.locator("#markdownOutput")).toHaveValue(/Hello from ModelTab\./);
  await expect(page.locator("#markdownOutput")).not.toHaveValue(/Thinking Process/);

  await page.getByRole("switch", { name: "Toggle reasoning blocks" }).click();
  await expect(page.locator("#markdownOutput")).toHaveValue(/Thinking Process/);
  await expect(page.locator("#markdownOutput")).toHaveValue(/Identify the greeting/);

  await page.getByRole("button", { name: "Copy" }).click();
  await expect(page.locator("#toastRegion")).toContainText("Markdown copied.");
  await expect.poll(() => page.evaluate(() => window.__cleanerCopiedText || "")).toContain("Hello from ModelTab.");

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("sample-ai-studio.md");

  await page.getByRole("button", { name: "Clear All" }).click();
  await expect(page.locator("#markdownOutput")).toHaveValue("");
  await expect(page.locator("#emptyState")).toBeVisible();
  await expect(page.getByRole("button", { name: "Clear All" })).toBeDisabled();
});

test("downloaded AI Studio Cleaner launches and processes directly from file mode", async ({ page }) => {
  page.on("dialog", (dialog) => {
    throw new Error(`Unexpected JavaScript dialog: ${dialog.type()}`);
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(pathToFileURL(join(root, "tools", "ai-studio-cleaner", "index.html")).href);
  await expect(page.locator(".modeltab-tool-bar")).toBeVisible();
  await expect(page.getByRole("link", { name: /^Back to ModelTab$/ })).toBeVisible();

  await page.getByLabel("Upload AI Studio JSON export").setInputFiles({
    name: "local-ai-studio.json",
    mimeType: "application/json",
    buffer: Buffer.from(cleanerSampleJson)
  });

  await expect(page.locator("#statusDetail")).toContainText("1 cleaned, 0 errors");
  await expect(page.locator("#markdownOutput")).toHaveValue(/Hello from ModelTab\./);

  const audit = await page.evaluate(() => ({
    overflowX: Math.max(
      0,
      document.documentElement.scrollWidth - document.documentElement.clientWidth,
      document.body.scrollWidth - document.body.clientWidth
    )
  }));
  expect(audit.overflowX).toBe(0);
});

test("workspace settings drawer stays usable on short phones", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto(baseUrl);
  await page.getByRole("button", { name: "Settings" }).click();
  await expect(page.locator("#settingsPanel")).toHaveClass(/open/);
  await expect.poll(async () => page.evaluate(() => {
    const box = document.querySelector("#settingsPanel")?.getBoundingClientRect();
    return Boolean(box && box.left >= -1 && box.right <= window.innerWidth + 1);
  })).toBe(true);
  await page.locator("#workspaceSettingsDetails").evaluate((details) => {
    details.open = true;
    details.scrollIntoView({ block: "nearest" });
  });

  const audit = await page.evaluate(() => ({
    overflowX: Math.max(
      0,
      document.documentElement.scrollWidth - document.documentElement.clientWidth,
      document.body.scrollWidth - document.body.clientWidth
    ),
    traceWidth: document.querySelector("#workspaceTrace")?.getBoundingClientRect().width || 0,
    offscreenVisible: [...document.querySelectorAll("body *")]
      .filter((element) => {
        if (element.closest('.sidebar[aria-hidden="true"]')) return false;
        const style = getComputedStyle(element);
        if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) return false;
        const box = element.getBoundingClientRect();
        return box.width > 0 && box.height > 0 && (box.left < -1 || box.right > window.innerWidth + 1);
      })
      .map((element) => element.id || element.tagName.toLowerCase()),
    undersizedButtons: [...document.querySelectorAll("#settingsPanel button")]
      .filter((button) => {
        const box = button.getBoundingClientRect();
        const style = getComputedStyle(button);
        return style.display !== "none" && style.visibility !== "hidden" && box.width > 0 && box.height > 0 && box.height < 32;
      })
      .map((button) => button.id || button.textContent.trim())
  }));

  expect(audit.overflowX).toBe(0);
  expect(audit.offscreenVisible).toEqual([]);
  expect(audit.undersizedButtons).toEqual([]);
  expect(audit.traceWidth).toBeGreaterThan(200);
});

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

test("keyboard focus enters mobile overlays and returns to triggers", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(baseUrl);

  await page.locator("#sidebarToggle").focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".sidebar")).toHaveClass(/open/);
  await expect(page.locator("#newChatBtn")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.locator(".sidebar")).not.toHaveClass(/open/);
  await expect(page.locator("#sidebarToggle")).toBeFocused();

  await page.locator("#settingsBtn").focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#settingsPanel")).toHaveClass(/open/);
  await expect(page.locator("#settingsProviderSelect")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.locator("#settingsPanel")).not.toHaveClass(/open/);
  await expect(page.locator("#settingsBtn")).toBeFocused();
});

test("chat tree controls expose item-specific accessible names", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(baseUrl);
  await expect(page.getByLabel("Open chat New chat")).toBeVisible();
  await page.getByLabel("Chat controls for New chat").click();
  await expect(page.getByLabel("Move New chat")).toBeVisible();
});

test("first-run onboarding opens key field and offers no-key local setup", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(baseUrl);
  await expect(page.locator("#readinessDetail")).toContainText("API key missing");
  await expect(page.locator("#nextActions")).toContainText("Add Key");
  await expect(page.locator("#nextActions")).toContainText("Use Local");

  await page.locator("[data-next-action='key']").click();
  await expect(page.locator("#settingsPanel")).toHaveClass(/open/);
  await expect(page.locator("#providerAdvancedDetails")).toHaveJSProperty("open", true);
  await expect(page.locator("#providerKeyInput")).toBeVisible();
  await expect(page.locator("#providerKeyInput")).toBeFocused();

  await page.keyboard.press("Escape");
  await page.locator("[data-next-action='local']").click();
  await expect(page.locator("#settingsPanel")).toHaveClass(/open/);
  await expect(page.locator("#providerBaseInput")).toHaveValue("http://localhost:1234/v1");
  await expect(page.locator("#chatMeta")).toContainText("LM Studio Local");
  await expect(page.locator("#readinessTitle")).toContainText("Setup ready");
  await expect(page.locator("#readinessDetail")).not.toContainText("API key missing");
  await expect(page.locator("#nextActions")).toContainText("Fetch Models");
});

test("phone provider setup normalizes pasted endpoint without horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto(baseUrl);
  await page.getByRole("button", { name: "Settings" }).click();
  await page.locator("#providerBaseInput").fill("https://api.openai.com/v1/chat/completions?from=docs#example");
  await page.locator("#saveProviderBtn").scrollIntoViewIfNeeded();
  await page.locator("#saveProviderBtn").click();

  const audit = await page.evaluate(() => ({
    overflowX: Math.max(
      0,
      document.documentElement.scrollWidth - document.documentElement.clientWidth,
      document.body.scrollWidth - document.body.clientWidth
    ),
    settingsBox: (() => {
      const box = document.querySelector("#settingsPanel")?.getBoundingClientRect();
      return box ? { left: Math.round(box.left), right: Math.round(box.right), width: Math.round(box.width) } : null;
    })(),
    offscreenVisible: [...document.querySelectorAll("body *")]
      .filter((element) => {
        if (element.closest('.sidebar[aria-hidden="true"]')) return false;
        const style = getComputedStyle(element);
        if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) return false;
        const box = element.getBoundingClientRect();
        return box.width > 0 && box.height > 0 && (box.left < -1 || box.right > window.innerWidth + 1);
      })
      .map((element) => element.id || element.tagName.toLowerCase())
  }));

  await expect(page.locator("#providerBaseInput")).toHaveValue("https://api.openai.com/v1");
  await expect(page.locator("#providerStatus")).toContainText("Provider saved");
  expect(audit.overflowX).toBe(0);
  expect(audit.offscreenVisible).toEqual([]);
  expect(audit.settingsBox?.left).toBeGreaterThanOrEqual(0);
  expect(audit.settingsBox?.right).toBeLessThanOrEqual(320);
});

for (const viewport of [
  { width: 320, height: 568 },
  { width: 1920, height: 1080 }
]) {
  test(`explicit actions provide visible feedback at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.addInitScript((state) => {
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: {
          writeText: async (text) => { window.__modeltabCopiedText = text; }
        }
      });
      localStorage.setItem("modeltab-state-v1", JSON.stringify(state));
    }, seededAuditState);
    await page.goto(baseUrl);

    await page.locator("[data-copy-index]").first().click();
    await expect(page.locator("#toastRegion")).toContainText("Message copied.");
    await expect.poll(() => page.evaluate(() => window.__modeltabCopiedText || "")).toContain("Explain the current result");

    if (viewport.width < 980) await page.getByRole("button", { name: "Toggle conversations" }).click();
    await page.getByRole("button", { name: "New Chat" }).click();
    await expect(page.locator("#toastRegion")).toContainText("New chat ready.");

    await page.locator("#chatTitleInput").fill("Interaction feedback smoke");
    await page.locator("#promptInput").focus();
    await expect(page.locator("#toastRegion")).toContainText("Chat renamed: Interaction feedback smoke.");

    if (viewport.width < 820) {
      if (await page.locator("#settingsPanel").getAttribute("aria-hidden") === "true") {
        await page.getByRole("button", { name: "Settings" }).click();
      }
      await expect(page.locator("#settingsModelInput")).toBeVisible();
      await page.locator("#settingsModelInput").fill("feedback-model");
      await page.locator("#providerBaseInput").focus();
    } else {
      await page.locator("#modelInput").fill("feedback-model");
      await page.locator("#promptInput").focus();
    }
    await expect(page.locator("#toastRegion")).toContainText("Model set: feedback-model.");

    if (await page.locator("#settingsPanel").getAttribute("aria-hidden") === "true") {
      await page.getByRole("button", { name: "Settings" }).click();
    }
    await page.locator("#instructionsSettingsDetails").evaluate((details) => { details.open = true; });
    await page.locator("#memoryInput").fill("Remember concise interaction feedback.");
    await page.locator("#saveInstructionsBtn").click();
    await expect(page.locator("#toastRegion")).toContainText("Instructions and memory saved.");

    await page.locator("#generationSettingsDetails").evaluate((details) => { details.open = true; });
    await page.locator("#saveControlsBtn").click();
    await expect(page.locator("#toastRegion")).toContainText("Generation controls saved.");

    if (viewport.width < 1600) await page.keyboard.press("Escape");
    await page.locator("#imageInput").setInputFiles({
      name: "tiny.png",
      mimeType: "image/png",
      buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47])
    });
    await expect(page.locator("#toastRegion")).toContainText("1 image attached.");
    await page.getByLabel("Remove attachment").click();
    await expect(page.locator("#toastRegion")).toContainText("Attachment removed.");

    const audit = await page.evaluate(() => ({
      overflowX: Math.max(
        0,
        document.documentElement.scrollWidth - document.documentElement.clientWidth,
        document.body.scrollWidth - document.body.clientWidth
      )
    }));
    expect(audit.overflowX).toBe(0);
  });
}

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
