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
  zipPolicy: read("docs/REPO_ZIP_POLICY.md"),
  evidenceReceipt: read("docs/EVIDENCE_RECEIPT.md"),
  license: read("LICENSE"),
  cleanerHtml: read("tools/ai-studio-cleaner/index.html")
};
const manifest = JSON.parse(files.manifest);

const checks = [];

function check(name, condition) {
  checks.push({ name, ok: Boolean(condition) });
}

function includesAll(source, values) {
  return values.every((value) => source.includes(value));
}

check("no JS popup APIs in app shell or bundled cleaner", !/\b(alert|confirm|prompt)\s*\(/.test(`${files.html}\n${files.app}\n${files.cleanerHtml}`));
check("CSP blocks inline and third-party script execution", /Content-Security-Policy/.test(files.html) && /script-src 'self'/.test(files.html) && /object-src 'none'/.test(files.html));
check("static local mode skips manifest and service worker", includesAll(files.app, ["function attachManifest()", "if (!isHttpLikePage()) return;", "function registerServiceWorker()", "serviceWorker"]));
check("local-file smoke gate exists", files.readme.includes("npm run test:local-file") && read("tests/modeltab.local-file-smoke.mjs").includes("local-file contract smoke"));
check("runtime notice preserves direct-provider and opt-in workspace contracts", includesAll(files.html, ["AI inference runs on the selected provider endpoint", "Direct chat stores local settings/history and sends only chat", "Optional Workspace Agent Mode can inspect a user-selected folder locally", "explicitly enable trace sharing"]));
check("no horizontal document overflow policy", includesAll(files.css, ["overflow-x: hidden", "minmax(0, 1fr)", ".markdown pre"]));
check("outer panes collapse and overlay consistently", includesAll(files.css, [".app-shell.sidebar-collapsed", ".app-shell.settings-collapsed", "@media (max-width: 1600px)", "@media (max-width: 980px)", "--pane-transition"]));
check("compact next actions keep usable target height", !/\.next-actions button\s*\{[^}]*min-height:\s*30px/s.test(files.css));
check("common cloud provider presets exist", includesAll(files.app, ["OpenRouter", "Groq", "Gemini Native", "OpenAI", "DeepSeek", "MiniMax Global", "Mistral", "Perplexity"]));
check("free/testing provider presets are source-dated and bounded", includesAll(`${files.app}\n${files.readme}`, ["PROVIDER_PRESET_VERSION = 8", "PROVIDER_SOURCE_VERIFIED_AT = \"2026-07-04\"", "PROVIDER_TEST_PROMPT", "PROVIDER_TEST_MAX_OUTPUT_TOKENS = 32", "OpenRouter Free Router", "Cloudflare Workers AI", "free/testing", "Last verified: 2026-07-04", "never enables paid fallback", "cloud prompts as leaving the browser"]));
check("common local OpenAI-compatible presets exist", includesAll(files.app, ["LM Studio Local", "Ollama Local", "llama.cpp Local", "vLLM Local", "LocalAI Local", "Text Generation WebUI Local", "Local Network OpenAI Compatible"]));
check("provider setup normalizes endpoint URLs and migrates model-fetchable presets", includesAll(files.app, ["PROVIDER_PRESET_VERSION = 8", "https://api.perplexity.ai/v1", "normalizeProviderBaseUrl", "/chat/completions", "Provider base URL must start with http:// or https://."]));
check("provider key safety and reserved header guardrails exist", includesAll(files.app, ["delete provider.apiKey", "RESERVED_EXTRA_HEADERS", "authorization", "x-api-key", "sanitizeKeyMap"]));
check("provider test prompt and sanitized status errors exist", includesAll(`${files.html}\n${files.app}`, ["testProviderBtn", "Test Prompt", "testProviderPrompt", "cloudProviderNotice", "redactSensitiveText"]));
check("extra request body cannot override core provider payload fields", includesAll(files.app, ["BLOCKED_EXTRA_BODY_TOP_LEVEL_KEYS", "mergeExtraBody", "Extra request body cannot override core request field"]));
check("normal export excludes keys while backup/import/vault paths protect keys", includesAll(files.app, ["Data exported without API keys", "Full backup exported with encrypted keys", "AES-GCM", "PBKDF2", "keyVault", "RECOVERY_KEY", "Existing local key vault and session keys were cleared", "No session API keys to save"]));
check("prompt, memory, and context surfaces exist", includesAll(files.html, ["systemPromptInput", "memoryInput", "contextInput", "promptLibrarySettingsDetails", "promptLibraryBtn"]));
check("primary interaction feedback and composer labeling exist", includesAll(`${files.html}\n${files.app}`, ["aria-label=\"Message\"", "settingsModelInput", "Message copied.", "Instructions and memory saved.", "Generation controls saved.", "attached += 1", "Attachment removed."]));
check("hidden file inputs keep explicit accessible names", includesAll(files.html, ["aria-label=\"Import ModelTab data file\"", "aria-label=\"Attach image files\""]));
check("tree chat organization and controls exist", includesAll(files.app, ["normalizeFolders", "renderFolderTree", "data-duplicate-chat", "data-archive-chat", "data-move-chat"]));
check("workspace agent is explicit, read-only, trace-visible, and fail-closed", includesAll(files.app, ["showDirectoryPicker({ mode: \"read\" })", "Workspace Agent Mode", "workspaceTraceForModel", "WORKSPACE_ALLOWED_TOOLS", "Workspace Agent Mode will not guess", "no full files", "workspace.select", "resetWorkspaceSession", "disconnectWorkspaceHandle"]));
check("workspace worker inspects binaries in a worker with wasm signal", includesAll(files.worker, ["detectFormat", "PE/COFF", "ELF", "Mach-O", "WebAssembly.validate", "hexdump", "sha256"]));
check("service worker caches app shell, bundled cleaner, and preview install assets", includesAll(files.serviceWorker, ["modeltab-shell-v40", "SHELL", "url.origin !== self.location.origin", "event.request.method !== \"GET\"", "caches.open(CACHE_NAME)", "tools/ai-studio-cleaner/index.html", "icon-512.png", "screenshot.png"]));
check("PWA manifest remains local-first with richer install metadata",
  manifest.id === "./" &&
  manifest.display === "standalone" &&
  manifest.start_url === "./" &&
  manifest.scope === "./" &&
  ["productivity", "utilities", "developer"].every((category) => manifest.categories?.includes(category)) &&
  ["./icons/icon.svg", "./icons/icon-192.png", "./icons/icon-512.png"].every((src) => manifest.icons?.some((icon) => icon.src === src)) &&
  manifest.screenshots?.some((screenshot) => screenshot.src === "./screenshot.png" && screenshot.sizes === "1440x1000"));
check("README documents no-install, BYOK, providers, CORS, local file, PWA install, repository ZIP download, privacy, and testing", includesAll(files.readme, ["no-install", "local-first BYOK", "OpenAI-compatible", "Gemini", "Direct browser calls require", "install the PWA", "Repository ZIP And Download", "current main repository ZIP", "Privacy And Data Model", "Local And Static Hosting", "Quality Gates", "Free / Testing Provider Presets"]) && !files.readme.includes("/releases/latest"));
check("repository ZIP policy bounds BYOK artifacts and provider claims", includesAll(files.zipPolicy, ["static BYOK PWA", "Bundled API keys", "provider payload logs", "Claims that a provider, model list, quota, price, retention policy, or compatible endpoint is current", "normal exports omit keys", "free/testing provider claims include current source links"]));
check("evidence receipt classifies provider and workspace claims", includesAll(files.evidenceReceipt, ["PASS_WITH_LIMITATIONS", "NO_GO", "Free/testing presets", "Workspace Agent Mode", "No bundled keys/backend/telemetry"]));
check("adoption surfaces include sponsor, repository ZIP, bundled cleaner, screenshot, and MIT license", includesAll(`${files.html}\n${files.readme}`, ["https://github.com/sponsors/shfqrkhn?o=esb", "https://github.com/shfqrkhn/ModelTab/archive/refs/heads/main.zip", "tools/ai-studio-cleaner", "screenshot.png", "MIT"]) && includesAll(files.license, ["MIT License", "Permission is hereby granted"]));
check("bundled cleaner is integrated into the ModelTab shell", includesAll(files.html, ["tool-link", "./tools/ai-studio-cleaner/index.html", "Open AI Studio Cleaner in ModelTab"]) && includesAll(files.cleanerHtml, ["modeltab-tool-shell", "modeltab-tool-bar", "modeltab-tool-title", "Native ModelTab workspace tool", "tool-context", "Back to ModelTab", "../../index.html", "modeltab-tool-root"]));
check("bundled cleaner is local-first with no third-party runtime dependencies",
  !/<script\b[^>]*src=["']https?:\/\//i.test(files.cleanerHtml) &&
  !/<link\b(?=[^>]*\brel=["']stylesheet["'])(?=[^>]*\bhref=["']https?:\/\/)[^>]*>/i.test(files.cleanerHtml) &&
  !/(cdn\.tailwindcss|unpkg\.com|ReactDOM|React\.|type=["']text\/babel["']|Babel|fonts\.googleapis|fonts\.gstatic)/i.test(files.cleanerHtml) &&
  !/\b(fetch|XMLHttpRequest|sendBeacon)\s*\(/.test(files.cleanerHtml) &&
  includesAll(files.cleanerHtml, ["parseAIStudioJSON", "generateMarkdown", "Upload AI Studio JSON export", "Generated Markdown"]));

const failed = checks.filter((item) => !item.ok);
if (failed.length) {
  for (const item of failed) console.error(`FAIL ${item.name}`);
  process.exit(1);
}

for (const item of checks) console.log(`PASS ${item.name}`);
