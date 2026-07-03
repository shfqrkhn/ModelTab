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
      const body = await requestBody(request);
      providerRequests.push({ kind: "openai", headers: request.headers, body: JSON.parse(body) });
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

test("workspace intent fails closed when only stale persisted trace exists", async ({ page }) => {
  providerRequests.length = 0;
  await page.addInitScript(({ providerUrl }) => {
    localStorage.setItem("modeltab-state-v1", JSON.stringify({
      activeProviderId: "workspace-provider",
      providers: [{
        id: "workspace-provider",
        name: "Workspace Provider",
        type: "openai",
        baseUrl: providerUrl,
        model: "smoke-model",
        extraHeaders: "",
        noAuth: true
      }],
      workspace: {
        enabled: true,
        shareTrace: true,
        folderName: "stale-folder",
        trace: [{
          id: "stale-trace",
          createdAt: new Date().toISOString(),
          tool: "workspace.list",
          input: "stale-folder",
          output: "file README.md",
          ok: true
        }]
      },
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
        id: "chat-workspace-stale",
        title: "Workspace stale",
        context: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: []
      }],
      activeConversationId: "chat-workspace-stale"
    }));
  }, { providerUrl });

  await page.goto(appUrl);
  await page.getByPlaceholder("Ask anything. Shift+Enter for a new line.").fill("List files in my local workspace.");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.locator(".message.assistant.error .markdown")).toContainText("no live workspace folder");
  expect(providerRequests.filter((item) => item.kind === "openai")).toHaveLength(0);
});

test("workspace import resets live folder handles before stale trace can be used", async ({ page }) => {
  providerRequests.length = 0;
  await page.addInitScript(({ providerUrl }) => {
    const liveFile = new File(["LIVE_FOLDER_TOKEN\n"], "live.txt", { type: "text/plain" });
    const liveDirectory = {
      kind: "directory",
      name: "live-folder",
      queryPermission: async () => "granted",
      requestPermission: async () => "granted",
      entries: async function* entries() {
        yield ["live.txt", { kind: "file", name: "live.txt", getFile: async () => liveFile }];
      },
      getFileHandle: async (name) => {
        if (name !== "live.txt") throw new Error("not found");
        return { kind: "file", name: "live.txt", getFile: async () => liveFile };
      },
      getDirectoryHandle: async () => {
        throw new Error("not found");
      }
    };
    window.showDirectoryPicker = async () => liveDirectory;
    localStorage.setItem("modeltab-state-v1", JSON.stringify({
      activeProviderId: "workspace-provider",
      providers: [{
        id: "workspace-provider",
        name: "Workspace Provider",
        type: "openai",
        baseUrl: providerUrl,
        model: "smoke-model",
        extraHeaders: "",
        noAuth: true
      }],
      workspace: {
        enabled: true,
        shareTrace: true,
        folderName: "",
        trace: []
      },
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
        id: "chat-workspace-import",
        title: "Workspace import",
        context: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: []
      }],
      activeConversationId: "chat-workspace-import"
    }));
  }, { providerUrl });

  await page.goto(appUrl);
  await page.getByRole("button", { name: "Settings" }).click();
  await page.locator("#workspaceSettingsDetails").evaluate((details) => { details.open = true; });
  await page.locator("#workspaceSelectBtn").click();
  await expect(page.locator("#workspaceStatus")).toContainText("Connected read-only folder");

  const importStatus = await page.evaluate(async ({ providerUrl }) => {
    const imported = {
      app: "modeltab",
      kind: "data",
      formatVersion: 2,
      state: {
        activeProviderId: "workspace-provider",
        providers: [{
          id: "workspace-provider",
          name: "Workspace Provider",
          type: "openai",
          baseUrl: providerUrl,
          model: "smoke-model",
          extraHeaders: "",
          noAuth: true
        }],
        workspace: {
          enabled: true,
          shareTrace: true,
          folderName: "imported-folder",
          trace: [{
            id: "imported-trace",
            createdAt: new Date().toISOString(),
            tool: "workspace.list",
            input: "imported-folder",
            output: "file IMPORTED_STALE_TOKEN.txt",
            ok: true
          }]
        },
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
          id: "imported-workspace-chat",
          title: "Imported Workspace",
          context: "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          messages: []
        }],
        activeConversationId: "imported-workspace-chat"
      }
    };
    const text = JSON.stringify(imported);
    Object.defineProperty(document.querySelector("#importInput"), "files", {
      configurable: true,
      value: [{ size: text.length, text: async () => text }]
    });
    await importData();
    return document.querySelector("#workspaceStatus").textContent;
  }, { providerUrl });

  expect(importStatus).toContain("remembered by name only");
  await page.keyboard.press("Escape");
  await page.getByPlaceholder("Ask anything. Shift+Enter for a new line.").fill("List files in my local workspace.");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.locator(".message.assistant.error .markdown")).toContainText("no live workspace folder");
  expect(providerRequests.filter((item) => item.kind === "openai")).toHaveLength(0);
});

test("workspace trace reaches provider only after live verified tool output", async ({ page }) => {
  providerRequests.length = 0;
  await page.addInitScript(({ providerUrl }) => {
    const textFile = new File(["hello workspace\nuseful symbol\n"], "README.md", { type: "text/markdown" });
    const binaryFile = new File([new Uint8Array([0x4d, 0x5a, 0x00, 0x02, 0xff])], "program.exe", { type: "application/octet-stream" });
    const files = new Map([
      ["README.md", textFile],
      ["program.exe", binaryFile]
    ]);
    const handleFor = (name) => ({
      kind: "file",
      name,
      getFile: async () => files.get(name)
    });
    const directory = {
      kind: "directory",
      name: "fixture-workspace",
      queryPermission: async () => "granted",
      requestPermission: async () => "granted",
      entries: async function* entries() {
        yield ["README.md", handleFor("README.md")];
        yield ["program.exe", handleFor("program.exe")];
      },
      getFileHandle: async (name) => {
        if (!files.has(name)) throw new Error("not found");
        return handleFor(name);
      },
      getDirectoryHandle: async () => {
        throw new Error("not found");
      }
    };
    window.showDirectoryPicker = async () => directory;
    localStorage.setItem("modeltab-state-v1", JSON.stringify({
      activeProviderId: "workspace-provider",
      providers: [{
        id: "workspace-provider",
        name: "Workspace Provider",
        type: "openai",
        baseUrl: providerUrl,
        model: "smoke-model",
        extraHeaders: "",
        noAuth: true
      }],
      workspace: {
        enabled: true,
        shareTrace: true,
        folderName: "",
        trace: []
      },
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
        id: "chat-workspace-live",
        title: "Workspace live",
        context: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: []
      }],
      activeConversationId: "chat-workspace-live"
    }));
  }, { providerUrl });

  await page.goto(appUrl);
  await page.getByRole("button", { name: "Settings" }).click();
  await page.locator("#workspaceSettingsDetails").evaluate((details) => { details.open = true; });
  await page.locator("#workspaceSelectBtn").click();
  await expect(page.locator("#workspaceStatus")).toContainText("Connected read-only folder");
  await page.locator("#workspaceListBtn").click();
  await expect(page.locator("#workspaceTrace")).toContainText("README.md");
  await page.locator("#workspacePathInput").fill("program.exe");
  await page.locator("#workspaceInspectBtn").click();
  await expect(page.locator("#workspaceTrace")).toContainText("PE/COFF executable");
  await expect(page.locator("#workspaceTrace")).toContainText("sha256:");
  await expect(page.locator("#workspaceTrace")).toContainText("hexdump:");
  await page.keyboard.press("Escape");

  await page.getByPlaceholder("Ask anything. Shift+Enter for a new line.").fill("Use the selected workspace trace to summarize files.");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.locator(".message.assistant .markdown")).toContainText("smoke-ok");

  const body = providerRequests.filter((item) => item.kind === "openai").at(-1).body;
  const serialized = JSON.stringify(body);
  expect(serialized).toContain("Workspace Agent Mode trace");
  expect(serialized).toContain("workspace.list OK");
  expect(serialized).toContain("workspace.inspect OK");
  expect(serialized).toContain("README.md");
  expect(serialized).toContain("PE/COFF executable");
  expect(serialized).not.toContain("workspace.select");
});

test("workspace folder reselection clears stale trace before provider context", async ({ page }) => {
  providerRequests.length = 0;
  await page.addInitScript(({ providerUrl }) => {
    const folderAFile = new File(["A_ONLY_TOKEN\n"], "a.txt", { type: "text/plain" });
    const folderBFile = new File(["B_ONLY_TOKEN\n"], "b.txt", { type: "text/plain" });
    const fileHandle = (file) => ({
      kind: "file",
      name: file.name,
      getFile: async () => file
    });
    const folderA = {
      kind: "directory",
      name: "folder-a",
      queryPermission: async () => "granted",
      requestPermission: async () => "granted",
      entries: async function* entries() {
        yield ["a.txt", fileHandle(folderAFile)];
      },
      getFileHandle: async (name) => {
        if (name !== "a.txt") throw new Error("not found");
        return fileHandle(folderAFile);
      },
      getDirectoryHandle: async () => {
        throw new Error("not found");
      }
    };
    const folderB = {
      kind: "directory",
      name: "folder-b",
      queryPermission: async () => "granted",
      requestPermission: async () => "granted",
      entries: async function* entries() {
        yield ["b.txt", fileHandle(folderBFile)];
      },
      getFileHandle: async (name) => {
        if (name !== "b.txt") throw new Error("not found");
        return fileHandle(folderBFile);
      },
      getDirectoryHandle: async () => {
        throw new Error("not found");
      }
    };
    let nextFolder = folderA;
    window.__selectFolderB = () => { nextFolder = folderB; };
    window.showDirectoryPicker = async () => nextFolder;
    localStorage.setItem("modeltab-state-v1", JSON.stringify({
      activeProviderId: "workspace-provider",
      providers: [{
        id: "workspace-provider",
        name: "Workspace Provider",
        type: "openai",
        baseUrl: providerUrl,
        model: "smoke-model",
        extraHeaders: "",
        noAuth: true
      }],
      workspace: {
        enabled: true,
        shareTrace: true,
        folderName: "",
        trace: []
      },
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
        id: "chat-workspace-reselect",
        title: "Workspace reselect",
        context: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: []
      }],
      activeConversationId: "chat-workspace-reselect"
    }));
  }, { providerUrl });

  await page.goto(appUrl);
  await page.getByRole("button", { name: "Settings" }).click();
  await page.locator("#workspaceSettingsDetails").evaluate((details) => { details.open = true; });
  await page.locator("#workspaceSelectBtn").click();
  await page.locator("#workspaceListBtn").click();
  await expect(page.locator("#workspaceTrace")).toContainText("a.txt");
  await page.locator("#workspacePathInput").fill("a.txt");
  await page.locator("#workspaceSearchInput").fill("A_ONLY_TOKEN");

  await page.evaluate(() => window.__selectFolderB());
  await page.locator("#workspaceSelectBtn").click();
  await expect(page.locator("#workspaceTrace")).not.toContainText("a.txt");
  await expect(page.locator("#workspacePathInput")).toHaveValue("");
  await expect(page.locator("#workspaceSearchInput")).toHaveValue("");
  await page.locator("#workspaceListBtn").click();
  await expect(page.locator("#workspaceTrace")).toContainText("b.txt");
  await expect(page.locator("#workspaceTrace")).not.toContainText("A_ONLY_TOKEN");
  await page.keyboard.press("Escape");

  await page.getByPlaceholder("Ask anything. Shift+Enter for a new line.").fill("Use the selected workspace trace to summarize files.");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.locator(".message.assistant .markdown")).toContainText("smoke-ok");

  const body = providerRequests.filter((item) => item.kind === "openai").at(-1).body;
  const serialized = JSON.stringify(body);
  expect(serialized).toContain("folder-b");
  expect(serialized).toContain("b.txt");
  expect(serialized).not.toContain("folder-a");
  expect(serialized).not.toContain("a.txt");
  expect(serialized).not.toContain("A_ONLY_TOKEN");
});

test("workspace unsupported browser state is explicit and non-blocking", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "showDirectoryPicker", { configurable: true, value: undefined });
  });

  await page.goto(appUrl);
  await page.getByRole("button", { name: "Settings" }).click();
  await page.locator("#workspaceSettingsDetails").evaluate((details) => { details.open = true; });
  await expect(page.locator("#workspaceCapability")).toContainText("File System Access API");
  await expect(page.locator("#workspaceSelectBtn")).toBeDisabled();
  await expect(page.locator("#promptInput")).toBeVisible();
});

test("workspace empty folders and large-file limits are visible in traces", async ({ page }) => {
  await page.addInitScript(() => {
    const largeFile = new File([new Uint8Array(9 * 1024 * 1024).fill(0x41)], "big.bin", { type: "application/octet-stream" });
    const largeHandle = { kind: "file", name: "big.bin", getFile: async () => largeFile };
    const folders = new Map([
      ["empty-workspace", {
        kind: "directory",
        name: "empty-workspace",
        queryPermission: async () => "granted",
        requestPermission: async () => "granted",
        entries: async function* entries() {}
      }],
      ["large-workspace", {
        kind: "directory",
        name: "large-workspace",
        queryPermission: async () => "granted",
        requestPermission: async () => "granted",
        entries: async function* entries() {
          yield ["big.bin", largeHandle];
        },
        getFileHandle: async (name) => {
          if (name !== "big.bin") throw new Error("not found");
          return largeHandle;
        },
        getDirectoryHandle: async () => {
          throw new Error("not found");
        }
      }]
    ]);
    let nextFolder = "empty-workspace";
    window.__useLargeWorkspace = () => { nextFolder = "large-workspace"; };
    window.showDirectoryPicker = async () => folders.get(nextFolder);
  });

  await page.goto(appUrl);
  await page.getByRole("button", { name: "Settings" }).click();
  await page.locator("#workspaceSettingsDetails").evaluate((details) => { details.open = true; });
  await page.locator("#workspaceEnableInput").check();
  await page.locator("#workspaceSelectBtn").click();
  await page.locator("#workspaceListBtn").click();
  await expect(page.locator("#workspaceTrace")).toContainText("Workspace folder is empty");

  await page.evaluate(() => window.__useLargeWorkspace());
  await page.locator("#workspaceSelectBtn").click();
  await page.locator("#workspaceSearchInput").fill("AAAA");
  await page.locator("#workspaceSearchBtn").click();
  await expect(page.locator("#workspaceTrace")).toContainText("Skipped 1 oversized file");
  await page.locator("#workspacePathInput").fill("big.bin");
  await page.locator("#workspaceInspectBtn").click();
  await expect(page.locator("#workspaceTrace")).toContainText("chunked sample");
  await expect(page.locator("#workspaceTrace")).toContainText("sha256: skipped");
});

test("workspace permission loss disconnects handle and leaves visible failed trace", async ({ page }) => {
  await page.addInitScript(() => {
    const directory = {
      kind: "directory",
      name: "revoked-workspace",
      queryPermission: async () => "denied",
      requestPermission: async () => "denied",
      entries: async function* entries() {
        yield ["README.md", { kind: "file", name: "README.md", getFile: async () => new File(["x"], "README.md") }];
      }
    };
    window.showDirectoryPicker = async () => directory;
  });

  await page.goto(appUrl);
  await page.getByRole("button", { name: "Settings" }).click();
  await page.locator("#workspaceSettingsDetails").evaluate((details) => { details.open = true; });
  await page.locator("#workspaceEnableInput").check();
  await page.locator("#workspaceSelectBtn").click();
  await expect(page.locator("#workspaceStatus")).toContainText("Connected read-only folder");
  await page.locator("#workspaceListBtn").click();
  await expect(page.locator("#workspaceTrace")).toContainText("Workspace read permission is not granted");
  await expect(page.locator("#workspaceStatus")).toContainText("remembered by name only");
});

test("model fetch confirms connection and selects first missing model", async ({ page }) => {
  await page.addInitScript(({ providerUrl }) => {
    localStorage.setItem("modeltab-state-v1", JSON.stringify({
      activeProviderId: "custom-provider",
      providers: [{
        id: "custom-provider",
        name: "Custom Provider",
        type: "openai",
        baseUrl: providerUrl,
        model: "",
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
        id: "chat-custom",
        title: "Custom provider",
        context: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: []
      }],
      activeConversationId: "chat-custom"
    }));
  }, { providerUrl });

  await page.goto(appUrl);
  await page.getByRole("button", { name: "Settings" }).click();
  await expect(page.locator("#readinessDetail")).toContainText("model missing");
  await page.locator("#fetchModelsBtn").click();
  await expect(page.locator("#providerStatus")).toContainText("Connected. Loaded 1 models. Selected smoke-model.");
  await expect(page.locator("#modelInput")).toHaveValue("smoke-model");
  await expect(page.locator("#readinessTitle")).toContainText("Setup ready");
});

test("Ollama model fetch failures show provider-specific browser diagnostics", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("modeltab-state-v1", JSON.stringify({
      activeProviderId: "ollama-failed",
      providers: [{
        id: "ollama-failed",
        name: "Ollama Local",
        type: "openai",
        baseUrl: "http://127.0.0.1:1/v1",
        model: "llama3.2",
        extraHeaders: "",
        noAuth: true,
        presetId: "ollama"
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
        id: "chat-ollama",
        title: "Ollama diagnostics",
        context: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: []
      }],
      activeConversationId: "chat-ollama"
    }));
  });
  await page.goto(appUrl);
  await page.getByRole("button", { name: "Settings" }).click();
  await page.locator("#fetchModelsBtn").click();
  await expect(page.locator("#providerStatus")).toContainText("For Ollama");
  await expect(page.locator("#providerStatus")).toContainText("browser/CORS access");
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
        systemPrompt: "System seed",
        memory: "Memory seed",
        jsonMode: true,
        grounding: true,
        extraBody: "{\"safetySettings\":[{\"category\":\"HARM_CATEGORY_DANGEROUS_CONTENT\",\"threshold\":\"BLOCK_NONE\"}]}"
      },
      conversations: [{
        id: "chat-gemini",
        title: "Gemini smoke",
        context: "Chat context seed",
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
  expect(request.body.systemInstruction.parts[0].text).toContain("Persistent memory:\nMemory seed");
  expect(request.body.systemInstruction.parts[0].text).toContain("Current chat context:\nChat context seed");
  expect(request.body.generationConfig.responseMimeType).toBe("application/json");
  expect(request.body.tools).toEqual([{ googleSearch: {} }]);
  expect(request.body.safetySettings[0].category).toBe("HARM_CATEGORY_DANGEROUS_CONTENT");
  expect(request.body.contents.at(-1).parts[0].text).toBe("hello gemini");
});

test("OpenAI request preserves context, additive extra body, and historical image policy", async ({ page }) => {
  providerRequests.length = 0;
  await page.addInitScript(({ providerUrl }) => {
    localStorage.setItem("modeltab-state-v1", JSON.stringify({
      activeProviderId: "shape-provider",
      providers: [{
        id: "shape-provider",
        name: "Shape Provider",
        type: "openai",
        baseUrl: providerUrl,
        model: "shape-model",
        extraHeaders: "",
        noAuth: true
      }],
      settings: {
        stream: false,
        autoTrim: true,
        recentTurns: 4,
        maxInputTokens: 6000,
        maxTokens: 123,
        temperature: 0.3,
        topP: 0.8,
        systemPrompt: "System shape",
        memory: "Memory shape",
        historyImages: false,
        extraBody: "{\"metadata\":{\"source\":\"modeltab-test\"},\"reasoning_effort\":\"low\"}"
      },
      conversations: [{
        id: "chat-shape",
        title: "Shape chat",
        context: "Chat context shape",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [
          {
            id: "old-user",
            role: "user",
            content: "old image prompt",
            attachments: [{
              id: "image-old",
              name: "old.png",
              type: "image/png",
              size: 3,
              dataUrl: "data:image/png;base64,AAAA"
            }],
            createdAt: new Date().toISOString()
          },
          { id: "old-assistant", role: "assistant", content: "old answer", createdAt: new Date().toISOString() }
        ]
      }],
      activeConversationId: "chat-shape"
    }));
  }, { providerUrl });

  await page.goto(appUrl);
  await page.getByPlaceholder("Ask anything. Shift+Enter for a new line.").fill("latest request");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.locator(".message.assistant .markdown").last()).toContainText("smoke-ok");

  const body = providerRequests.filter((item) => item.kind === "openai").at(-1).body;
  expect(body.model).toBe("shape-model");
  expect(body.stream).toBe(false);
  expect(body.max_tokens).toBe(123);
  expect(body.temperature).toBe(0.3);
  expect(body.top_p).toBe(0.8);
  expect(body.metadata.source).toBe("modeltab-test");
  expect(body.reasoning_effort).toBe("low");
  expect(body.messages[0].role).toBe("system");
  expect(body.messages[0].content).toContain("System shape");
  expect(body.messages[0].content).toContain("Persistent memory:\nMemory shape");
  expect(body.messages[0].content).toContain("Current chat context:\nChat context shape");
  expect(body.messages.some((message) => JSON.stringify(message).includes("image_url"))).toBe(false);
  expect(body.messages.at(-1)).toEqual({ role: "user", content: "latest request" });
});

test("OpenAI request includes historical images only when explicitly enabled", async ({ page }) => {
  providerRequests.length = 0;
  await page.addInitScript(({ providerUrl }) => {
    localStorage.setItem("modeltab-state-v1", JSON.stringify({
      activeProviderId: "image-history-provider",
      providers: [{
        id: "image-history-provider",
        name: "Image History Provider",
        type: "openai",
        baseUrl: providerUrl,
        model: "image-history-model",
        extraHeaders: "",
        noAuth: true
      }],
      settings: {
        stream: false,
        autoTrim: true,
        recentTurns: 4,
        maxInputTokens: 6000,
        maxTokens: 256,
        temperature: 0.2,
        topP: 1,
        historyImages: true
      },
      conversations: [{
        id: "chat-image-history",
        title: "Image history",
        context: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [
          {
            id: "old-user",
            role: "user",
            content: "old image prompt",
            attachments: [{
              id: "image-old",
              name: "old.png",
              type: "image/png",
              size: 3,
              dataUrl: "data:image/png;base64,AAAA"
            }],
            createdAt: new Date().toISOString()
          },
          { id: "old-assistant", role: "assistant", content: "old answer", createdAt: new Date().toISOString() }
        ]
      }],
      activeConversationId: "chat-image-history"
    }));
  }, { providerUrl });

  await page.goto(appUrl);
  await page.getByPlaceholder("Ask anything. Shift+Enter for a new line.").fill("latest request");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.locator(".message.assistant .markdown").last()).toContainText("smoke-ok");

  const body = providerRequests.filter((item) => item.kind === "openai").at(-1).body;
  const imagePart = body.messages.find((message) => Array.isArray(message.content))?.content.find((part) => part.type === "image_url");
  expect(imagePart.image_url.url).toBe("data:image/png;base64,AAAA");
});

test("extra request body cannot override core provider payload fields", async ({ page }) => {
  providerRequests.length = 0;
  await page.addInitScript(({ providerUrl }) => {
    localStorage.setItem("modeltab-state-v1", JSON.stringify({
      activeProviderId: "override-provider",
      providers: [{
        id: "override-provider",
        name: "Override Provider",
        type: "openai",
        baseUrl: providerUrl,
        model: "override-model",
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
        topP: 1,
        extraBody: "{\"messages\":[{\"role\":\"user\",\"content\":\"override\"}]}"
      },
      conversations: [{
        id: "chat-override",
        title: "Override guard",
        context: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: []
      }],
      activeConversationId: "chat-override"
    }));
  }, { providerUrl });

  await page.goto(appUrl);
  await page.getByPlaceholder("Ask anything. Shift+Enter for a new line.").fill("should not send");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.locator("#providerStatus")).toContainText("Extra request body cannot override core request field: messages.");
  expect(providerRequests.filter((item) => item.kind === "openai")).toHaveLength(0);
});

test("recent-turn trimming is reflected in token summary and provider request body", async ({ page }) => {
  providerRequests.length = 0;
  await page.addInitScript(({ providerUrl }) => {
    localStorage.setItem("modeltab-state-v1", JSON.stringify({
      activeProviderId: "trim-provider",
      providers: [{
        id: "trim-provider",
        name: "Trim Provider",
        type: "openai",
        baseUrl: providerUrl,
        model: "trim-model",
        extraHeaders: "",
        noAuth: true
      }],
      settings: {
        stream: false,
        autoTrim: true,
        recentTurns: 1,
        maxInputTokens: 6000,
        maxTokens: 256,
        temperature: 0.2,
        topP: 1
      },
      conversations: [{
        id: "chat-trim",
        title: "Trim chat",
        context: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [
          { id: "old-user-1", role: "user", content: "old user 1", createdAt: new Date().toISOString() },
          { id: "old-assistant-1", role: "assistant", content: "old assistant 1", createdAt: new Date().toISOString() },
          { id: "kept-user", role: "user", content: "kept user", createdAt: new Date().toISOString() },
          { id: "kept-assistant", role: "assistant", content: "kept assistant", createdAt: new Date().toISOString() }
        ]
      }],
      activeConversationId: "chat-trim"
    }));
  }, { providerUrl });

  await page.goto(appUrl);
  await expect(page.locator("#readinessDetail")).toContainText("2 older msg trimmed");
  await page.getByPlaceholder("Ask anything. Shift+Enter for a new line.").fill("latest trim request");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.locator(".message.assistant .markdown").last()).toContainText("smoke-ok");

  const body = providerRequests.filter((item) => item.kind === "openai").at(-1).body;
  const serialized = JSON.stringify(body.messages);
  expect(serialized).not.toContain("old user 1");
  expect(serialized).not.toContain("old assistant 1");
  expect(serialized).not.toContain("kept user");
  expect(serialized).toContain("kept assistant");
  expect(serialized).toContain("latest trim request");
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

test("data export and encrypted backup round trip restores state without plaintext keys", async ({ page }) => {
  await page.goto(appUrl);
  const result = await page.evaluate(async () => {
    const now = new Date().toISOString();
    state.providers = [{
      id: "portable-provider",
      name: "Portable Provider",
      type: "openai",
      baseUrl: "https://example.test/v1",
      model: "portable-model",
      extraHeaders: "",
      noAuth: false,
      apiKey: "SHOULD_NOT_EXPORT"
    }];
    state.activeProviderId = "portable-provider";
    state.settings.systemPrompt = "Portable system";
    state.settings.memory = "Portable memory";
    state.promptLibrary = [{
      id: "portable-prompt",
      name: "Portable Prompt",
      kind: "prompt",
      tags: "portable",
      content: "Portable content",
      favorite: true,
      createdAt: now,
      updatedAt: now
    }];
    state.folders = [{ id: "folder-a", name: "Folder A", parentId: "", expanded: true, createdAt: now, updatedAt: now }];
    state.conversations = [{
      id: "chat-a",
      title: "Portable Chat",
      context: "Portable context",
      folderId: "folder-a",
      archivedAt: now,
      createdAt: now,
      updatedAt: now,
      messages: [
        { id: "m1", role: "user", content: "hello", createdAt: now },
        { id: "m2", role: "assistant", content: "world", provider: "Portable Provider", model: "portable-model", createdAt: now }
      ]
    }];
    state.activeConversationId = "chat-a";
    state.drafts = { "chat-a": "portable draft" };
    sessionKeys = { "portable-provider": "SECRET_KEY" };
    saveState();

    const normal = exportPayload("data");
    const encryptedVault = await encryptJson({ savedAt: now, keys: sanitizeKeyMap(sessionKeys) }, "passphrase");
    const backup = exportPayload("full-backup", encryptedVault);
    const normalText = JSON.stringify(normal);
    const backupText = JSON.stringify(backup);

    state = normalizeState(structuredClone(DEFAULT_STATE));
    sessionKeys = {};
    localStorage.removeItem("modeltab-key-vault-v1");
    const input = document.querySelector("#importInput");
    Object.defineProperty(input, "files", {
      configurable: true,
      value: [{ size: backupText.length, text: async () => backupText }]
    });
    await importData();
    document.querySelector("#vaultPassphraseInput").value = "passphrase";
    await unlockVault();

    return {
      normalHasSecret: normalText.includes("SECRET_KEY") || normalText.includes("SHOULD_NOT_EXPORT"),
      backupHasPlaintextSecret: backupText.includes("SECRET_KEY") || backupText.includes("SHOULD_NOT_EXPORT"),
      provider: activeProvider(),
      systemPrompt: state.settings.systemPrompt,
      memory: state.settings.memory,
      promptName: state.promptLibrary.find((item) => item.id === "portable-prompt")?.name,
      folderName: state.folders.find((item) => item.id === "folder-a")?.name,
      chat: activeConversation(),
      draft: state.drafts["chat-a"],
      unlockedKey: getProviderKey(activeProvider()),
      status: document.querySelector("#providerStatus").textContent
    };
  });

  expect(result.normalHasSecret).toBe(false);
  expect(result.backupHasPlaintextSecret).toBe(false);
  expect(result.provider.name).toBe("Portable Provider");
  expect(result.systemPrompt).toBe("Portable system");
  expect(result.memory).toBe("Portable memory");
  expect(result.promptName).toBe("Portable Prompt");
  expect(result.folderName).toBe("Folder A");
  expect(result.chat.title).toBe("Portable Chat");
  expect(result.chat.archivedAt).toBeTruthy();
  expect(result.draft).toBe("portable draft");
  expect(result.unlockedKey).toBe("SECRET_KEY");
  expect(result.status).toContain("Key vault unlocked");
});

test("key-free import clears stale session keys and saved vault", async ({ page }) => {
  await page.goto(appUrl);
  const result = await page.evaluate(async () => {
    sessionKeys = { "same-provider": "OLD_SECRET" };
    localStorage.setItem("modeltab-key-vault-v1", JSON.stringify(await encryptJson({ keys: sessionKeys }, "old-pass")));
    const payload = {
      app: "modeltab",
      kind: "data",
      formatVersion: 2,
      state: {
        activeProviderId: "same-provider",
        providers: [{
          id: "same-provider",
          name: "Imported Provider",
          type: "openai",
          baseUrl: "https://example.test/v1",
          model: "imported-model",
          noAuth: false,
          apiKey: "MUST_NOT_IMPORT"
        }],
        conversations: [{
          id: "imported-chat",
          title: "Imported",
          context: "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          messages: []
        }],
        activeConversationId: "imported-chat"
      }
    };
    const text = JSON.stringify(payload);
    const input = document.querySelector("#importInput");
    Object.defineProperty(input, "files", {
      configurable: true,
      value: [{ size: text.length, text: async () => text }]
    });
    await importData();
    return {
      status: document.querySelector("#providerStatus").textContent,
      vault: localStorage.getItem("modeltab-key-vault-v1"),
      key: getProviderKey(activeProvider()),
      serializedState: localStorage.getItem("modeltab-state-v1")
    };
  });

  expect(result.status).toContain("Existing local key vault and session keys were cleared");
  expect(result.vault).toBeNull();
  expect(result.key).toBe("");
  expect(result.serializedState).not.toContain("OLD_SECRET");
  expect(result.serializedState).not.toContain("MUST_NOT_IMPORT");
});

test("vault save refuses empty key vault success", async ({ page }) => {
  await page.goto(appUrl);
  const result = await page.evaluate(async () => {
    sessionKeys = {};
    document.querySelector("#providerKeyInput").value = "";
    document.querySelector("#vaultPassphraseInput").value = "passphrase";
    localStorage.removeItem("modeltab-key-vault-v1");
    await saveVault();
    return {
      status: document.querySelector("#providerStatus").textContent,
      vault: localStorage.getItem("modeltab-key-vault-v1")
    };
  });

  expect(result.status).toContain("No session API keys to save");
  expect(result.vault).toBeNull();
});

test("corrupt saved state recovers visibly and wipe clears recovery snapshot", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("modeltab-state-v1", "{\"providers\":[");
  });
  await page.goto(appUrl);
  await expect(page.locator(".workspace")).toBeVisible();
  await expect(page.locator("#providerStatus")).toContainText("could not be loaded");

  const recoveryBefore = await page.evaluate(() => JSON.parse(localStorage.getItem("modeltab-state-recovery-v1")));
  expect(recoveryBefore.raw).toBe("{\"providers\":[");

  const recoveryAfter = await page.evaluate(() => {
    wipeLocalData();
    wipeLocalData();
    return localStorage.getItem("modeltab-state-recovery-v1");
  });
  expect(recoveryAfter).toBeNull();
});
