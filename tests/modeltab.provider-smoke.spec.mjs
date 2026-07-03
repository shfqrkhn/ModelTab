import { test, expect } from "@playwright/test";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
let staticServer;
let providerServer;
let appUrl;
let providerUrl;
let providerOrigin;
const providerRequests = [];

const mime = new Map([
  [".css", "text/css"],
  [".html", "text/html"],
  [".js", "text/javascript"],
  [".json", "application/json"],
  [".svg", "image/svg+xml"],
  [".webmanifest", "application/manifest+json"]
]);

test.beforeAll(async () => {
  staticServer = createServer(async (request, response) => {
    try {
      const url = new URL(request.url || "/", "http://127.0.0.1");
      const rawPath = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
      const filePath = normalize(join(root, rawPath));
      if (!filePath.startsWith(normalize(root))) return response.writeHead(403).end("Forbidden");
      response.writeHead(200, { "content-type": mime.get(extname(filePath)) || "application/octet-stream" });
      response.end(await readFile(filePath));
    } catch {
      response.writeHead(404).end("Not found");
    }
  });
  await new Promise((resolve) => staticServer.listen(0, "127.0.0.1", resolve));
  appUrl = `http://127.0.0.1:${staticServer.address().port}/`;

  providerServer = createServer(async (request, response) => {
    response.setHeader("access-control-allow-origin", "*");
    response.setHeader("access-control-allow-headers", "authorization,content-type,x-goog-api-key");
    response.setHeader("access-control-allow-methods", "GET,POST,OPTIONS");
    if (request.method === "OPTIONS") return response.writeHead(204).end();
    if (request.url === "/v1/models") {
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify({ data: [{ id: "smoke-model" }] }));
      return;
    }
    if (request.url === "/v1/chat/completions" && request.method === "POST") {
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify({ choices: [{ message: { content: "smoke-ok" } }] }));
      return;
    }
    if (request.url === "/gemini/models/gemini-smoke:generateContent" && request.method === "POST") {
      const body = await requestBody(request);
      providerRequests.push({ kind: "gemini", headers: request.headers, body: JSON.parse(body) });
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify({ candidates: [{ content: { parts: [{ text: "gemini-ok" }] } }] }));
      return;
    }
    if (request.url === "/stream/v1/chat/completions" && request.method === "POST") {
      response.writeHead(200, { "content-type": "text/event-stream" });
      response.write('data: {"choices":[{"delta":{"content":"partial"}}]}\n\n');
      setTimeout(() => response.end("data: [DONE]\n\n"), 5000);
      return;
    }
    response.writeHead(404).end("Not found");
  });
  await new Promise((resolve) => providerServer.listen(0, "127.0.0.1", resolve));
  providerOrigin = `http://127.0.0.1:${providerServer.address().port}`;
  providerUrl = `${providerOrigin}/v1`;
});

test.afterAll(async () => {
  await Promise.all([
    new Promise((resolve) => staticServer.close(resolve)),
    new Promise((resolve) => providerServer.close(resolve))
  ]);
});

function requestBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.setEncoding("utf8");
    request.on("data", (chunk) => { body += chunk; });
    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

test("local OpenAI-compatible provider can fetch models and complete a chat", async ({ page }) => {
  page.on("dialog", (dialog) => {
    throw new Error(`Unexpected JavaScript dialog: ${dialog.type()}`);
  });
  await page.addInitScript(({ providerUrl }) => {
    localStorage.setItem("modeltab-state-v1", JSON.stringify({
      activeProviderId: "smoke-provider",
      providers: [{
        id: "smoke-provider",
        name: "Smoke Local Provider",
        type: "openai",
        baseUrl: providerUrl,
        model: "smoke-model",
        extraHeaders: "",
        noAuth: true,
        presetId: "local-network-openai"
      }],
      settings: {
        stream: false,
        autoTrim: true,
        recentTurns: 3,
        maxInputTokens: 6000,
        maxTokens: 256,
        temperature: 0.2,
        topP: 1
      },
      conversations: [{
        id: "chat-smoke",
        title: "Provider smoke",
        context: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: []
      }],
      activeConversationId: "chat-smoke"
    }));
  }, { providerUrl });
  await page.goto(appUrl);
  await page.getByRole("button", { name: "Settings" }).click();
  await page.locator("#fetchModelsBtn").click();
  await expect(page.locator("#providerStatus")).toContainText("Loaded 1 models");
  await page.keyboard.press("Escape");
  await page.getByPlaceholder("Ask anything. Shift+Enter for a new line.").fill("hello");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.locator(".message.assistant .markdown")).toContainText("smoke-ok");
});

test("corrupt or hostile local state fails closed into a usable default app", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("modeltab-state-v1", "{\"__proto__\":{\"polluted\":true},\"providers\":[],\"conversations\":[]}");
  });
  await page.goto(appUrl);
  await expect(page.locator(".workspace")).toBeVisible();
  await expect(page.locator("#promptInput")).toBeVisible();
  await expect.poll(() => page.evaluate(() => Object.prototype.polluted)).toBeUndefined();
});

test("hostile persisted content renders as inert text", async ({ page }) => {
  const dialogs = [];
  page.on("dialog", async (dialog) => {
    dialogs.push(dialog.message());
    await dialog.dismiss();
  });
  await page.addInitScript(() => {
    const payload = `<img src=x onerror="window.__modeltabPwned=1"> [bad](javascript:alert(1)) [safe](https://example.com/?q=" onmouseover="alert(1))`;
    localStorage.setItem("modeltab-state-v1", JSON.stringify({
      activeProviderId: "hostile-provider",
      providers: [{
        id: "hostile-provider",
        name: "Hostile <b>Provider</b>",
        type: "openai",
        baseUrl: "http://127.0.0.1:1234/v1",
        model: "hostile-model",
        noAuth: true
      }],
      folders: [{ id: "folder-xss", name: "Folder <svg onload=alert(1)>", parentId: "" }],
      conversations: [{
        id: "chat-xss",
        title: "Title <script>alert(1)</script>",
        folderId: "folder-xss",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [
          { id: "message-user", role: "user", content: payload, createdAt: new Date().toISOString() },
          { id: "message-assistant", role: "assistant", content: `**Answer**\n\n${payload}`, createdAt: new Date().toISOString() }
        ]
      }],
      activeConversationId: "chat-xss"
    }));
  });

  await page.goto(appUrl);
  await expect(page.locator(".workspace")).toBeVisible();
  await expect(page.locator(".message")).toHaveCount(2);
  await expect(page.locator(".message .markdown img")).toHaveCount(0);
  await expect(page.locator('.message .markdown a[href^="javascript:"]')).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => window.__modeltabPwned)).toBeUndefined();
  expect(dialogs).toEqual([]);
});

test("Gemini native provider sends expected request shape without Authorization", async ({ page }) => {
  providerRequests.length = 0;
  await page.addInitScript(({ providerOrigin }) => {
    localStorage.setItem("modeltab-state-v1", JSON.stringify({
      activeProviderId: "gemini-smoke",
      providers: [{
        id: "gemini-smoke",
        name: "Gemini Smoke",
        type: "gemini",
        baseUrl: `${providerOrigin}/gemini`,
        model: "gemini-smoke",
        extraHeaders: "",
        noAuth: false,
        presetId: "gemini-native"
      }],
      settings: {
        stream: false,
        autoTrim: true,
        recentTurns: 3,
        maxInputTokens: 6000,
        maxTokens: 256,
        temperature: 0.2,
        topP: 1,
        systemPrompt: "System seed"
      },
      conversations: [{
        id: "chat-gemini",
        title: "Gemini smoke",
        context: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: []
      }],
      activeConversationId: "chat-gemini"
    }));
  }, { providerOrigin });
  await page.goto(appUrl);
  await page.locator("#providerKeyInput").evaluate((input) => {
    input.value = "gemini-key";
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await page.getByPlaceholder("Ask anything. Shift+Enter for a new line.").fill("hello gemini");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.locator(".message.assistant .markdown")).toContainText("gemini-ok");

  const request = providerRequests.find((item) => item.kind === "gemini");
  expect(request.headers.authorization).toBeUndefined();
  expect(request.headers["x-goog-api-key"]).toBe("gemini-key");
  expect(request.body.systemInstruction.parts[0].text).toContain("System seed");
  expect(request.body.contents.at(-1).parts[0].text).toBe("hello gemini");
});

test("provider failures, aborts, and offline state surface in-app", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("modeltab-state-v1", JSON.stringify({
      activeProviderId: "failed-provider",
      providers: [{
        id: "failed-provider",
        name: "Failed Provider",
        type: "openai",
        baseUrl: "http://127.0.0.1:1/v1",
        model: "failed-model",
        extraHeaders: "",
        noAuth: true
      }],
      settings: {
        stream: false,
        autoTrim: true,
        recentTurns: 3,
        maxInputTokens: 6000,
        maxTokens: 256,
        temperature: 0.2,
        topP: 1
      },
      conversations: [{
        id: "chat-failed",
        title: "Failed provider",
        context: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: []
      }],
      activeConversationId: "chat-failed"
    }));
  });
  await page.goto(appUrl);
  await page.getByPlaceholder("Ask anything. Shift+Enter for a new line.").fill("fail");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.locator(".message.assistant.error .markdown")).toContainText("Network or CORS failure");

  await page.context().setOffline(true);
  await page.evaluate(() => window.dispatchEvent(new Event("offline")));
  await expect(page.locator("#readinessDetail")).toContainText("offline");
  await page.context().setOffline(false);
  await page.evaluate(() => window.dispatchEvent(new Event("online")));
});

test("streaming requests can be aborted without losing state", async ({ page }) => {
  await page.addInitScript(({ providerOrigin }) => {
    localStorage.setItem("modeltab-state-v1", JSON.stringify({
      activeProviderId: "stream-provider",
      providers: [{
        id: "stream-provider",
        name: "Stream Provider",
        type: "openai",
        baseUrl: `${providerOrigin}/stream/v1`,
        model: "stream-model",
        extraHeaders: "",
        noAuth: true
      }],
      settings: {
        stream: true,
        autoTrim: true,
        recentTurns: 3,
        maxInputTokens: 6000,
        maxTokens: 256,
        temperature: 0.2,
        topP: 1
      },
      conversations: [{
        id: "chat-stream",
        title: "Stream provider",
        context: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: []
      }],
      activeConversationId: "chat-stream"
    }));
  }, { providerOrigin });
  await page.goto(appUrl);
  await page.getByPlaceholder("Ask anything. Shift+Enter for a new line.").fill("stream");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.locator("#stopBtn")).toBeVisible();
  await page.locator("#stopBtn").click();
  await expect(page.locator(".message.assistant .markdown")).toContainText("[Stopped]");
});

test("import, quota, oversized input, and encrypted backup boundaries fail closed", async ({ page }) => {
  await page.goto(appUrl);
  const result = await page.evaluate(async () => {
    const input = document.querySelector("#importInput");
    Object.defineProperty(input, "files", {
      configurable: true,
      value: [{ size: 20, text: async () => "{\"providers\":{}}" }]
    });
    await importData();
    const badImport = document.querySelector("#providerStatus").textContent;

    Object.defineProperty(input, "files", {
      configurable: true,
      value: [{ size: 80 * 1024 * 1024 + 1, text: async () => "{}" }]
    });
    await importData();
    const oversizedImport = document.querySelector("#providerStatus").textContent;

    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function setItemQuotaFailure() {
      throw new Error("quota");
    };
    saveState();
    const quotaFailure = document.querySelector("#providerStatus").textContent;
    Storage.prototype.setItem = originalSetItem;

    const vault = await encryptJson({ keys: { provider: "SECRET_KEY" } }, "passphrase");
    const decrypted = await decryptJson(vault, "passphrase");
    const normalExport = JSON.stringify(exportPayload("data"));
    const fullBackup = JSON.stringify(exportPayload("full-backup", vault));

    return { badImport, oversizedImport, quotaFailure, decrypted, normalExport, fullBackup };
  });

  expect(result.badImport).toContain("Import failed");
  expect(result.oversizedImport).toContain("Import file is too large");
  expect(result.quotaFailure).toContain("Local storage failed");
  expect(result.decrypted.keys.provider).toBe("SECRET_KEY");
  expect(result.normalExport).not.toContain("SECRET_KEY");
  expect(result.fullBackup).not.toContain("SECRET_KEY");
  expect(result.fullBackup).toContain("PBKDF2-SHA256-210000");
});
