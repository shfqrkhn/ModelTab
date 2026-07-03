import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const root = fileURLToPath(new URL("..", import.meta.url));
const read = (path) => readFileSync(join(root, path), "utf8");

const files = {
  html: read("index.html"),
  css: read("styles.css"),
  app: read("app.js"),
  worker: read("workspace-worker.js"),
  serviceWorker: read("service-worker.js"),
  manifest: read("manifest.webmanifest"),
  readme: read("README.md"),
  license: read("LICENSE")
};
const manifest = JSON.parse(files.manifest);

const checks = [];

function check(name, condition) {
  checks.push({ name, ok: Boolean(condition) });
}

function includesAll(source, values) {
  return values.every((value) => source.includes(value));
}

check("no JS popup APIs in app shell", !/\b(alert|confirm|prompt)\s*\(/.test(`${files.html}\n${files.app}`));
check("CSP blocks inline and third-party script execution", /Content-Security-Policy/.test(files.html) && /script-src 'self'/.test(files.html) && /object-src 'none'/.test(files.html));
check("static local mode skips manifest and service worker", includesAll(files.app, ["function attachManifest()", "if (!isHttpLikePage()) return;", "function registerServiceWorker()", "serviceWorker"]));
check("local-file smoke gate exists", files.readme.includes("npm run test:local-file") && read("tests/modeltab.local-file-smoke.mjs").includes("local-file contract smoke"));
check("no horizontal document overflow policy", includesAll(files.css, ["overflow-x: hidden", "minmax(0, 1fr)", ".markdown pre"]));
check("outer panes collapse and overlay consistently", includesAll(files.css, [".app-shell.sidebar-collapsed", ".app-shell.settings-collapsed", "@media (max-width: 1600px)", "@media (max-width: 980px)", "--pane-transition"]));
check("compact next actions keep usable target height", !/\.next-actions button\s*\{[^}]*min-height:\s*30px/s.test(files.css));
check("common cloud provider presets exist", includesAll(files.app, ["OpenRouter", "Groq", "Gemini Native", "OpenAI", "DeepSeek", "MiniMax Global", "Mistral", "Perplexity"]));
check("common local OpenAI-compatible presets exist", includesAll(files.app, ["LM Studio Local", "Ollama Local", "llama.cpp Local", "vLLM Local", "LocalAI Local", "Text Generation WebUI Local", "Local Network OpenAI Compatible"]));
check("provider setup normalizes endpoint URLs and migrates model-fetchable presets", includesAll(files.app, ["PROVIDER_PRESET_VERSION = 7", "https://api.perplexity.ai/v1", "normalizeProviderBaseUrl", "/chat/completions", "Provider base URL must start with http:// or https://."]));
check("provider key safety and reserved header guardrails exist", includesAll(files.app, ["delete provider.apiKey", "RESERVED_EXTRA_HEADERS", "authorization", "x-api-key", "sanitizeKeyMap"]));
check("extra request body cannot override core provider payload fields", includesAll(files.app, ["BLOCKED_EXTRA_BODY_TOP_LEVEL_KEYS", "mergeExtraBody", "Extra request body cannot override core request field"]));
check("normal export excludes keys while backup/import/vault paths protect keys", includesAll(files.app, ["Data exported without API keys", "Full backup exported with encrypted keys", "AES-GCM", "PBKDF2", "keyVault", "RECOVERY_KEY", "Existing local key vault and session keys were cleared", "No session API keys to save"]));
check("prompt, memory, and context surfaces exist", includesAll(files.html, ["systemPromptInput", "memoryInput", "contextInput", "promptLibrarySettingsDetails", "promptLibraryBtn"]));
check("primary interaction feedback and composer labeling exist", includesAll(`${files.html}\n${files.app}`, ["aria-label=\"Message\"", "settingsModelInput", "Message copied.", "Instructions and memory saved.", "Generation controls saved.", "attached += 1", "Attachment removed."]));
check("tree chat organization and controls exist", includesAll(files.app, ["normalizeFolders", "renderFolderTree", "data-duplicate-chat", "data-archive-chat", "data-move-chat"]));
check("workspace agent is explicit, read-only, trace-visible, and fail-closed", includesAll(files.app, ["showDirectoryPicker({ mode: \"read\" })", "Workspace Agent Mode", "workspaceTraceForModel", "WORKSPACE_ALLOWED_TOOLS", "Workspace Agent Mode will not guess", "no full files", "workspace.select", "resetWorkspaceSession", "disconnectWorkspaceHandle"]));
check("workspace worker inspects binaries in a worker with wasm signal", includesAll(files.worker, ["detectFormat", "PE/COFF", "ELF", "Mach-O", "WebAssembly.validate", "hexdump", "sha256"]));
check("service worker caches only app shell assets and preview install assets", includesAll(files.serviceWorker, ["modeltab-shell-v38", "SHELL", "url.origin !== self.location.origin", "event.request.method !== \"GET\"", "caches.open(CACHE_NAME)", "icon-512.png", "screenshot.png"]));
check("PWA manifest remains local-first with richer install metadata",
  manifest.id === "./" &&
  manifest.display === "standalone" &&
  manifest.start_url === "./" &&
  manifest.scope === "./" &&
  ["productivity", "utilities", "developer"].every((category) => manifest.categories?.includes(category)) &&
  ["./icons/icon.svg", "./icons/icon-192.png", "./icons/icon-512.png"].every((src) => manifest.icons?.some((icon) => icon.src === src)) &&
  manifest.screenshots?.some((screenshot) => screenshot.src === "./screenshot.png" && screenshot.sizes === "1440x1000"));
check("README documents no-install, BYOK, providers, CORS, local file, PWA install, privacy, and testing", includesAll(files.readme, ["no-install", "local-first BYOK", "OpenAI-compatible", "Gemini", "Direct browser calls require", "install the PWA", "Privacy And Data Model", "Local And Static Hosting", "Quality Gates"]));
check("adoption surfaces include sponsor, bundled cleaner, screenshot, and MIT license", includesAll(`${files.html}\n${files.readme}`, ["https://github.com/sponsors/shfqrkhn?o=esb", "tools/ai-studio-cleaner", "screenshot.png", "MIT"]) && includesAll(files.license, ["MIT License", "Permission is hereby granted"]));

const failed = checks.filter((item) => !item.ok);
if (failed.length) {
  for (const item of failed) console.error(`FAIL ${item.name}`);
  process.exit(1);
}

for (const item of checks) console.log(`PASS ${item.name}`);
