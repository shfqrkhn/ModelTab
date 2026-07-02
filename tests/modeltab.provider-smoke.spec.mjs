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
    response.setHeader("access-control-allow-headers", "authorization,content-type");
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
    response.writeHead(404).end("Not found");
  });
  await new Promise((resolve) => providerServer.listen(0, "127.0.0.1", resolve));
  providerUrl = `http://127.0.0.1:${providerServer.address().port}/v1`;
});

test.afterAll(async () => {
  await Promise.all([
    new Promise((resolve) => staticServer.close(resolve)),
    new Promise((resolve) => providerServer.close(resolve))
  ]);
});

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
