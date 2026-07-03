const STORAGE_KEY = "modeltab-state-v1";
const VAULT_KEY = "modeltab-key-vault-v1";
const LEGACY_STORAGE_KEY = "byok-chat-state-v1";
const LEGACY_VAULT_KEY = "byok-chat-key-vault-v1";
const SUPPORTED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_DRAFT_IMAGE_BYTES = 20 * 1024 * 1024;
const MAX_IMPORT_BYTES = 80 * 1024 * 1024;
const MAX_VAULT_B64_CHARS = 1024 * 1024;
const MAX_JSON_DEPTH = 64;
const MAX_JSON_NODES = 200000;
const MAX_JSON_KEY_LENGTH = 256;
const MAX_ID_LENGTH = 128;
const PROVIDER_PRESET_VERSION = 6;
const PROMPT_LIBRARY_VERSION = 2;
const WORKSPACE_TRACE_LIMIT = 24;
const WORKSPACE_MODEL_TRACE_LIMIT = 8;
const WORKSPACE_ALLOWED_TOOLS = new Set(["list", "search", "inspect"]);
const WORKSPACE_MODEL_TRACE_TOOLS = new Set(["workspace.list", "workspace.search", "workspace.inspect"]);
const WORKSPACE_MAX_LIST_ENTRIES = 220;
const WORKSPACE_MAX_LIST_DEPTH = 5;
const WORKSPACE_MAX_SEARCH_RESULTS = 32;
const WORKSPACE_MAX_SEARCH_FILE_BYTES = 768 * 1024;
const WORKSPACE_INSPECT_CHUNK_BYTES = 1024 * 1024;
const WORKSPACE_MAX_INSPECT_BYTES = WORKSPACE_INSPECT_CHUNK_BYTES * 2;
const WORKSPACE_HASH_CHUNK_BYTES = 1024 * 1024;
const WORKSPACE_MAX_HASH_BYTES = 8 * 1024 * 1024;
const WORKSPACE_INTENT_PATTERN = /\b(workspace|selected folder|project folder|local folder|local files?|codebase|repo|repository)\b|\b(my|this|selected|current|local)\s+(folder|directory|files?|project|workspace|codebase|repo|repository)\b|\b(list|read|search|inspect|analy[sz]e|hash|hexdump|strings)\s+(the\s+)?(files?|folder|directory|workspace|project|repo|repository|binary)\b|(?:^|\s)[\w.-]+\/[\w./-]+\b/i;
const UNSAFE_OBJECT_KEYS = new Set(["__proto__", "prototype", "constructor"]);
const RESERVED_EXTRA_HEADERS = new Set([
  "authorization",
  "proxy-authorization",
  "content-type",
  "cookie",
  "set-cookie",
  "x-goog-api-key",
  "api-key",
  "x-api-key",
  "x-api-token",
  "x-auth-token",
  "x-access-token"
]);
const HEADER_NAME_PATTERN = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/;
const SETTINGS_OVERLAY_MEDIA = window.matchMedia("(max-width: 1600px)");
const SIDEBAR_OVERLAY_MEDIA = window.matchMedia("(max-width: 980px)");

const PROVIDER_PRESETS = [
  {
    id: "openai",
    defaultId: "openai-default",
    name: "OpenAI",
    category: "Cloud",
    type: "openai",
    baseUrl: "https://api.openai.com/v1",
    model: "gpt-4o-mini",
    extraHeaders: "",
    noAuth: false,
    models: ["gpt-4o-mini", "gpt-4o", "o4-mini", "gpt-5.5"]
  },
  {
    id: "azure-openai",
    defaultId: "azure-openai-default",
    name: "Azure OpenAI v1",
    category: "Cloud",
    type: "openai",
    baseUrl: "https://YOUR-RESOURCE.openai.azure.com/openai/v1",
    model: "gpt-4.1-nano",
    extraHeaders: "",
    noAuth: false,
    models: ["gpt-4.1-nano", "gpt-4.1-mini", "gpt-4o-mini"]
  },
  {
    id: "openrouter",
    defaultId: "openrouter-default",
    name: "OpenRouter",
    category: "Cloud",
    type: "openai",
    baseUrl: "https://openrouter.ai/api/v1",
    model: "~openai/gpt-latest",
    extraHeaders: "{\"X-OpenRouter-Title\":\"ModelTab\"}",
    noAuth: false,
    models: ["~openai/gpt-latest", "openrouter/auto", "anthropic/claude-sonnet-4.6", "google/gemini-3.5-flash"]
  },
  {
    id: "groq",
    defaultId: "groq-default",
    name: "Groq",
    category: "Cloud",
    type: "openai",
    baseUrl: "https://api.groq.com/openai/v1",
    model: "openai/gpt-oss-120b",
    extraHeaders: "",
    noAuth: false,
    models: ["openai/gpt-oss-120b", "llama-3.3-70b-versatile"]
  },
  {
    id: "gemini-native",
    defaultId: "gemini-default",
    name: "Gemini Native",
    category: "Cloud",
    type: "gemini",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta",
    model: "gemini-3.5-flash",
    extraHeaders: "",
    noAuth: false,
    models: ["gemini-3.5-flash", "gemini-3.5-pro", "gemini-2.5-flash", "gemini-2.5-pro"]
  },
  {
    id: "gemini-openai",
    defaultId: "gemini-openai-default",
    name: "Gemini OpenAI Compatible",
    category: "Cloud",
    type: "openai",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    model: "gemini-3.5-flash",
    extraHeaders: "",
    noAuth: false,
    models: ["gemini-3.5-flash", "gemini-3.5-pro", "gemini-2.5-flash", "gemini-2.5-pro"]
  },
  {
    id: "deepseek",
    defaultId: "deepseek-default",
    name: "DeepSeek",
    category: "Cloud",
    type: "openai",
    baseUrl: "https://api.deepseek.com",
    model: "deepseek-v4-flash",
    extraHeaders: "",
    noAuth: false,
    models: ["deepseek-v4-flash", "deepseek-v4-pro"]
  },
  {
    id: "minimax",
    defaultId: "minimax-default",
    name: "MiniMax Global",
    category: "Cloud",
    type: "openai",
    baseUrl: "https://api.minimax.io/v1",
    model: "MiniMax-M3",
    extraHeaders: "",
    noAuth: false,
    models: ["MiniMax-M3", "MiniMax-M2.7", "MiniMax-M2.5"]
  },
  {
    id: "minimax-cn",
    defaultId: "minimax-cn-default",
    name: "MiniMax China",
    category: "Cloud",
    type: "openai",
    baseUrl: "https://api.minimaxi.com/v1",
    model: "MiniMax-M3",
    extraHeaders: "",
    noAuth: false,
    models: ["MiniMax-M3", "MiniMax-M2.7", "MiniMax-M2.5"]
  },
  {
    id: "mistral",
    defaultId: "mistral-default",
    name: "Mistral",
    category: "Cloud",
    type: "openai",
    baseUrl: "https://api.mistral.ai/v1",
    model: "mistral-large-latest",
    extraHeaders: "",
    noAuth: false,
    models: ["mistral-large-latest", "mistral-medium-latest", "mistral-small-latest"]
  },
  {
    id: "xai",
    defaultId: "xai-default",
    name: "xAI",
    category: "Cloud",
    type: "openai",
    baseUrl: "https://api.x.ai/v1",
    model: "grok-4.3",
    extraHeaders: "",
    noAuth: false,
    models: ["grok-4.3", "grok-4.3-mini", "latest"]
  },
  {
    id: "together",
    defaultId: "together-default",
    name: "Together AI",
    category: "Cloud",
    type: "openai",
    baseUrl: "https://api.together.ai/v1",
    model: "MiniMaxAI/MiniMax-M3",
    extraHeaders: "",
    noAuth: false,
    models: ["MiniMaxAI/MiniMax-M3", "meta-llama/Llama-3.3-70B-Instruct-Turbo", "Qwen/Qwen3-Coder-480B-A35B-Instruct-FP8"]
  },
  {
    id: "perplexity",
    defaultId: "perplexity-default",
    name: "Perplexity",
    category: "Cloud",
    type: "openai",
    baseUrl: "https://api.perplexity.ai",
    model: "sonar-pro",
    extraHeaders: "",
    noAuth: false,
    models: ["sonar-pro", "sonar", "sonar-reasoning-pro"]
  },
  {
    id: "fireworks",
    defaultId: "fireworks-default",
    name: "Fireworks AI",
    category: "Cloud",
    type: "openai",
    baseUrl: "https://api.fireworks.ai/inference/v1",
    model: "accounts/fireworks/models/llama-v3p3-70b-instruct",
    extraHeaders: "",
    noAuth: false,
    models: ["accounts/fireworks/models/llama-v3p3-70b-instruct", "accounts/fireworks/models/deepseek-r1", "accounts/fireworks/models/kimi-k2-instruct"]
  },
  {
    id: "cerebras",
    defaultId: "cerebras-default",
    name: "Cerebras",
    category: "Cloud",
    type: "openai",
    baseUrl: "https://api.cerebras.ai/v1",
    model: "gpt-oss-120b",
    extraHeaders: "",
    noAuth: false,
    models: ["gpt-oss-120b", "zai-glm-4.7"]
  },
  {
    id: "nvidia-nim",
    defaultId: "nvidia-nim-default",
    name: "NVIDIA NIM Cloud",
    category: "Cloud",
    type: "openai",
    baseUrl: "https://integrate.api.nvidia.com/v1",
    model: "nvidia/NVIDIA-Nemotron-3-Super-120B-A12B-BF16",
    extraHeaders: "",
    noAuth: false,
    models: ["nvidia/NVIDIA-Nemotron-3-Super-120B-A12B-BF16", "moonshotai/kimi-k2.5", "mistralai/mixtral-8x22b-instruct-v0.1"]
  },
  {
    id: "deepinfra",
    defaultId: "deepinfra-default",
    name: "DeepInfra",
    category: "Cloud",
    type: "openai",
    baseUrl: "https://api.deepinfra.com/v1/openai",
    model: "deepseek-ai/DeepSeek-V3",
    extraHeaders: "",
    noAuth: false,
    models: ["deepseek-ai/DeepSeek-V3", "openai/gpt-oss-120b", "meta-llama/Llama-3.3-70B-Instruct"]
  },
  {
    id: "sambanova",
    defaultId: "sambanova-default",
    name: "SambaNova",
    category: "Cloud",
    type: "openai",
    baseUrl: "https://api.sambanova.ai/v1",
    model: "Meta-Llama-3.3-70B-Instruct",
    extraHeaders: "",
    noAuth: false,
    models: ["Meta-Llama-3.3-70B-Instruct", "gpt-oss-120b"]
  },
  {
    id: "dashscope-intl",
    defaultId: "dashscope-intl-default",
    name: "DashScope Qwen Intl",
    category: "Cloud",
    type: "openai",
    baseUrl: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
    model: "qwen3-max",
    extraHeaders: "",
    noAuth: false,
    models: ["qwen3-max", "qwen3-max-preview", "qwen-plus-latest", "qwen3-coder-plus"]
  },
  {
    id: "dashscope-cn",
    defaultId: "dashscope-cn-default",
    name: "DashScope Qwen China",
    category: "Cloud",
    type: "openai",
    baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    model: "qwen3-max",
    extraHeaders: "",
    noAuth: false,
    models: ["qwen3-max", "qwen3-max-preview", "qwen-plus-latest", "qwen3-coder-plus"]
  },
  {
    id: "vercel-ai-gateway",
    defaultId: "vercel-ai-gateway-default",
    name: "Vercel AI Gateway",
    category: "Cloud",
    type: "openai",
    baseUrl: "https://ai-gateway.vercel.sh/v1",
    model: "anthropic/claude-opus-4.8",
    extraHeaders: "",
    noAuth: false,
    models: ["anthropic/claude-opus-4.8", "openai/gpt-5.5", "google/gemini-3.5-flash"]
  },
  {
    id: "lm-studio",
    defaultId: "lm-studio-default",
    name: "LM Studio Local",
    category: "Local",
    type: "openai",
    baseUrl: "http://localhost:1234/v1",
    model: "local-model",
    extraHeaders: "",
    noAuth: true,
    models: ["local-model"]
  },
  {
    id: "ollama",
    defaultId: "ollama-default",
    name: "Ollama Local",
    category: "Local",
    type: "openai",
    baseUrl: "http://localhost:11434/v1",
    model: "llama3.2",
    extraHeaders: "",
    noAuth: true,
    models: ["llama3.2", "llama3.1", "qwen3", "mistral"]
  },
  {
    id: "llama-cpp",
    defaultId: "llama-cpp-default",
    name: "llama.cpp Local",
    category: "Local",
    type: "openai",
    baseUrl: "http://localhost:8080/v1",
    model: "local-model",
    extraHeaders: "",
    noAuth: true,
    models: ["local-model"]
  },
  {
    id: "vllm",
    defaultId: "vllm-default",
    name: "vLLM Local",
    category: "Local",
    type: "openai",
    baseUrl: "http://localhost:8000/v1",
    model: "local-model",
    extraHeaders: "",
    noAuth: true,
    models: ["local-model"]
  },
  {
    id: "localai",
    defaultId: "localai-default",
    name: "LocalAI Local",
    category: "Local",
    type: "openai",
    baseUrl: "http://localhost:8080/v1",
    model: "local-model",
    extraHeaders: "",
    noAuth: true,
    models: ["local-model"]
  },
  {
    id: "nvidia-nim-local",
    defaultId: "nvidia-nim-local-default",
    name: "NVIDIA NIM Local",
    category: "Local",
    type: "openai",
    baseUrl: "http://localhost:8000/v1",
    model: "local-model",
    extraHeaders: "",
    noAuth: true,
    models: ["local-model", "nvidia/Nemotron-3-Nano-Omni-30B-A3B-Reasoning-NVFP4"]
  },
  {
    id: "text-generation-webui",
    defaultId: "text-generation-webui-default",
    name: "Text Generation WebUI Local",
    category: "Local",
    type: "openai",
    baseUrl: "http://localhost:5000/v1",
    model: "local-model",
    extraHeaders: "",
    noAuth: true,
    models: ["local-model"]
  },
  {
    id: "local-network-openai",
    defaultId: "local-network-openai-default",
    name: "Local Network OpenAI Compatible",
    category: "Local",
    type: "openai",
    baseUrl: "http://192.168.1.100:8080/v1",
    model: "local-model",
    extraHeaders: "",
    noAuth: true,
    models: ["local-model"]
  }
];

const INTENT_ACTIONS = {
  analyzeImage: {
    label: "Analyze image",
    instruction: "Analyze the attached image(s). Call out key details, likely meaning, risks, and useful next actions."
  },
  extractImage: {
    label: "Extract text",
    instruction: "Extract all readable text from the attached image(s), then summarize the important points."
  },
  summarize: {
    label: "Summarize",
    instruction: "Summarize this clearly in concise bullets, preserving the important details and decisions."
  },
  explain: {
    label: "Explain",
    instruction: "Explain this step by step for a technical but busy reader. Include only useful context."
  },
  draft: {
    label: "Draft reply",
    instruction: "Draft a polished response that is concise, specific, and ready to send."
  },
  compare: {
    label: "Compare",
    instruction: "Compare the options, tradeoffs, risks, and best recommendation."
  },
  plan: {
    label: "Plan",
    instruction: "Turn this into a prioritized execution plan with checkpoints, risks, and next actions."
  },
  concise: {
    label: "Make concise",
    instruction: "Rewrite this to be shorter, clearer, and higher signal without losing necessary nuance."
  },
  risks: {
    label: "Find risks",
    instruction: "Review this adversarially. List material risks, weak assumptions, missing checks, and the smallest useful fixes."
  },
  nextSteps: {
    label: "Next steps",
    instruction: "Turn the prior answer into concrete next steps in execution order."
  }
};

const DEFAULT_PROMPT_LIBRARY = [
  {
    id: "prompt-summarize",
    name: "Summarize High Signal",
    kind: "prompt",
    tags: "summary, analysis",
    favorite: true,
    content: "Summarize this in high-signal bullets. Preserve decisions, risks, numbers, names, dates, and next actions.\n\n{{content}}"
  },
  {
    id: "prompt-explain",
    name: "Explain Clearly",
    kind: "prompt",
    tags: "explain, teaching",
    content: "Explain {{topic}} clearly for a smart but busy reader. Use practical examples and remove filler."
  },
  {
    id: "prompt-devils-advocate",
    name: "Devil's Advocate",
    kind: "prompt",
    tags: "critique, risks",
    favorite: true,
    content: "Review this adversarially. Find material gaps, weak assumptions, edge cases, hidden costs, and the smallest fixes worth making.\n\n{{content}}"
  },
  {
    id: "prompt-action-plan",
    name: "Action Plan",
    kind: "prompt",
    tags: "planning, execution",
    content: "Turn this into a prioritized execution plan with owner-ready steps, dependencies, risks, and validation checks.\n\n{{goal}}"
  },
  {
    id: "prompt-draft-reply",
    name: "Draft Reply",
    kind: "prompt",
    tags: "writing, communication",
    content: "Draft a concise, polished reply. Keep it specific, warm, and ready to send.\n\nContext:\n{{context}}"
  },
  {
    id: "prompt-code-review",
    name: "Code Review",
    kind: "prompt",
    tags: "code, review",
    content: "Review this like a senior engineer. Prioritize correctness bugs, regressions, security/privacy risks, missing tests, and maintainability issues.\n\n{{code_or_diff}}"
  },
  {
    id: "prompt-prompt-improver",
    name: "Improve Prompt",
    kind: "prompt",
    tags: "prompting, meta",
    content: "Rewrite this prompt to be clearer, more reliable, and easier for an AI to execute. Preserve intent and remove ambiguity.\n\n{{prompt}}"
  },
  {
    id: "prompt-token-efficient",
    name: "Token Efficient Answer",
    kind: "prompt",
    tags: "tokens, concise",
    favorite: true,
    content: "Answer with maximum token efficiency: give only decision-critical facts, omit filler, use compact bullets when useful, and include no redundant caveats.\n\n{{task}}"
  },
  {
    id: "prompt-compress-context",
    name: "Compress Context",
    kind: "prompt",
    tags: "tokens, compression",
    content: "Compress this into reusable context for a future AI chat. Preserve constraints, decisions, facts, open questions, and next actions. Remove noise.\n\n{{content}}"
  },
  {
    id: "system-concise",
    name: "Concise Operator",
    kind: "system",
    tags: "default, concise",
    favorite: true,
    content: "You are concise, accurate, and practical. Ask only when missing information blocks a safe answer. Prefer direct answers, clear assumptions, and actionable next steps."
  },
  {
    id: "system-token-efficient",
    name: "Token Efficient Operator",
    kind: "system",
    tags: "tokens, concise",
    favorite: true,
    content: "Maximize token efficiency. Prefer short direct answers, compact bullets, no filler, no repeated caveats, and no unnecessary restatement. Preserve correctness and required nuance."
  },
  {
    id: "system-senior-engineer",
    name: "Senior Engineer",
    kind: "system",
    tags: "code, architecture",
    content: "You are a pragmatic senior software engineer. Prioritize correctness, security, maintainability, accessible UX, and narrow changes. Verify claims before presenting them."
  },
  {
    id: "system-product-critic",
    name: "Product Critic",
    kind: "system",
    tags: "product, ux",
    content: "Act as Product, UX, QA, Security, and Architecture critic. Find user pain, missing workflows, unsafe assumptions, overbuilt parts, and the smallest improvements with high leverage."
  }
];

const LEGACY_PRESET_DEFAULTS = {
  "openai-default": {
    name: "OpenAI Compatible",
    model: "gpt-4.1-mini",
    extraHeaders: ""
  },
  "gemini-default": {
    name: "Gemini Native",
    model: "gemini-2.5-flash",
    extraHeaders: ""
  }
};

const DEFAULT_STATE = {
  activeConversationId: "",
  activeFolderId: "",
  activeProviderId: "openai-default",
  sidebarCollapsed: false,
  settingsCollapsed: false,
  providerPresetVersion: PROVIDER_PRESET_VERSION,
  promptLibraryVersion: PROMPT_LIBRARY_VERSION,
  promptLibrary: defaultPromptLibrary(),
  drafts: {},
  folders: [],
  showArchived: false,
  workspace: {
    enabled: false,
    shareTrace: false,
    folderName: "",
    trace: []
  },
  settings: {
    systemPrompt: "You are concise, accurate, and token-efficient. Ask only when missing information blocks a safe answer. Prefer direct answers and compact structure.",
    memory: "",
    temperature: 0.7,
    topP: 1,
    maxTokens: 2048,
    maxInputTokens: 6000,
    recentTurns: 12,
    autoTrim: true,
    historyImages: false,
    stream: true,
    jsonMode: false,
    grounding: false,
    extraBody: ""
  },
  providers: defaultProviders(),
  conversations: []
};

const $ = (id) => document.getElementById(id);
const dom = {
  addProviderBtn: $("addProviderBtn"),
  addPresetBtn: $("addPresetBtn"),
  archiveToggleBtn: $("archiveToggleBtn"),
  attachBtn: $("attachBtn"),
  attachmentTray: $("attachmentTray"),
  autoTrimInput: $("autoTrimInput"),
  appShell: document.querySelector(".app-shell"),
  chatMeta: $("chatMeta"),
  chatTitleInput: $("chatTitleInput"),
  clearMemoryBtn: $("clearMemoryBtn"),
  clearVaultBtn: $("clearVaultBtn"),
  closeSettingsBtn: $("closeSettingsBtn"),
  contextInput: $("contextInput"),
  conversationList: $("conversationList"),
  deleteChatBtn: $("deleteChatBtn"),
  deleteProviderBtn: $("deleteProviderBtn"),
  exportBackupBtn: $("exportBackupBtn"),
  exportBtn: $("exportBtn"),
  exportDataBtn: $("exportDataBtn"),
  extraBodyInput: $("extraBodyInput"),
  fetchModelsBtn: $("fetchModelsBtn"),
  groundingInput: $("groundingInput"),
  imageInput: $("imageInput"),
  importBtn: $("importBtn"),
  importDataBtn: $("importDataBtn"),
  importInput: $("importInput"),
  intentActions: $("intentActions"),
  jsonModeInput: $("jsonModeInput"),
  maxTokensInput: $("maxTokensInput"),
  maxInputTokensInput: $("maxInputTokensInput"),
  memoryInput: $("memoryInput"),
  messageList: $("messageList"),
  modelInput: $("modelInput"),
  modelList: $("modelList"),
  newChatBtn: $("newChatBtn"),
  newFolderBtn: $("newFolderBtn"),
  nextActions: $("nextActions"),
  promptApplySystemBtn: $("promptApplySystemBtn"),
  promptContentInput: $("promptContentInput"),
  promptDeleteBtn: $("promptDeleteBtn"),
  promptFavoriteInput: $("promptFavoriteInput"),
  promptInput: $("promptInput"),
  promptInsertBtn: $("promptInsertBtn"),
  promptKindInput: $("promptKindInput"),
  promptLibraryBtn: $("promptLibraryBtn"),
  promptLibrarySelect: $("promptLibrarySelect"),
  promptLibrarySettingsDetails: $("promptLibrarySettingsDetails"),
  promptNameInput: $("promptNameInput"),
  promptNewBtn: $("promptNewBtn"),
  promptQuickPanel: $("promptQuickPanel"),
  promptSaveBtn: $("promptSaveBtn"),
  promptSearchInput: $("promptSearchInput"),
  promptTagsInput: $("promptTagsInput"),
  providerBaseInput: $("providerBaseInput"),
  providerAdvancedDetails: $("providerAdvancedDetails"),
  recentTurnsInput: $("recentTurnsInput"),
  providerHeadersInput: $("providerHeadersInput"),
  providerKeyInput: $("providerKeyInput"),
  providerNameInput: $("providerNameInput"),
  providerNoAuthInput: $("providerNoAuthInput"),
  providerPresetHelp: $("providerPresetHelp"),
  providerPresetSelect: $("providerPresetSelect"),
  providerSelect: $("providerSelect"),
  providerStatus: $("providerStatus"),
  providerTypeInput: $("providerTypeInput"),
  readinessDetail: $("readinessDetail"),
  readinessTitle: $("readinessTitle"),
  runtimeNotice: $("runtimeNotice"),
  saveControlsBtn: $("saveControlsBtn"),
  saveDraftPromptBtn: $("saveDraftPromptBtn"),
  saveInstructionsBtn: $("saveInstructionsBtn"),
  saveProviderBtn: $("saveProviderBtn"),
  saveVaultBtn: $("saveVaultBtn"),
  searchInput: $("searchInput"),
  sendBtn: $("sendBtn"),
  settingsBtn: $("settingsBtn"),
  settingsPanel: $("settingsPanel"),
  settingsProviderSelect: $("settingsProviderSelect"),
  sidebar: document.querySelector(".sidebar"),
  sidebarToggle: $("sidebarToggle"),
  stopBtn: $("stopBtn"),
  streamInput: $("streamInput"),
  systemPromptInput: $("systemPromptInput"),
  temperatureInput: $("temperatureInput"),
  historyImagesInput: $("historyImagesInput"),
  topPInput: $("topPInput"),
  toastRegion: $("toastRegion"),
  unlockVaultBtn: $("unlockVaultBtn"),
  vaultPassphraseInput: $("vaultPassphraseInput"),
  workspaceCapability: $("workspaceCapability"),
  workspaceClearTraceBtn: $("workspaceClearTraceBtn"),
  workspaceEnableInput: $("workspaceEnableInput"),
  workspaceFileSelect: $("workspaceFileSelect"),
  workspaceForgetBtn: $("workspaceForgetBtn"),
  workspaceInspectBtn: $("workspaceInspectBtn"),
  workspaceListBtn: $("workspaceListBtn"),
  workspacePathInput: $("workspacePathInput"),
  workspaceSearchBtn: $("workspaceSearchBtn"),
  workspaceSearchInput: $("workspaceSearchInput"),
  workspaceSelectBtn: $("workspaceSelectBtn"),
  workspaceSettingsDetails: $("workspaceSettingsDetails"),
  workspaceShareTraceInput: $("workspaceShareTraceInput"),
  workspaceStatus: $("workspaceStatus"),
  workspaceTrace: $("workspaceTrace"),
  workspaceTraceFilterInput: $("workspaceTraceFilterInput"),
  wipeDataBtn: $("wipeDataBtn")
};

let state = loadState();
let sessionKeys = {};
let draftAttachments = [];
let activeRequest = null;
let draftSaveTimer = null;
let pendingConfirm = null;
let toastTimer = null;
let pendingPromptTemplate = null;
let workspaceDirectoryHandle = null;
let workspaceFileEntries = [];
let workspaceTraceFilter = "";
let workspaceWorker = null;
let workspaceWorkerJobs = new Map();
let workspaceWorkerJobId = 0;

init();

function init() {
  if (!state.conversations.length) createConversation(false);
  if (!state.activeConversationId) state.activeConversationId = state.conversations[0].id;
  attachManifest();
  registerEvents();
  registerRecoveryHandlers();
  renderAll();
  syncOverlayState();
  saveState();
  registerServiceWorker();
}

function registerEvents() {
  dom.newChatBtn.addEventListener("click", () => {
    saveDraftForActiveChat();
    createConversation();
    closeMobileSidebar();
  });
  dom.newFolderBtn.addEventListener("click", addFolder);
  dom.archiveToggleBtn.addEventListener("click", toggleArchiveView);
  dom.conversationList.addEventListener("click", handleConversationTreeClick);
  dom.conversationList.addEventListener("change", handleConversationTreeChange);
  dom.toastRegion.addEventListener("click", handleToastClick);
  dom.searchInput.addEventListener("input", renderConversationList);
  dom.providerSelect.addEventListener("change", () => {
    state.activeProviderId = dom.providerSelect.value;
    const provider = activeProvider();
    if (provider) dom.modelInput.value = provider.model || "";
    saveState();
    syncSettingsForm();
    renderMeta();
    renderSelfCheck();
  });
  dom.modelInput.addEventListener("change", () => {
    const provider = activeProvider();
    if (provider) {
      provider.model = dom.modelInput.value.trim();
      saveState();
      renderMeta();
      renderSelfCheck();
    }
  });
  dom.chatTitleInput.addEventListener("change", () => {
    const chat = activeConversation();
    if (!chat) return;
    chat.title = dom.chatTitleInput.value.trim() || "Untitled chat";
    chat.updatedAt = new Date().toISOString();
    saveState();
    renderConversationList();
  });
  dom.settingsBtn.addEventListener("click", toggleSettingsPanel);
  dom.closeSettingsBtn.addEventListener("click", () => closeSettings({ collapse: true, restoreFocus: true }));
  dom.sidebarToggle.addEventListener("click", toggleSidebar);
  document.addEventListener("pointerdown", closeOverlayFromPointer);
  dom.sendBtn.addEventListener("click", sendPrompt);
  dom.stopBtn.addEventListener("click", stopGeneration);
  dom.intentActions.addEventListener("click", applyIntentAction);
  dom.promptQuickPanel.addEventListener("click", insertQuickPrompt);
  dom.promptLibraryBtn.addEventListener("click", openPromptLibrary);
  dom.saveDraftPromptBtn.addEventListener("click", saveDraftAsPrompt);
  dom.importBtn.addEventListener("click", () => dom.importInput.click());
  dom.attachBtn.addEventListener("click", () => dom.imageInput.click());
  dom.promptInput.addEventListener("input", queueDraftSave);
  dom.promptInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendPrompt();
    }
  });
  dom.imageInput.addEventListener("change", handleImages);
  dom.addProviderBtn.addEventListener("click", addProvider);
  dom.addPresetBtn.addEventListener("click", addProviderPreset);
  dom.providerPresetSelect.addEventListener("change", renderPresetHelp);
  dom.saveProviderBtn.addEventListener("click", saveProviderFromForm);
  dom.deleteProviderBtn.addEventListener("click", deleteProvider);
  dom.settingsProviderSelect.addEventListener("change", () => {
    state.activeProviderId = dom.settingsProviderSelect.value;
    saveState();
    renderProviderSelectors();
    syncSettingsForm();
    renderMeta();
  });
  dom.providerTypeInput.addEventListener("change", syncNoAuthAvailability);
  dom.providerBaseInput.addEventListener("change", inferProviderFromBaseUrl);
  dom.fetchModelsBtn.addEventListener("click", fetchModels);
  dom.providerKeyInput.addEventListener("input", () => {
    const provider = activeProvider();
    if (!provider) return;
    const key = dom.providerKeyInput.value.trim();
    if (key) {
      sessionKeys[provider.id] = key;
    } else {
      delete sessionKeys[provider.id];
    }
    renderSelfCheck();
  });
  dom.saveInstructionsBtn.addEventListener("click", saveInstructions);
  dom.clearMemoryBtn.addEventListener("click", () => {
    state.settings.memory = "";
    dom.memoryInput.value = "";
    saveState();
  });
  dom.promptSearchInput.addEventListener("input", renderPromptLibrary);
  dom.promptLibrarySelect.addEventListener("change", syncPromptForm);
  dom.promptNewBtn.addEventListener("click", newPromptDraft);
  dom.promptSaveBtn.addEventListener("click", savePromptFromForm);
  dom.promptDeleteBtn.addEventListener("click", deleteSelectedPrompt);
  dom.promptInsertBtn.addEventListener("click", insertSelectedPrompt);
  dom.promptApplySystemBtn.addEventListener("click", applySelectedSystemPrompt);
  dom.saveControlsBtn.addEventListener("click", saveControls);
  dom.unlockVaultBtn.addEventListener("click", unlockVault);
  dom.saveVaultBtn.addEventListener("click", saveVault);
  dom.clearVaultBtn.addEventListener("click", clearVault);
  dom.workspaceEnableInput.addEventListener("change", toggleWorkspaceMode);
  dom.workspaceShareTraceInput.addEventListener("change", toggleWorkspaceTraceSharing);
  dom.workspaceSelectBtn.addEventListener("click", selectWorkspaceFolder);
  dom.workspaceForgetBtn.addEventListener("click", forgetWorkspaceFolder);
  dom.workspaceFileSelect.addEventListener("change", selectWorkspaceFilePath);
  dom.workspaceTraceFilterInput.addEventListener("input", filterWorkspaceTrace);
  dom.workspaceListBtn.addEventListener("click", () => runWorkspaceTool("list"));
  dom.workspaceSearchBtn.addEventListener("click", () => runWorkspaceTool("search"));
  dom.workspaceInspectBtn.addEventListener("click", () => runWorkspaceTool("inspect"));
  dom.workspaceClearTraceBtn.addEventListener("click", clearWorkspaceTrace);
  dom.deleteChatBtn.addEventListener("click", deleteActiveChat);
  dom.wipeDataBtn.addEventListener("click", wipeLocalData);
  dom.exportBtn.addEventListener("click", exportData);
  dom.exportDataBtn.addEventListener("click", exportData);
  dom.exportBackupBtn.addEventListener("click", exportFullBackup);
  dom.importDataBtn.addEventListener("click", () => dom.importInput.click());
  dom.importInput.addEventListener("change", importData);
  dom.nextActions.addEventListener("click", handleNextAction);
  window.addEventListener("online", renderSelfCheck);
  window.addEventListener("offline", renderSelfCheck);
  window.addEventListener("keydown", handleGlobalKeydown);
  window.addEventListener("beforeunload", saveDraftForActiveChat);
  registerMediaListener(SETTINGS_OVERLAY_MEDIA, syncOverlayState);
  registerMediaListener(SIDEBAR_OVERLAY_MEDIA, syncOverlayState);
}

function loadState() {
  try {
    migrateLegacyStorage();
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return normalizeState(structuredClone(DEFAULT_STATE));
    const parsed = JSON.parse(raw);
    assertSafeObjectKeys(parsed);
    return normalizeState({
      ...structuredClone(DEFAULT_STATE),
      ...parsed,
      providerPresetVersion: presetVersionOf(parsed.providerPresetVersion),
      promptLibraryVersion: presetVersionOf(parsed.promptLibraryVersion),
      settings: { ...DEFAULT_STATE.settings, ...(parsed.settings || {}) },
      promptLibrary: Array.isArray(parsed.promptLibrary) && parsed.promptLibrary.length ? parsed.promptLibrary : structuredClone(DEFAULT_STATE.promptLibrary),
      folders: Array.isArray(parsed.folders) ? parsed.folders : [],
      workspace: { ...DEFAULT_STATE.workspace, ...(parsed.workspace || {}) },
      providers: Array.isArray(parsed.providers) && parsed.providers.length ? parsed.providers : structuredClone(DEFAULT_STATE.providers),
      conversations: Array.isArray(parsed.conversations) ? parsed.conversations : []
    });
  } catch {
    return normalizeState(structuredClone(DEFAULT_STATE));
  }
}

function migrateLegacyStorage() {
  if (!localStorage.getItem(STORAGE_KEY) && localStorage.getItem(LEGACY_STORAGE_KEY)) {
    localStorage.setItem(STORAGE_KEY, localStorage.getItem(LEGACY_STORAGE_KEY));
  }
  if (!localStorage.getItem(VAULT_KEY) && localStorage.getItem(LEGACY_VAULT_KEY)) {
    localStorage.setItem(VAULT_KEY, localStorage.getItem(LEGACY_VAULT_KEY));
  }
}

function normalizeState(nextState) {
  nextState.providers = (Array.isArray(nextState.providers) && nextState.providers.length ? nextState.providers : structuredClone(DEFAULT_STATE.providers))
    .filter((provider) => provider && typeof provider === "object")
    .map((provider) => ({
      id: safeId(provider.id),
      name: String(provider.name || "Provider"),
      type: provider.type === "gemini" ? "gemini" : "openai",
      baseUrl: String(provider.baseUrl || ""),
      model: String(provider.model || ""),
      extraHeaders: safeExtraHeaders(provider.extraHeaders),
      noAuth: provider.type !== "gemini" && Boolean(provider.noAuth),
      presetId: typeof provider.presetId === "string" ? provider.presetId : ""
    }));
  nextState.providers = dedupeById(nextState.providers);
  if (Number(nextState.providerPresetVersion || 0) < PROVIDER_PRESET_VERSION) {
    ensureMissingProviderPresets(nextState);
    nextState.providerPresetVersion = PROVIDER_PRESET_VERSION;
  }
  nextState.promptLibrary = normalizePromptLibrary(nextState.promptLibrary);
  nextState.folders = normalizeFolders(nextState.folders);
  if (Number(nextState.promptLibraryVersion || 0) < PROMPT_LIBRARY_VERSION) {
    ensureMissingPromptPresets(nextState);
    nextState.promptLibraryVersion = PROMPT_LIBRARY_VERSION;
  }
  nextState.conversations = (Array.isArray(nextState.conversations) ? nextState.conversations : [])
    .filter((chat) => chat && typeof chat === "object")
    .map((chat) => ({
      id: safeId(chat.id),
      title: String(chat.title || "Untitled chat"),
      context: String(chat.context || ""),
      folderId: folderExists(nextState.folders, chat.folderId) ? String(chat.folderId) : "",
      archivedAt: typeof chat.archivedAt === "string" ? chat.archivedAt : "",
      createdAt: String(chat.createdAt || new Date().toISOString()),
      updatedAt: String(chat.updatedAt || chat.createdAt || new Date().toISOString()),
      messages: Array.isArray(chat.messages) ? chat.messages.map(normalizeMessage).filter(Boolean) : []
    }));
  nextState.conversations = dedupeById(nextState.conversations);
  nextState.drafts = nextState.drafts && typeof nextState.drafts === "object" && !Array.isArray(nextState.drafts)
    ? Object.fromEntries(
      Object.entries(nextState.drafts)
        .filter(([id]) => isSafeObjectKey(id))
        .map(([id, value]) => [String(id), String(value || "")])
    )
    : {};
  nextState.workspace = normalizeWorkspace(nextState.workspace);
  nextState.settings = normalizeSettings(nextState.settings);
  if (!nextState.providers.length) nextState.providers = structuredClone(DEFAULT_STATE.providers);
  if (!nextState.providers.some((provider) => provider.id === nextState.activeProviderId)) {
    nextState.activeProviderId = nextState.providers[0].id;
  }
  nextState.activeFolderId = folderExists(nextState.folders, nextState.activeFolderId) ? String(nextState.activeFolderId) : "";
  nextState.showArchived = Boolean(nextState.showArchived);
  nextState.sidebarCollapsed = Boolean(nextState.sidebarCollapsed);
  nextState.settingsCollapsed = Boolean(nextState.settingsCollapsed);
  if (!nextState.conversations.length) {
    const now = new Date().toISOString();
    nextState.conversations.push({ id: uid(), title: "New chat", context: "", createdAt: now, updatedAt: now, messages: [] });
  }
  if (!nextState.conversations.some((chat) => chat.id === nextState.activeConversationId)) {
    nextState.activeConversationId = nextState.conversations[0].id;
  }
  return nextState;
}

function normalizeSettings(settings = {}) {
  return {
    ...DEFAULT_STATE.settings,
    ...settings,
    systemPrompt: String(settings.systemPrompt || DEFAULT_STATE.settings.systemPrompt),
    memory: String(settings.memory || ""),
    temperature: clampNumber(settings.temperature, 0, 2, DEFAULT_STATE.settings.temperature),
    topP: clampNumber(settings.topP, 0, 1, DEFAULT_STATE.settings.topP),
    maxTokens: Math.max(1, Math.floor(numberOrDefault(settings.maxTokens, DEFAULT_STATE.settings.maxTokens))),
    maxInputTokens: Math.max(512, Math.floor(numberOrDefault(settings.maxInputTokens, DEFAULT_STATE.settings.maxInputTokens))),
    recentTurns: Math.max(1, Math.floor(numberOrDefault(settings.recentTurns, DEFAULT_STATE.settings.recentTurns))),
    autoTrim: settings.autoTrim !== false,
    historyImages: Boolean(settings.historyImages),
    stream: settings.stream !== false,
    jsonMode: Boolean(settings.jsonMode),
    grounding: Boolean(settings.grounding),
    extraBody: typeof settings.extraBody === "string" ? settings.extraBody : ""
  };
}

function normalizeWorkspace(workspace = {}) {
  return {
    enabled: Boolean(workspace.enabled),
    shareTrace: Boolean(workspace.shareTrace),
    folderName: String(workspace.folderName || ""),
    trace: Array.isArray(workspace.trace)
      ? workspace.trace.map(normalizeWorkspaceTrace).filter(Boolean).slice(-WORKSPACE_TRACE_LIMIT)
      : []
  };
}

function normalizeWorkspaceTrace(entry) {
  if (!entry || typeof entry !== "object") return null;
  return {
    id: safeId(entry.id),
    createdAt: String(entry.createdAt || new Date().toISOString()),
    tool: compact(String(entry.tool || "workspace.tool"), 80),
    input: compact(String(entry.input || ""), 240),
    output: compactWorkspaceOutput(entry.output, 4000),
    ok: entry.ok !== false
  };
}

function compactWorkspaceOutput(value, length) {
  const text = compactWhitespace(value);
  return text.length > length ? `${text.slice(0, Math.max(0, length - 1))}…` : text;
}

function normalizeMessage(message) {
  if (!message || typeof message !== "object") return null;
  return {
    id: safeId(message.id),
    role: message.role === "user" ? "user" : "assistant",
    content: String(message.content || ""),
    attachments: Array.isArray(message.attachments) ? message.attachments.filter(isSafeAttachment) : [],
    provider: message.provider ? String(message.provider) : undefined,
    model: message.model ? String(message.model) : undefined,
    error: Boolean(message.error),
    createdAt: String(message.createdAt || new Date().toISOString())
  };
}

function normalizePromptLibrary(library) {
  const items = (Array.isArray(library) && library.length ? library : defaultPromptLibrary())
    .filter((item) => item && typeof item === "object")
    .map(normalizePromptItem)
    .filter(Boolean);
  return dedupeById(items);
}

function normalizeFolders(items) {
  const folders = dedupeById((Array.isArray(items) ? items : [])
    .filter((folder) => folder && typeof folder === "object")
    .map((folder) => ({
      id: safeId(folder.id),
      name: compact(String(folder.name || "Folder").trim() || "Folder", 60),
      parentId: isSafeObjectKey(folder.parentId) ? String(folder.parentId) : "",
      expanded: folder.expanded !== false,
      createdAt: String(folder.createdAt || new Date().toISOString()),
      updatedAt: String(folder.updatedAt || folder.createdAt || new Date().toISOString())
    })));
  const ids = new Set(folders.map((folder) => folder.id));
  for (const folder of folders) {
    if (folder.parentId === folder.id || !ids.has(folder.parentId) || folderHasAncestor(folders, folder.parentId, folder.id)) {
      folder.parentId = "";
    }
  }
  return folders;
}

function folderExists(folders, id) {
  return Boolean(id) && folders.some((folder) => folder.id === id);
}

function folderHasAncestor(folders, startId, targetId) {
  let currentId = startId;
  const seen = new Set();
  while (currentId) {
    if (currentId === targetId || seen.has(currentId)) return true;
    seen.add(currentId);
    currentId = folders.find((folder) => folder.id === currentId)?.parentId || "";
  }
  return false;
}

function normalizePromptItem(item) {
  const content = String(item.content || "").trim();
  const name = String(item.name || "").trim();
  if (!content || !name) return null;
  return {
    id: safeId(item.id),
    name,
    kind: item.kind === "system" ? "system" : "prompt",
    tags: normalizeTags(item.tags),
    content,
    favorite: Boolean(item.favorite),
    builtin: Boolean(item.builtin),
    createdAt: String(item.createdAt || new Date().toISOString()),
    updatedAt: String(item.updatedAt || item.createdAt || new Date().toISOString())
  };
}

function ensureMissingPromptPresets(nextState) {
  const existing = new Set(nextState.promptLibrary.map((item) => item.id));
  for (const item of defaultPromptLibrary()) {
    if (!existing.has(item.id)) nextState.promptLibrary.push(item);
  }
}

function normalizeTags(tags) {
  const raw = Array.isArray(tags) ? tags.join(",") : String(tags || "");
  return uniqueStrings(raw.split(/[,\s]+/).map((tag) => tag.trim().toLowerCase())).join(", ");
}

function dedupeById(items) {
  const seen = new Set();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function isSafeAttachment(attachment) {
  const type = String(attachment?.type || "");
  const size = Number(attachment?.size || 0);
  const dataUrl = String(attachment?.dataUrl || "");
  const prefix = `data:${type};base64,`;
  const encoded = dataUrl.startsWith(prefix) ? dataUrl.slice(prefix.length) : "";
  return attachment
    && typeof attachment === "object"
    && SUPPORTED_IMAGE_TYPES.has(type)
    && Number.isFinite(size)
    && size > 0
    && size <= MAX_IMAGE_BYTES
    && encoded.length > 0
    && encoded.length <= Math.ceil(size * 4 / 3) + 4096
    && /^[A-Za-z0-9+/]+={0,2}$/.test(encoded);
}

function saveState() {
  const clean = structuredClone(state);
  clean.providers.forEach((provider) => delete provider.apiKey);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
  } catch {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stripAttachmentPayloads(clean)));
      setStatus("Local storage was full. ModelTab preserved text state and skipped stored image payloads.", true);
    } catch {
      setStatus("Local storage failed. Export data before closing this tab.", true);
    }
  }
}

function stripAttachmentPayloads(cleanState) {
  const slim = structuredClone(cleanState);
  for (const chat of slim.conversations || []) {
    for (const message of chat.messages || []) {
      message.attachments = (message.attachments || []).map((attachment) => ({
        id: attachment.id,
        name: attachment.name,
        type: attachment.type,
        size: attachment.size,
        omitted: true
      }));
    }
  }
  return slim;
}

function createConversation(render = true) {
  if (state.showArchived) state.showArchived = false;
  const now = new Date().toISOString();
  const chat = {
    id: uid(),
    title: "New chat",
    context: "",
    folderId: state.activeFolderId || "",
    archivedAt: "",
    createdAt: now,
    updatedAt: now,
    messages: []
  };
  state.conversations.unshift(chat);
  state.activeConversationId = chat.id;
  saveState();
  if (render) renderAll();
  return chat;
}

function activeConversation() {
  return state.conversations.find((chat) => chat.id === state.activeConversationId) || visibleConversations()[0] || state.conversations[0];
}

function activeProvider() {
  return state.providers.find((provider) => provider.id === state.activeProviderId) || state.providers[0];
}

function renderAll() {
  renderProviderSelectors();
  syncSettingsForm();
  renderConversationList();
  renderMessages();
  restoreActiveDraft();
  renderPromptLibrary();
  renderMeta();
  renderAttachments();
  renderRuntimeNotice();
  renderWorkspaceMode();
  renderSelfCheck();
  syncOverlayState();
}

function renderRuntimeNotice() {
  if (location.protocol === "file:") {
    dom.runtimeNotice.innerHTML = `<strong>Local file mode.</strong> ModelTab is running from this folder. Provider calls still depend on the selected endpoint allowing direct browser requests. Workspace folder picking requires a browser that exposes the File System Access API in this context.`;
    return;
  }
  const workspaceNote = state.workspace.enabled
    ? ` Workspace Agent Mode is opt-in; local inspection runs in-browser and ${state.workspace.shareTrace ? "visible trace snippets may be sent" : "trace sharing is off"}.`
    : "";
  dom.runtimeNotice.innerHTML = `<strong>ModelTab direct mode.</strong> AI inference runs on the selected provider endpoint. This app stores local settings/history and sends chat context only to the provider you choose.${workspaceNote}`;
}

function renderWorkspaceMode() {
  const supported = workspaceApiSupported();
  const connected = Boolean(workspaceDirectoryHandle);
  dom.workspaceEnableInput.checked = state.workspace.enabled;
  dom.workspaceShareTraceInput.checked = state.workspace.shareTrace;
  dom.workspaceSelectBtn.disabled = !supported;
  dom.workspaceForgetBtn.disabled = !connected;
  dom.workspaceListBtn.disabled = !workspaceReady();
  dom.workspaceSearchBtn.disabled = !workspaceReady();
  dom.workspaceInspectBtn.disabled = !workspaceReady();
  dom.workspaceShareTraceInput.disabled = !state.workspace.enabled;
  dom.workspaceCapability.textContent = workspaceCapabilityText(supported);
  dom.workspaceStatus.textContent = workspaceStatusText();
  dom.workspaceStatus.classList.toggle("error", state.workspace.enabled && !connected);
  dom.workspaceTraceFilterInput.value = workspaceTraceFilter;
  renderWorkspaceFileTree();
  renderWorkspaceTrace();
}

function workspaceCapabilityText(supported = workspaceApiSupported()) {
  if (supported) {
    return "Supported here. Select Folder opens an explicit browser permission prompt. Handles are session-only, read-only, and must be reselected after reload.";
  }
  if (location.protocol === "file:") {
    return "Folder picking is unavailable in this file:// context. Use a Chromium browser over HTTPS or localhost for Workspace Agent tools; ordinary chat still works from this file.";
  }
  if (!window.isSecureContext) {
    return "Folder picking usually requires a secure context such as HTTPS or localhost. Serve ModelTab from one of those origins to enable Workspace Agent tools.";
  }
  return "This browser does not expose the File System Access API. Use a recent Chromium-based browser for Workspace Agent folder tools.";
}

function workspaceStatusText() {
  if (!state.workspace.enabled) return "Workspace Agent Mode is off.";
  if (!workspaceApiSupported()) return "Workspace Agent Mode needs File System Access API support.";
  if (!workspaceDirectoryHandle) return state.workspace.folderName
    ? `Folder "${state.workspace.folderName}" is remembered by name only. Select it again to reconnect this session.`
    : "No folder selected. Select a project folder to enable read-only tools.";
  return `Connected read-only folder: ${workspaceDirectoryHandle.name || state.workspace.folderName || "selected folder"}.`;
}

function renderWorkspaceTrace() {
  const query = workspaceTraceFilter.toLowerCase();
  const entries = query
    ? state.workspace.trace.filter((entry) => `${entry.tool} ${entry.input} ${entry.output} ${entry.ok ? "ok" : "failed"}`.toLowerCase().includes(query))
    : state.workspace.trace;
  if (!entries.length) {
    dom.workspaceTrace.innerHTML = `<div class="trace-empty">${state.workspace.trace.length ? "No trace entries match the filter." : "No workspace tool activity yet."}</div>`;
    return;
  }
  dom.workspaceTrace.innerHTML = entries
    .slice()
    .reverse()
    .map((entry) => `<article class="trace-entry ${entry.ok ? "" : "error"}">
      <div><strong>${escapeHtml(entry.tool)}</strong><span>${escapeHtml(shortTime(entry.createdAt))}</span></div>
      ${entry.input ? `<p>${escapeHtml(entry.input)}</p>` : ""}
      <pre>${escapeHtml(entry.output)}</pre>
    </article>`)
    .join("");
}

function renderWorkspaceFileTree() {
  if (!workspaceFileEntries.length) {
    dom.workspaceFileSelect.innerHTML = `<option value="">Run List Files to populate file navigation</option>`;
    dom.workspaceFileSelect.disabled = true;
    return;
  }
  dom.workspaceFileSelect.disabled = false;
  dom.workspaceFileSelect.innerHTML = workspaceFileEntries
    .map((entry) => `<option value="${escapeAttr(entry.path)}" ${entry.kind === "directory" ? "disabled" : ""}>${escapeHtml(`${"  ".repeat(entry.depth)}${entry.kind === "directory" ? "▸ " : "  "}${entry.path}`)}</option>`)
    .join("");
}

function shortTime(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function renderProviderSelectors() {
  const options = state.providers
    .map((provider) => `<option value="${escapeAttr(provider.id)}">${escapeHtml(provider.name)} · ${provider.type}</option>`)
    .join("");
  dom.providerSelect.innerHTML = options;
  dom.settingsProviderSelect.innerHTML = options;
  dom.providerPresetSelect.innerHTML = PROVIDER_PRESETS
    .map((preset) => `<option value="${escapeAttr(preset.id)}">${escapeHtml(presetLabel(preset))}</option>`)
    .join("");
  dom.providerSelect.value = state.activeProviderId;
  dom.settingsProviderSelect.value = state.activeProviderId;
  const provider = activeProvider();
  const activePreset = presetForProvider(provider);
  if (activePreset) dom.providerPresetSelect.value = activePreset.id;
  dom.modelInput.value = provider?.model || "";
  renderModelSuggestions(provider);
  renderPresetHelp();
}

function renderPresetHelp() {
  const preset = PROVIDER_PRESETS.find((item) => item.id === dom.providerPresetSelect.value);
  if (!preset) {
    dom.providerPresetHelp.textContent = "";
    return;
  }
  const auth = preset.noAuth ? "no key" : "API key";
  const models = modelSuggestionsFromPreset(preset).slice(0, 3).join(", ");
  dom.providerPresetHelp.textContent = `${preset.category || "Provider"} · ${preset.type === "gemini" ? "Gemini native" : "OpenAI-compatible"} · ${auth} · ${preset.baseUrl}${models ? ` · ${models}` : ""}`;
}

function renderModelSuggestions(provider = activeProvider(), fetchedModels = []) {
  const preset = presetForProvider(provider);
  const models = uniqueStrings([
    provider?.model,
    ...fetchedModels,
    ...modelSuggestionsFromPreset(preset)
  ]);
  dom.modelList.innerHTML = models.map((model) => `<option value="${escapeAttr(model)}"></option>`).join("");
}

function presetForProvider(provider) {
  if (!provider) return null;
  return PROVIDER_PRESETS.find((preset) => preset.id === provider.presetId || preset.defaultId === provider.id) || null;
}

function providerPresetForBaseUrl(baseUrl) {
  const url = parseUrl(baseUrl);
  if (!url) return null;
  const normalized = normalizeEndpointUrl(url.href);
  const exact = PROVIDER_PRESETS.find((preset) => normalizeEndpointUrl(preset.baseUrl) === normalized);
  if (exact) return exact;
  if (url.hostname.endsWith(".openai.azure.com") && url.pathname.startsWith("/openai/v1")) return presetById("azure-openai");
  if (url.hostname === "generativelanguage.googleapis.com") {
    return url.pathname.includes("/openai") ? presetById("gemini-openai") : presetById("gemini-native");
  }
  if (isLoopbackHost(url.hostname)) {
    if (url.port === "1234") return presetById("lm-studio");
    if (url.port === "11434") return presetById("ollama");
    if (url.port === "5000") return presetById("text-generation-webui");
    if (url.port === "8000") return presetById("vllm");
    if (url.port === "8080") return presetById("llama-cpp");
  }
  if (isPrivateNetworkHost(url.hostname)) return presetById("local-network-openai");
  return null;
}

function presetById(id) {
  return PROVIDER_PRESETS.find((preset) => preset.id === id) || null;
}

function presetLabel(preset) {
  return `${preset.category || "Provider"} - ${preset.name}`;
}

function modelSuggestionsFromPreset(preset) {
  return Array.isArray(preset?.models) ? preset.models.filter(Boolean).map(String) : [];
}

function uniqueStrings(values) {
  return [...new Set(values.filter(Boolean).map(String))];
}

function renderPromptLibrary() {
  const query = dom.promptSearchInput.value.trim().toLowerCase();
  const prompts = filteredPromptLibrary(query);
  dom.promptLibrarySelect.innerHTML = prompts
    .map((item) => `<option value="${escapeAttr(item.id)}">${escapeHtml(promptLibraryLabel(item))}</option>`)
    .join("");
  if (!prompts.some((item) => item.id === dom.promptLibrarySelect.value) && prompts[0]) {
    dom.promptLibrarySelect.value = prompts[0].id;
  }
  syncPromptForm();
}

function filteredPromptLibrary(query) {
  const items = query
    ? state.promptLibrary.filter((item) => `${item.name} ${item.kind} ${item.tags} ${item.content}`.toLowerCase().includes(query))
    : state.promptLibrary;
  return [...items].sort(promptSort);
}

function syncPromptForm() {
  const item = selectedPrompt();
  if (!item) {
    dom.promptNameInput.value = "";
    dom.promptKindInput.value = "prompt";
    dom.promptTagsInput.value = "";
    dom.promptContentInput.value = "";
    dom.promptFavoriteInput.checked = false;
    return;
  }
  dom.promptNameInput.value = item.name;
  dom.promptKindInput.value = item.kind;
  dom.promptTagsInput.value = item.tags || "";
  dom.promptContentInput.value = item.content;
  dom.promptFavoriteInput.checked = Boolean(item.favorite);
}

function selectedPrompt() {
  return state.promptLibrary.find((item) => item.id === dom.promptLibrarySelect.value) || null;
}

function promptLibraryLabel(item) {
  const marker = item.kind === "system" ? "System" : "Prompt";
  return `${item.favorite ? "★ " : ""}${marker} - ${item.name}${item.tags ? ` · ${item.tags}` : ""}`;
}

function promptSort(a, b) {
  return Number(Boolean(b.favorite)) - Number(Boolean(a.favorite))
    || String(b.updatedAt || "").localeCompare(String(a.updatedAt || ""))
    || a.name.localeCompare(b.name);
}

function normalizeEndpointUrl(value) {
  const url = parseUrl(value);
  if (!url) return "";
  return `${url.protocol}//${url.host}${url.pathname.replace(/\/+$/, "")}`;
}

function renderConversationList() {
  const query = dom.searchInput.value.trim().toLowerCase();
  dom.archiveToggleBtn.setAttribute("aria-pressed", String(Boolean(state.showArchived)));
  dom.archiveToggleBtn.textContent = state.showArchived ? "Active Chats" : "Archived";
  const html = [
    renderFolderTree("", query, 0),
    renderFolderlessChats(query, 0)
  ].filter(Boolean).join("");
  dom.conversationList.innerHTML = html || `<p class="conversation-empty">${state.showArchived ? "No archived chats." : "No chats match this search."}</p>`;
}

function renderFolderTree(parentId, query, depth) {
  return foldersByParent(parentId)
    .map((folder) => renderFolderNode(folder, query, depth))
    .filter(Boolean)
    .join("");
}

function renderFolderNode(folder, query, depth) {
  const childFolders = renderFolderTree(folder.id, query, depth + 1);
  const chats = renderChatsForFolder(folder.id, query, depth + 1);
  const visibleCount = visibleConversations().filter((chat) => chat.folderId === folder.id).length;
  const matchesFolder = !query || folder.name.toLowerCase().includes(query);
  if (query && !matchesFolder && !childFolders && !chats) return "";
  const expanded = query ? true : folder.expanded !== false;
  return `<section class="conversation-folder" data-folder-node="${escapeAttr(folder.id)}">
    <div class="folder-row ${state.activeFolderId === folder.id ? "active" : ""} ${depthClass(depth)}">
      ${renderButton({ className: "folder-toggle", attrs: { "data-toggle-folder": folder.id, "aria-label": `${expanded ? "Collapse" : "Expand"} ${folder.name}` }, html: expanded ? "▾" : "▸" })}
      ${renderButton({ className: "folder-select", attrs: { "data-select-folder": folder.id, "aria-label": `Open folder ${folder.name}` }, html: `<span>${escapeHtml(folder.name)}</span> <span class="conversation-folder-count">${visibleCount}</span>` })}
      ${renderButton({ className: "folder-action", attrs: { "data-new-subfolder": folder.id, "aria-label": `New subfolder in ${folder.name}` }, html: "+" })}
      ${renderButton({ className: "folder-action", attrs: { "data-delete-folder": folder.id, "aria-label": `Delete folder ${folder.name}` }, html: "×" })}
    </div>
    ${expanded ? `<div class="conversation-group">${childFolders}${chats}</div>` : ""}
  </section>`;
}

function renderFolderlessChats(query, depth) {
  return renderChatsForFolder("", query, depth);
}

function renderChatsForFolder(folderId, query, depth) {
  return visibleConversations()
    .filter((chat) => (chat.folderId || "") === folderId)
    .filter((chat) => chatMatchesQuery(chat, query))
    .sort(chatSort)
    .map((chat) => renderConversationItem(chat, depth))
    .join("");
}

function renderConversationItem(chat, depth) {
  const last = chat.messages.at(-1)?.content || "No messages yet";
  const title = chat.title || "Untitled chat";
  return `<article class="conversation-item ${chat.id === state.activeConversationId ? "active" : ""} ${depthClass(depth)}">
    ${renderButton({
      className: "conversation-open",
      attrs: { "data-open-chat": chat.id, "aria-label": `Open chat ${title}` },
      html: `<strong>${escapeHtml(title)}</strong><span>${escapeHtml(compact(last, 92))}</span>`
    })}
    <details class="conversation-controls">
      <summary aria-label="Chat controls for ${escapeAttr(title)}">⋯</summary>
      <div class="conversation-menu">
        ${renderButton({ className: "small-btn", attrs: { "data-duplicate-chat": chat.id }, label: "Duplicate" })}
        ${renderButton({ className: "small-btn", attrs: { "data-archive-chat": chat.id }, label: chat.archivedAt ? "Restore" : "Archive" })}
        ${renderButton({ className: "danger-btn", attrs: { "data-delete-chat": chat.id }, label: "Delete" })}
        <select data-move-chat="${escapeAttr(chat.id)}" aria-label="Move ${escapeAttr(title)}">
          ${folderOptions(chat.folderId || "")}
        </select>
      </div>
    </details>
  </article>`;
}

function folderOptions(selectedId = "") {
  const options = [`<option value=""${selectedId ? "" : " selected"}>Root</option>`];
  for (const folder of flattenFolders()) {
    options.push(`<option value="${escapeAttr(folder.id)}"${folder.id === selectedId ? " selected" : ""}>${escapeHtml(`${"  ".repeat(folder.depth)}${folder.name}`)}</option>`);
  }
  return options.join("");
}

function flattenFolders(parentId = "", depth = 0) {
  return foldersByParent(parentId).flatMap((folder) => [
    { ...folder, depth },
    ...flattenFolders(folder.id, depth + 1)
  ]);
}

function foldersByParent(parentId) {
  return state.folders
    .filter((folder) => (folder.parentId || "") === parentId)
    .sort((a, b) => a.name.localeCompare(b.name));
}

function visibleConversations() {
  return state.conversations.filter((chat) => Boolean(chat.archivedAt) === Boolean(state.showArchived));
}

function chatMatchesQuery(chat, query) {
  if (!query) return true;
  return `${chat.title} ${chat.messages.map((message) => message.content).join(" ")}`.toLowerCase().includes(query);
}

function chatSort(a, b) {
  return String(b.updatedAt || "").localeCompare(String(a.updatedAt || ""));
}

function depthClass(depth) {
  return `depth-${Math.min(Math.max(Number(depth) || 0, 0), 6)}`;
}

function handleConversationTreeClick(event) {
  const target = event.target.closest("[data-open-chat], [data-select-folder], [data-toggle-folder], [data-new-subfolder], [data-delete-folder], [data-duplicate-chat], [data-archive-chat], [data-delete-chat]");
  if (!target) return;
  if (target.dataset.openChat) return openConversation(target.dataset.openChat);
  if (target.dataset.selectFolder) return selectFolder(target.dataset.selectFolder);
  if (target.dataset.toggleFolder) return toggleFolder(target.dataset.toggleFolder);
  if (target.dataset.newSubfolder) return addFolder(target.dataset.newSubfolder);
  if (target.dataset.deleteFolder) return deleteFolder(target.dataset.deleteFolder);
  if (target.dataset.duplicateChat) return duplicateChat(target.dataset.duplicateChat);
  if (target.dataset.archiveChat) return toggleChatArchive(target.dataset.archiveChat);
  if (target.dataset.deleteChat) return deleteChatById(target.dataset.deleteChat);
}

function handleConversationTreeChange(event) {
  const target = event.target.closest("[data-move-chat]");
  if (!target) return;
  moveChat(target.dataset.moveChat, target.value);
}

function openConversation(chatId) {
  const chat = state.conversations.find((item) => item.id === chatId);
  if (!chat) return;
  saveDraftForActiveChat();
  state.activeConversationId = chat.id;
  state.activeFolderId = chat.folderId || "";
  state.showArchived = Boolean(chat.archivedAt);
  saveState();
  renderAll();
  closeMobileSidebar();
}

function selectFolder(folderId) {
  if (!folderExists(state.folders, folderId)) return;
  state.activeFolderId = folderId;
  const firstChat = visibleConversations().filter((chat) => chat.folderId === folderId).sort(chatSort)[0];
  if (firstChat) state.activeConversationId = firstChat.id;
  saveState();
  renderAll();
}

function toggleFolder(folderId) {
  const folder = state.folders.find((item) => item.id === folderId);
  if (!folder) return;
  folder.expanded = !folder.expanded;
  folder.updatedAt = new Date().toISOString();
  saveState();
  renderConversationList();
}

function addFolder(parentId = state.activeFolderId || "") {
  const safeParentId = folderExists(state.folders, parentId) ? parentId : "";
  const folder = {
    id: uid(),
    name: nextFolderName(safeParentId),
    parentId: safeParentId,
    expanded: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  state.folders.push(folder);
  state.activeFolderId = folder.id;
  if (safeParentId) {
    const parent = state.folders.find((item) => item.id === safeParentId);
    if (parent) parent.expanded = true;
  }
  saveState();
  renderConversationList();
  setStatus(`Folder created: ${folder.name}`);
}

function nextFolderName(parentId) {
  const names = new Set(state.folders.filter((folder) => (folder.parentId || "") === parentId).map((folder) => folder.name));
  let index = 1;
  let name = "New folder";
  while (names.has(name)) {
    index += 1;
    name = `New folder ${index}`;
  }
  return name;
}

function deleteFolder(folderId) {
  const folder = state.folders.find((item) => item.id === folderId);
  if (!folder) return;
  requireSecondClick(`delete-folder-${folderId}`, `Click delete again to remove folder "${folder.name}". Chats and subfolders move up one level.`, () => {
    const parentId = folder.parentId || "";
    for (const chat of state.conversations) {
      if (chat.folderId === folder.id) chat.folderId = parentId;
    }
    for (const child of state.folders) {
      if (child.parentId === folder.id) child.parentId = parentId;
    }
    state.folders = state.folders.filter((item) => item.id !== folder.id);
    if (state.activeFolderId === folder.id) state.activeFolderId = parentId;
    saveState();
    renderAll();
    setStatus(`Folder removed: ${folder.name}`);
  });
}

function moveChat(chatId, folderId) {
  const chat = state.conversations.find((item) => item.id === chatId);
  if (!chat) return;
  const safeFolderId = folderExists(state.folders, folderId) ? folderId : "";
  chat.folderId = safeFolderId;
  chat.updatedAt = new Date().toISOString();
  state.activeFolderId = safeFolderId;
  saveState();
  renderConversationList();
  setStatus(`Moved "${chat.title}" to ${safeFolderId ? state.folders.find((folder) => folder.id === safeFolderId)?.name : "Root"}.`);
}

function duplicateChat(chatId) {
  const chat = state.conversations.find((item) => item.id === chatId);
  if (!chat) return;
  const now = new Date().toISOString();
  const copy = {
    ...structuredClone(chat),
    id: uid(),
    title: `${chat.title || "Untitled chat"} copy`,
    archivedAt: "",
    createdAt: now,
    updatedAt: now,
    messages: structuredClone(chat.messages || []).map((message) => ({ ...message, id: uid() }))
  };
  state.showArchived = false;
  state.conversations.unshift(copy);
  state.activeConversationId = copy.id;
  state.activeFolderId = copy.folderId || "";
  saveState();
  renderAll();
  setStatus(`Duplicated "${chat.title}".`);
}

function toggleChatArchive(chatId) {
  const chat = state.conversations.find((item) => item.id === chatId);
  if (!chat) return;
  const restoring = Boolean(chat.archivedAt);
  chat.archivedAt = restoring ? "" : new Date().toISOString();
  chat.updatedAt = new Date().toISOString();
  state.showArchived = !restoring;
  state.activeConversationId = chat.id;
  state.activeFolderId = chat.folderId || "";
  saveState();
  renderAll();
  setStatus(restoring ? `Restored "${chat.title}".` : `Archived "${chat.title}".`);
}

function deleteChatById(chatId) {
  const chat = state.conversations.find((item) => item.id === chatId);
  if (!chat) return;
  requireSecondClick(`delete-chat-${chatId}`, `Click delete again to permanently remove "${chat.title}".`, () => {
    state.conversations = state.conversations.filter((item) => item.id !== chat.id);
    delete state.drafts?.[chat.id];
    selectFallbackConversation();
    saveState();
    renderAll();
    setStatus(`Deleted "${chat.title}".`);
  });
}

function selectFallbackConversation() {
  const fallback = visibleConversations().find((chat) => chat.id !== state.activeConversationId)
    || state.conversations.find((chat) => !chat.archivedAt)
    || state.conversations[0];
  if (fallback) {
    state.activeConversationId = fallback.id;
    state.activeFolderId = fallback.folderId || "";
    state.showArchived = Boolean(fallback.archivedAt);
  } else {
    createConversation(false);
  }
}

function toggleArchiveView() {
  state.showArchived = !state.showArchived;
  const first = visibleConversations().sort(chatSort)[0];
  if (first) {
    state.activeConversationId = first.id;
    state.activeFolderId = first.folderId || "";
  }
  saveState();
  renderAll();
  setStatus(state.showArchived ? "Showing archived chats." : "Showing active chats.");
}

function renderMessages() {
  const chat = activeConversation();
  dom.chatTitleInput.value = chat?.title || "";
  if (dom.contextInput) dom.contextInput.value = chat?.context || "";
  if (!chat?.messages.length) {
    dom.messageList.innerHTML = $("emptyStateTemplate").innerHTML;
    return;
  }
  dom.messageList.innerHTML = chat.messages
    .map((message, index) => renderMessage(message, index))
    .join("");
  dom.messageList.querySelectorAll("[data-copy-index]").forEach((button) => {
    button.addEventListener("click", () => copyMessage(Number(button.dataset.copyIndex)));
  });
  dom.messageList.querySelectorAll("[data-retry-index]").forEach((button) => {
    button.addEventListener("click", () => regenerateFrom(Number(button.dataset.retryIndex)));
  });
  dom.messageList.querySelectorAll("[data-edit-index]").forEach((button) => {
    button.addEventListener("click", () => editFrom(Number(button.dataset.editIndex)));
  });
  dom.messageList.scrollTop = dom.messageList.scrollHeight;
}

function renderMessage(message, index) {
  const attachments = renderAttachmentStrip(message.attachments || []);
  const actionButtons = [
    { label: "Copy", attrs: { "data-copy-index": index } },
    message.role === "assistant" ? { label: "Regenerate", attrs: { "data-retry-index": index } } : null,
    message.role === "user" ? { label: "Edit", attrs: { "data-edit-index": index } } : null
  ].filter(Boolean);
  const actions = `<div class="message-actions">${renderButtons(actionButtons)}</div>`;
  return `<article class="message ${escapeAttr(message.role)} ${message.error ? "error" : ""}">
    <div class="role">${escapeHtml(message.role)}</div>
    <div class="bubble">
      ${attachments}
      <div class="markdown">${renderMarkdown(message.content || "")}</div>
      ${actions}
    </div>
  </article>`;
}

function renderMeta() {
  const chat = activeConversation();
  const provider = activeProvider();
  const messageCount = chat?.messages.length || 0;
  dom.chatMeta.textContent = `${provider?.name || "No provider"} · ${provider?.model || "No model"} · ${messageCount} message${messageCount === 1 ? "" : "s"}`;
}

function renderSelfCheck() {
  const provider = activeProvider();
  const chat = activeConversation();
  const key = getProviderKey(provider);
  const needsKey = providerNeedsKey(provider);
  const placeholderBaseUrl = hasBaseUrlPlaceholder(provider?.baseUrl);
  const blockedByPageSecurity = httpEndpointBlockedByPageSecurity(provider?.baseUrl);
  const issues = [];
  const actions = [];
  if (!navigator.onLine) issues.push("browser is offline");
  if (!provider?.baseUrl) {
    issues.push("base URL missing");
    actions.push(["base", "Set URL"]);
  } else if (placeholderBaseUrl) {
    issues.push("base URL needs editing");
    actions.push(["base", "Edit URL"]);
  } else if (blockedByPageSecurity) {
    issues.push("HTTP LAN endpoint blocked from HTTPS page");
  }
  if (!provider?.model) {
    issues.push("model missing");
    actions.push(["model", "Set Model"]);
  }
  if (needsKey && !key) {
    issues.push("API key missing");
    actions.push(["key", "Add Key"]);
    actions.push(["local", "Use Local"]);
  }
  if (state.workspace.enabled && !workspaceDirectoryHandle) actions.push(["workspace", "Select Folder"]);
  if (provider?.baseUrl && !placeholderBaseUrl && !blockedByPageSecurity && (!needsKey || key)) actions.push(["models", "Fetch Models"]);
  const draft = state.drafts?.[chat?.id] || "";
  if (draft.trim()) actions.push(["prompt", "Resume Draft"]);
  if (!issues.length) actions.push(["prompt", "Start"]);
  const tokenSummary = chat ? requestTokenSummary(chat) : "";

  const container = dom.readinessTitle?.closest(".readiness");
  if (!container) return;
  container.classList.toggle("error", issues.includes("browser is offline"));
  container.classList.toggle("warning", Boolean(issues.length) && !issues.includes("browser is offline"));
  dom.readinessTitle.textContent = issues.length ? "Setup needs attention" : "Setup ready";
  dom.readinessDetail.textContent = issues.length
    ? `Next: ${issues.join(", ")}.${tokenSummary ? ` ${tokenSummary}` : ""}`
    : `Setup fields are ready. Fetch Models verifies the endpoint. ${tokenSummary ? `${tokenSummary} ` : ""}Chat context goes only to the selected endpoint.`;
  dom.nextActions.innerHTML = renderButtons(
    actions.slice(0, 4).map(([action, label]) => ({ label, attrs: { "data-next-action": action } })),
    "small-btn"
  );
}

function handleNextAction(event) {
  const action = event.target?.dataset?.nextAction;
  if (!action) return;
  if (action === "base") return openSettings(dom.providerBaseInput);
  if (action === "key") return openSettingsSection(dom.providerAdvancedDetails, dom.providerKeyInput);
  if (action === "local") return useLocalProvider();
  if (action === "models") return fetchModels();
  if (action === "model") return focusModelInput();
  if (action === "prompt") return focusPromptInput();
  if (action === "workspace") return openSettingsSection(dom.workspaceSettingsDetails, dom.workspaceSelectBtn);
}

function workspaceApiSupported() {
  return typeof window.showDirectoryPicker === "function";
}

function workspaceReady() {
  return Boolean(state.workspace.enabled && workspaceDirectoryHandle);
}

function toggleWorkspaceMode() {
  state.workspace.enabled = dom.workspaceEnableInput.checked;
  saveState();
  renderRuntimeNotice();
  renderWorkspaceMode();
  renderSelfCheck();
  setStatus(state.workspace.enabled ? "Workspace Agent Mode enabled. Select a folder to use read-only tools." : "Workspace Agent Mode disabled.");
}

function toggleWorkspaceTraceSharing() {
  state.workspace.shareTrace = dom.workspaceShareTraceInput.checked;
  saveState();
  renderRuntimeNotice();
  renderWorkspaceMode();
  setStatus(state.workspace.shareTrace ? "Visible workspace trace will be sent with chat." : "Workspace trace sharing is off.");
}

async function selectWorkspaceFolder() {
  if (!workspaceApiSupported()) {
    setStatus("Workspace folder picking is not available in this browser or page context.", true);
    return;
  }
  try {
    const handle = await window.showDirectoryPicker({ mode: "read" });
    workspaceDirectoryHandle = handle;
    state.workspace.enabled = true;
    state.workspace.folderName = handle.name || "selected folder";
    addWorkspaceTrace("workspace.select", state.workspace.folderName, "Folder selected. Read-only tools are available for this session.");
    saveState();
    renderAll();
    setStatus(`Workspace connected: ${state.workspace.folderName}`);
  } catch (error) {
    if (error?.name !== "AbortError") setStatus(`Workspace selection failed: ${error.message || error}`, true);
  }
}

function forgetWorkspaceFolder() {
  const name = state.workspace.folderName || workspaceDirectoryHandle?.name || "workspace";
  workspaceDirectoryHandle = null;
  workspaceFileEntries = [];
  state.workspace.folderName = "";
  addWorkspaceTrace("workspace.forget", name, "Folder handle forgotten. Re-select a folder to run tools again.");
  saveState();
  renderAll();
  setStatus("Workspace folder forgotten.");
}

function clearWorkspaceTrace() {
  state.workspace.trace = [];
  saveState();
  renderWorkspaceTrace();
  renderRuntimeNotice();
  renderSelfCheck();
  setStatus("Workspace trace cleared.");
}

function selectWorkspaceFilePath() {
  const path = dom.workspaceFileSelect.value;
  if (!path) return;
  dom.workspacePathInput.value = path;
  setStatus(`Workspace path selected: ${path}`);
}

function filterWorkspaceTrace() {
  workspaceTraceFilter = dom.workspaceTraceFilterInput.value.trim();
  renderWorkspaceTrace();
}

async function runWorkspaceTool(tool) {
  if (!WORKSPACE_ALLOWED_TOOLS.has(tool)) {
    const message = "Workspace tool is not allowed.";
    addWorkspaceTrace("workspace.blocked", String(tool || "unknown"), message, false);
    setStatus(message, true);
    return;
  }
  if (!workspaceReady()) {
    setStatus("Select a workspace folder before running tools.", true);
    openSettingsSection(dom.workspaceSettingsDetails, dom.workspaceSelectBtn);
    return;
  }
  try {
    setWorkspaceBusy(true);
    await ensureWorkspaceReadPermission({ prompt: true });
    if (tool === "list") {
      const output = await listWorkspaceFiles();
      addWorkspaceTrace("workspace.list", workspaceRootLabel(), output);
      setStatus("Workspace file list ready.");
    } else if (tool === "search") {
      const query = dom.workspaceSearchInput.value.trim();
      if (!query) throw new Error("Search text is required.");
      const output = await searchWorkspace(query);
      addWorkspaceTrace("workspace.search", query, output);
      setStatus("Workspace search complete.");
    } else if (tool === "inspect") {
      const filePath = dom.workspacePathInput.value.trim();
      if (!filePath) throw new Error("File path is required.");
      const output = await inspectWorkspaceFile(filePath);
      addWorkspaceTrace("workspace.inspect", filePath, output);
      setStatus("Workspace file inspection complete.");
    }
  } catch (error) {
    addWorkspaceTrace(`workspace.${tool}`, workspaceToolInput(tool), error.message || String(error), false);
    setStatus(error.message || String(error), true);
  } finally {
    setWorkspaceBusy(false);
  }
}

function setWorkspaceBusy(busy) {
  if (!busy) {
    renderWorkspaceMode();
    return;
  }
  [dom.workspaceSelectBtn, dom.workspaceForgetBtn, dom.workspaceListBtn, dom.workspaceSearchBtn, dom.workspaceInspectBtn, dom.workspaceClearTraceBtn]
    .forEach((button) => { button.disabled = true; });
}

function workspaceToolInput(tool) {
  if (tool === "search") return dom.workspaceSearchInput.value.trim();
  if (tool === "inspect") return dom.workspacePathInput.value.trim();
  return workspaceRootLabel();
}

function addWorkspaceTrace(tool, input, output, ok = true) {
  state.workspace.trace.push(normalizeWorkspaceTrace({
    id: uid(),
    createdAt: new Date().toISOString(),
    tool,
    input,
    output,
    ok
  }));
  state.workspace.trace = state.workspace.trace.filter(Boolean).slice(-WORKSPACE_TRACE_LIMIT);
  saveState();
  renderWorkspaceTrace();
  renderRuntimeNotice();
  renderSelfCheck();
}

function workspaceRootLabel() {
  return workspaceDirectoryHandle?.name || state.workspace.folderName || "selected folder";
}

async function ensureWorkspaceReadPermission({ prompt = false } = {}) {
  if (!workspaceDirectoryHandle) throw new Error("No live workspace folder is connected. Select Folder again.");
  let permission = await workspaceReadPermissionState();
  try {
    if (permission !== "granted" && prompt && typeof workspaceDirectoryHandle.requestPermission === "function") {
      permission = await workspaceDirectoryHandle.requestPermission({ mode: "read" });
    }
  } catch (error) {
    permission = "denied";
  }
  if (permission !== "granted") {
    disconnectWorkspaceHandle();
    throw new Error("Workspace read permission is not granted. Select Folder again before running tools.");
  }
}

function disconnectWorkspaceHandle() {
  workspaceDirectoryHandle = null;
  workspaceFileEntries = [];
}

async function listWorkspaceFiles() {
  const entries = [];
  const fileEntries = [];
  await walkWorkspaceDirectory(workspaceDirectoryHandle, "", 0, async ({ path: entryPath, handle, depth }) => {
    const entry = { path: entryPath, kind: handle.kind, depth };
    entries.push(`${"  ".repeat(depth)}${handle.kind === "directory" ? "dir " : "file"} ${entryPath}`);
    fileEntries.push(entry);
    return entries.length < WORKSPACE_MAX_LIST_ENTRIES;
  });
  workspaceFileEntries = fileEntries;
  renderWorkspaceFileTree();
  const truncated = entries.length >= WORKSPACE_MAX_LIST_ENTRIES ? `\n...truncated at ${WORKSPACE_MAX_LIST_ENTRIES} entries.` : "";
  return entries.length ? `${entries.join("\n")}${truncated}\n\nDiscovered ${fileEntries.filter((entry) => entry.kind === "file").length} files for the file picker.` : "Workspace folder is empty.";
}

async function searchWorkspace(query) {
  const results = [];
  let searchedTextFiles = 0;
  let skippedLargeFiles = 0;
  let skippedBinaryFiles = 0;
  let skippedUnreadableFiles = 0;
  const needle = query.toLowerCase();
  await walkWorkspaceDirectory(workspaceDirectoryHandle, "", 0, async ({ path: entryPath, handle }) => {
    if (handle.kind !== "file" || results.length >= WORKSPACE_MAX_SEARCH_RESULTS) return results.length < WORKSPACE_MAX_SEARCH_RESULTS;
    let file;
    try {
      file = await handle.getFile();
    } catch {
      skippedUnreadableFiles += 1;
      return true;
    }
    if (file.size > WORKSPACE_MAX_SEARCH_FILE_BYTES) {
      skippedLargeFiles += 1;
      return true;
    }
    let bytes;
    try {
      bytes = new Uint8Array(await file.arrayBuffer());
    } catch {
      skippedUnreadableFiles += 1;
      return true;
    }
    if (!isProbablyText(bytes)) {
      skippedBinaryFiles += 1;
      return true;
    }
    searchedTextFiles += 1;
    const text = new TextDecoder().decode(bytes);
    const lines = text.split(/\r?\n/);
    for (let index = 0; index < lines.length && results.length < WORKSPACE_MAX_SEARCH_RESULTS; index += 1) {
      if (lines[index].toLowerCase().includes(needle)) {
        results.push(`${entryPath}:${index + 1}: ${compact(lines[index], 220)}`);
      }
    }
    return results.length < WORKSPACE_MAX_SEARCH_RESULTS;
  });
  const truncated = results.length >= WORKSPACE_MAX_SEARCH_RESULTS ? `\n...truncated at ${WORKSPACE_MAX_SEARCH_RESULTS} matches.` : "";
  const summary = [
    `Searched ${searchedTextFiles} text file${searchedTextFiles === 1 ? "" : "s"} within the ${formatBytes(WORKSPACE_MAX_SEARCH_FILE_BYTES)} per-file read limit.`,
    skippedLargeFiles ? `Skipped ${skippedLargeFiles} oversized file${skippedLargeFiles === 1 ? "" : "s"}.` : "",
    skippedBinaryFiles ? `Skipped ${skippedBinaryFiles} likely-binary file${skippedBinaryFiles === 1 ? "" : "s"}.` : "",
    skippedUnreadableFiles ? `Skipped ${skippedUnreadableFiles} unreadable file${skippedUnreadableFiles === 1 ? "" : "s"}.` : ""
  ].filter(Boolean).join(" ");
  return results.length ? `${results.join("\n")}${truncated}\n\n${summary}` : `No text matches for "${query}" within read limits.\n\n${summary}`;
}

async function inspectWorkspaceFile(filePath) {
  const handle = await resolveWorkspaceFile(filePath);
  const file = await handle.getFile();
  const sample = await readWorkspaceInspectionSample(file);
  const sha256 = file.size <= WORKSPACE_MAX_HASH_BYTES
    ? await sha256WorkspaceFile(file)
    : `skipped: file exceeds ${formatBytes(WORKSPACE_MAX_HASH_BYTES)} browser safety limit`;
  const analysis = await analyzeWorkspaceBytes({
    name: file.name,
    path: normalizeWorkspacePath(filePath),
    size: file.size,
    type: file.type || "application/octet-stream",
    sha256,
    sampleStrategy: sample.strategy,
    bytes: sample.buffer
  });
  return formatWorkspaceInspection(analysis);
}

async function readWorkspaceInspectionSample(file) {
  if (file.size <= WORKSPACE_MAX_INSPECT_BYTES) {
    return {
      strategy: `full file sample (${formatBytes(file.size)})`,
      buffer: await file.arrayBuffer()
    };
  }
  const headSize = Math.min(WORKSPACE_INSPECT_CHUNK_BYTES, file.size);
  const tailSize = Math.min(WORKSPACE_INSPECT_CHUNK_BYTES, Math.max(0, file.size - headSize));
  const [head, tail] = await Promise.all([
    file.slice(0, headSize).arrayBuffer(),
    tailSize ? file.slice(file.size - tailSize, file.size).arrayBuffer() : new ArrayBuffer(0)
  ]);
  const combined = new Uint8Array(head.byteLength + tail.byteLength);
  combined.set(new Uint8Array(head), 0);
  combined.set(new Uint8Array(tail), head.byteLength);
  return {
    strategy: `chunked sample: first ${formatBytes(head.byteLength)} + last ${formatBytes(tail.byteLength)} of ${formatBytes(file.size)}`,
    buffer: combined.buffer
  };
}

async function sha256WorkspaceFile(file) {
  const buffer = await readWorkspaceFileWithinLimit(file, WORKSPACE_HASH_CHUNK_BYTES);
  return sha256Hex(buffer);
}

async function readWorkspaceFileWithinLimit(file, chunkBytes) {
  if (file.size > WORKSPACE_MAX_HASH_BYTES) {
    throw new Error(`Workspace file exceeds ${formatBytes(WORKSPACE_MAX_HASH_BYTES)} browser safety limit.`);
  }
  const chunks = [];
  let total = 0;
  for (let offset = 0; offset < file.size; offset += chunkBytes) {
    const chunk = await file.slice(offset, Math.min(file.size, offset + chunkBytes)).arrayBuffer();
    chunks.push(new Uint8Array(chunk));
    total += chunk.byteLength;
  }
  const combined = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return combined.buffer;
}

async function walkWorkspaceDirectory(directoryHandle, basePath, depth, visitor) {
  if (depth > WORKSPACE_MAX_LIST_DEPTH) return true;
  const entries = [];
  for await (const [name, handle] of directoryHandle.entries()) entries.push([name, handle]);
  entries.sort(([aName, aHandle], [bName, bHandle]) => {
    if (aHandle.kind !== bHandle.kind) return aHandle.kind === "directory" ? -1 : 1;
    return aName.localeCompare(bName);
  });
  for (const [name, handle] of entries) {
    if (!safeWorkspaceName(name)) continue;
    const entryPath = basePath ? `${basePath}/${name}` : name;
    const shouldContinue = await visitor({ path: entryPath, handle, depth });
    if (shouldContinue === false) return false;
    if (handle.kind === "directory") {
      const nested = await walkWorkspaceDirectory(handle, entryPath, depth + 1, visitor);
      if (nested === false) return false;
    }
  }
  return true;
}

async function resolveWorkspaceFile(filePath) {
  const parts = workspacePathParts(filePath);
  if (!parts.length) throw new Error("File path is required.");
  let directory = workspaceDirectoryHandle;
  for (const part of parts.slice(0, -1)) directory = await directory.getDirectoryHandle(part);
  const handle = await directory.getFileHandle(parts.at(-1));
  if (handle.kind !== "file") throw new Error("Workspace path is not a file.");
  return handle;
}

function workspacePathParts(filePath) {
  return normalizeWorkspacePath(filePath).split("/").filter(Boolean);
}

function normalizeWorkspacePath(filePath) {
  const normalized = String(filePath || "").replaceAll("\\", "/").split("/").filter(Boolean);
  if (normalized.some((part) => !safeWorkspaceName(part))) throw new Error("Workspace path must stay inside the selected folder.");
  return normalized.join("/");
}

function safeWorkspaceName(name) {
  return Boolean(name) && name !== "." && name !== ".." && !/[\\/]/.test(name);
}

function isProbablyText(bytes) {
  const limit = Math.min(bytes.length, 4096);
  if (!limit) return true;
  let suspicious = 0;
  for (let index = 0; index < limit; index += 1) {
    const byte = bytes[index];
    if (byte === 0) return false;
    if (byte < 7 || (byte > 14 && byte < 32)) suspicious += 1;
  }
  return suspicious / limit < 0.02;
}

async function sha256Hex(buffer) {
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function analyzeWorkspaceBytes(payload) {
  return new Promise((resolve, reject) => {
    const worker = getWorkspaceWorker();
    const id = String(++workspaceWorkerJobId);
    workspaceWorkerJobs.set(id, { resolve, reject });
    worker.postMessage({ id, type: "inspect", payload }, [payload.bytes]);
  });
}

function getWorkspaceWorker() {
  if (workspaceWorker) return workspaceWorker;
  workspaceWorker = new Worker("./workspace-worker.js");
  workspaceWorker.addEventListener("message", (event) => {
    const job = workspaceWorkerJobs.get(event.data?.id);
    if (!job) return;
    workspaceWorkerJobs.delete(event.data.id);
    if (event.data.ok) job.resolve(event.data.result);
    else job.reject(new Error(event.data.error || "Workspace worker failed."));
  });
  workspaceWorker.addEventListener("error", (event) => {
    for (const job of workspaceWorkerJobs.values()) job.reject(new Error(event.message || "Workspace worker failed."));
    workspaceWorkerJobs.clear();
  });
  return workspaceWorker;
}

function formatWorkspaceInspection(analysis) {
  return [
    `path: ${analysis.path}`,
    `name: ${analysis.name}`,
    `size: ${formatBytes(analysis.size)}`,
    `mime: ${analysis.type}`,
    `sha256: ${analysis.sha256}`,
    `format: ${analysis.format}`,
    `wasm sandbox: ${analysis.wasmAvailable ? "available" : "not available"}`,
    analysis.details?.length ? `details:\n${analysis.details.map((item) => `- ${item}`).join("\n")}` : "",
    analysis.strings?.length ? `strings:\n${analysis.strings.map((item) => `- ${item}`).join("\n")}` : "",
    analysis.hexdump ? `hexdump:\n${analysis.hexdump}` : ""
  ].filter(Boolean).join("\n");
}

function openSettings(focusTarget = dom.settingsProviderSelect) {
  state.settingsCollapsed = false;
  dom.settingsPanel.classList.add("open");
  saveState();
  syncOverlayState();
  focusSoon(focusTarget);
}

function openSettingsSection(details, focusTarget) {
  if (details) details.open = true;
  openSettings();
  setTimeout(() => {
    details?.scrollIntoView({ block: "nearest" });
    focusTarget?.focus();
  }, 0);
}

function closeSettings({ collapse = false, restoreFocus = false } = {}) {
  if (collapse) {
    state.settingsCollapsed = true;
    saveState();
  }
  dom.settingsPanel.classList.remove("open");
  syncOverlayState();
  if (restoreFocus) focusSoon(dom.settingsBtn);
}

function toggleSettingsPanel() {
  if (SETTINGS_OVERLAY_MEDIA.matches) {
    if (dom.settingsPanel.classList.contains("open")) {
      closeSettings({ collapse: true });
      focusSoon(dom.settingsBtn);
    } else {
      openSettings();
    }
    return;
  }
  const opening = state.settingsCollapsed;
  state.settingsCollapsed = !state.settingsCollapsed;
  dom.settingsPanel.classList.remove("open");
  saveState();
  syncOverlayState();
  if (opening) focusSoon(dom.settingsProviderSelect);
}

function toggleSidebar() {
  if (SIDEBAR_OVERLAY_MEDIA.matches) {
    state.sidebarCollapsed = false;
    const opening = !dom.sidebar.classList.contains("open");
    dom.sidebar.classList.toggle("open");
    saveState();
    syncOverlayState();
    focusSoon(opening ? dom.newChatBtn : dom.sidebarToggle);
    return;
  } else {
    state.sidebarCollapsed = !state.sidebarCollapsed;
    dom.sidebar.classList.remove("open");
  }
  saveState();
  syncOverlayState();
}

function closeOverlays({ restoreFocus = false } = {}) {
  const settingsOpen = dom.settingsPanel.classList.contains("open");
  const sidebarOpen = dom.sidebar.classList.contains("open");
  const activeInSettings = dom.settingsPanel.contains(document.activeElement);
  const activeInSidebar = dom.sidebar.contains(document.activeElement);
  closeSettings();
  closeMobileSidebar();
  syncOverlayState();
  if (restoreFocus) {
    if (activeInSettings || settingsOpen) focusSoon(dom.settingsBtn);
    else if (activeInSidebar || sidebarOpen) focusSoon(dom.sidebarToggle);
  }
}

function closeOverlayFromPointer(event) {
  const clickedSidebar = dom.sidebar.contains(event.target);
  const clickedSettings = dom.settingsPanel.contains(event.target);
  const clickedToggle = dom.sidebarToggle.contains(event.target) || dom.settingsBtn.contains(event.target);
  if (clickedSidebar || clickedSettings || clickedToggle) return;
  if (dom.sidebar.classList.contains("open") || dom.settingsPanel.classList.contains("open")) closeOverlays();
}

function syncOverlayState() {
  const sidebarOpen = dom.sidebar.classList.contains("open");
  const settingsOpen = dom.settingsPanel.classList.contains("open");
  const sidebarCollapsed = state.sidebarCollapsed && !SIDEBAR_OVERLAY_MEDIA.matches;
  const settingsCollapsed = state.settingsCollapsed && !SETTINGS_OVERLAY_MEDIA.matches;
  const sidebarVisible = SIDEBAR_OVERLAY_MEDIA.matches ? sidebarOpen : !sidebarCollapsed;
  const settingsVisible = SETTINGS_OVERLAY_MEDIA.matches ? settingsOpen : !settingsCollapsed;
  dom.appShell.classList.toggle("sidebar-collapsed", sidebarCollapsed);
  dom.appShell.classList.toggle("settings-collapsed", settingsCollapsed);
  dom.sidebar.classList.toggle("collapsed", sidebarCollapsed);
  dom.settingsPanel.classList.toggle("collapsed", settingsCollapsed);
  dom.sidebarToggle.setAttribute("aria-expanded", String(sidebarVisible));
  dom.settingsBtn.setAttribute("aria-expanded", String(settingsVisible));
  dom.closeSettingsBtn.setAttribute("aria-expanded", String(settingsVisible));
  dom.sidebarToggle.title = sidebarVisible ? "Collapse conversations" : "Expand conversations";
  dom.settingsBtn.title = settingsVisible ? "Collapse settings" : "Expand settings";
  syncPanelVisibility(dom.sidebar, (SIDEBAR_OVERLAY_MEDIA.matches && !sidebarOpen) || sidebarCollapsed);
  syncPanelVisibility(dom.settingsPanel, (SETTINGS_OVERLAY_MEDIA.matches && !settingsOpen) || settingsCollapsed);
  document.body.classList.toggle("overlay-open", sidebarOpen || settingsOpen);
}

function syncPanelVisibility(panel, hidden) {
  panel.inert = hidden;
  if (hidden) {
    panel.setAttribute("aria-hidden", "true");
  } else {
    panel.removeAttribute("aria-hidden");
  }
}

function registerMediaListener(media, handler) {
  if (media.addEventListener) {
    media.addEventListener("change", handler);
  } else {
    media.addListener(handler);
  }
}

function focusModelInput() {
  dom.modelInput.focus();
  dom.modelInput.select?.();
}

function focusPromptInput() {
  dom.promptInput.focus();
}

function focusSoon(target) {
  if (!target) return;
  setTimeout(() => {
    if (!document.contains(target) || target.closest?.("[aria-hidden='true']")) return;
    target.focus({ preventScroll: true });
  }, 0);
}

function handleGlobalKeydown(event) {
  const modifier = event.ctrlKey || event.metaKey;
  if (event.key === "Escape") closeOverlays({ restoreFocus: true });
  if (modifier && event.key.toLowerCase() === "k") {
    event.preventDefault();
    dom.searchInput.focus();
  }
  if (modifier && event.key === "Enter") {
    event.preventDefault();
    sendPrompt();
  }
}

function queueDraftSave() {
  updateDraftForActiveChat();
  renderIntentActions();
  renderPromptQuickPanel();
  renderSelfCheck();
  clearTimeout(draftSaveTimer);
  draftSaveTimer = setTimeout(saveState, 250);
}

function saveDraftForActiveChat() {
  updateDraftForActiveChat();
  saveState();
  renderSelfCheck();
}

function updateDraftForActiveChat() {
  const chat = activeConversation();
  if (!chat) return;
  const draft = dom.promptInput.value;
  if (draft) {
    state.drafts[chat.id] = draft;
  } else {
    delete state.drafts[chat.id];
  }
}

function restoreActiveDraft() {
  const chat = activeConversation();
  if (!chat || (document.activeElement === dom.promptInput && dom.promptInput.value)) return;
  dom.promptInput.value = state.drafts?.[chat.id] || "";
}

function registerRecoveryHandlers() {
  window.addEventListener("error", (event) => {
    setStatus(`Runtime fault: ${compact(event.message || "unknown error", 180)}`, true);
    saveState();
    renderSelfCheck();
  });
  window.addEventListener("unhandledrejection", (event) => {
    setStatus(`Async fault: ${compact(event.reason?.message || event.reason || "unknown error", 180)}`, true);
    saveState();
    renderSelfCheck();
  });
}

function syncSettingsForm() {
  const provider = activeProvider();
  if (!provider) return;
  dom.settingsProviderSelect.value = provider.id;
  dom.providerNameInput.value = provider.name || "";
  dom.providerTypeInput.value = provider.type || "openai";
  dom.providerBaseInput.value = provider.baseUrl || "";
  dom.providerKeyInput.value = sessionKeys[provider.id] || "";
  dom.providerNoAuthInput.checked = Boolean(provider.noAuth);
  dom.providerHeadersInput.value = provider.extraHeaders || "";
  dom.systemPromptInput.value = state.settings.systemPrompt || "";
  dom.memoryInput.value = state.settings.memory || "";
  dom.contextInput.value = activeConversation()?.context || "";
  dom.temperatureInput.value = state.settings.temperature;
  dom.topPInput.value = state.settings.topP;
  dom.maxTokensInput.value = state.settings.maxTokens;
  dom.maxInputTokensInput.value = state.settings.maxInputTokens;
  dom.recentTurnsInput.value = state.settings.recentTurns;
  dom.autoTrimInput.checked = Boolean(state.settings.autoTrim);
  dom.historyImagesInput.checked = Boolean(state.settings.historyImages);
  dom.streamInput.value = String(state.settings.stream);
  dom.jsonModeInput.checked = Boolean(state.settings.jsonMode);
  dom.groundingInput.checked = Boolean(state.settings.grounding);
  dom.extraBodyInput.value = state.settings.extraBody || "";
  renderModelSuggestions(provider);
  syncNoAuthAvailability();
}

function syncNoAuthAvailability() {
  const isOpenAICompatible = dom.providerTypeInput.value === "openai";
  dom.providerNoAuthInput.disabled = !isOpenAICompatible;
  if (!isOpenAICompatible) dom.providerNoAuthInput.checked = false;
}

function inferProviderFromBaseUrl() {
  const provider = activeProvider();
  if (!provider) return;
  const baseUrl = dom.providerBaseInput.value.trim();
  if (!baseUrl) return;
  const preset = providerPresetForBaseUrl(baseUrl);
  const genericName = isGenericProviderName(dom.providerNameInput.value);
  if (preset) {
    dom.providerPresetSelect.value = preset.id;
    dom.providerTypeInput.value = preset.type;
    dom.providerHeadersInput.value = dom.providerHeadersInput.value.trim() || preset.extraHeaders;
    dom.providerNoAuthInput.checked = Boolean(preset.noAuth);
    if (genericName) dom.providerNameInput.value = preset.name;
    if (!dom.modelInput.value.trim()) dom.modelInput.value = preset.model;
    provider.presetId = preset.id;
    renderPresetHelp();
    renderModelSuggestions({ ...provider, presetId: preset.id, model: dom.modelInput.value.trim() || preset.model });
    syncNoAuthAvailability();
    if (saveProviderFromForm()) setStatus(`${preset.name} settings detected.`);
    return;
  }
  if (endpointLikelyLocalNoAuth(baseUrl)) {
    dom.providerTypeInput.value = "openai";
    dom.providerNoAuthInput.checked = true;
    if (genericName) dom.providerNameInput.value = "Local Network OpenAI Compatible";
    if (!dom.modelInput.value.trim()) dom.modelInput.value = "local-model";
    syncNoAuthAvailability();
    if (saveProviderFromForm()) setStatus("Local OpenAI-compatible endpoint detected.");
  }
}

function addProvider() {
  const provider = {
    id: uid(),
    name: "Custom OpenAI Compatible",
    type: "openai",
    baseUrl: "https://api.example.com/v1",
    model: "",
    extraHeaders: "",
    noAuth: false
  };
  state.providers.push(provider);
  state.activeProviderId = provider.id;
  saveState();
  renderProviderSelectors();
  syncSettingsForm();
  renderSelfCheck();
}

function addProviderPreset() {
  selectProviderPreset(dom.providerPresetSelect.value);
}

function selectProviderPreset(presetId) {
  const preset = PROVIDER_PRESETS.find((item) => item.id === presetId);
  if (!preset) return;
  const existing = state.providers.find((provider) => provider.presetId === preset.id || provider.id === preset.defaultId);
  const provider = existing || providerFromPreset(preset, preset.defaultId);
  if (!existing) state.providers.push(provider);
  state.activeProviderId = provider.id;
  saveState();
  renderAll();
  setStatus(`${preset.name} preset ${existing ? "selected" : "added"}. ${provider.noAuth ? "No API key is required." : "Add your API key to use it."}`);
}

function useLocalProvider() {
  selectProviderPreset("lm-studio");
  openSettings(dom.providerBaseInput);
  setStatus("LM Studio Local selected. Start LM Studio with CORS enabled, then Fetch Models.");
}

function ensureMissingProviderPresets(nextState) {
  for (const preset of PROVIDER_PRESETS) {
    const existing = nextState.providers.find((provider) => provider.presetId === preset.id || provider.id === preset.defaultId);
    if (existing) {
      reconcilePresetProvider(existing, preset);
      continue;
    }
    nextState.providers.push(providerFromPreset(preset, preset.defaultId));
  }
}

function reconcilePresetProvider(provider, preset) {
  const legacy = LEGACY_PRESET_DEFAULTS[provider.id];
  const wasLegacyDefault = legacy
    && provider.baseUrl === preset.baseUrl
    && provider.name === legacy.name
    && provider.model === legacy.model
    && provider.extraHeaders === legacy.extraHeaders;

  provider.presetId = provider.presetId || preset.id;
  if (wasLegacyDefault) {
    provider.name = preset.name;
    provider.type = preset.type;
    provider.baseUrl = preset.baseUrl;
    provider.model = preset.model;
    provider.extraHeaders = preset.extraHeaders;
    provider.noAuth = Boolean(preset.noAuth);
  }
}

function saveProviderFromForm() {
  const provider = activeProvider();
  if (!provider) return false;
  try {
    parseHeaders(dom.providerHeadersInput.value.trim());
  } catch (error) {
    setStatus(error.message, true);
    return false;
  }
  provider.name = dom.providerNameInput.value.trim() || "Provider";
  provider.type = dom.providerTypeInput.value;
  provider.baseUrl = dom.providerBaseInput.value.trim();
  provider.extraHeaders = dom.providerHeadersInput.value.trim();
  provider.model = dom.modelInput.value.trim() || provider.model || "";
  provider.noAuth = provider.type === "openai" && dom.providerNoAuthInput.checked;
  const key = dom.providerKeyInput.value.trim();
  if (key) {
    sessionKeys[provider.id] = key;
  } else {
    delete sessionKeys[provider.id];
  }
  saveState();
  renderProviderSelectors();
  setStatus("Provider saved.");
  renderSelfCheck();
  return true;
}

function deleteProvider() {
  if (state.providers.length <= 1) {
    setStatus("Keep at least one provider.", true);
    return;
  }
  const provider = activeProvider();
  if (!provider) return;
  requireSecondClick(`delete-provider-${provider.id}`, `Click delete again to remove provider "${provider.name}".`, () => {
    state.providers = state.providers.filter((item) => item.id !== provider.id);
    delete sessionKeys[provider.id];
    state.activeProviderId = state.providers[0].id;
    saveState();
    renderAll();
    setStatus(`Provider deleted: ${provider.name}`);
  });
}

async function fetchModels() {
  if (!saveProviderFromForm()) return;
  const provider = activeProvider();
  const key = getProviderKey(provider);
  if (!provider || (providerNeedsKey(provider) && !key)) {
    setStatus("Add an API key first.", true);
    return;
  }
  if (hasBaseUrlPlaceholder(provider.baseUrl)) {
    setStatus("Edit the provider base URL before fetching models.", true);
    renderSelfCheck();
    return;
  }
  if (httpEndpointBlockedByPageSecurity(provider.baseUrl)) {
    setStatus("HTTPS-hosted ModelTab cannot call this HTTP endpoint. Use an HTTPS endpoint or serve ModelTab over HTTP on the same LAN.", true);
    renderSelfCheck();
    return;
  }
  setStatus("Fetching models...");
  try {
    const headers = buildHeaders(provider, key, false, provider.type === "gemini");
    const url = provider.type === "gemini"
      ? `${trimSlash(provider.baseUrl)}/models`
      : `${trimSlash(provider.baseUrl)}/models`;
    const response = await fetch(url, { headers });
    const data = await readJsonResponse(response);
    const models = provider.type === "gemini"
      ? (data.models || []).map((model) => model.name?.replace(/^models\//, "")).filter(Boolean)
      : (data.data || []).map((model) => model.id).filter(Boolean);
    renderModelSuggestions(provider, models);
    if (!provider.model && models.length) {
      provider.model = models[0];
      dom.modelInput.value = provider.model;
      saveState();
      renderMeta();
      renderSelfCheck();
    }
    const selected = provider.model && models.includes(provider.model) ? ` Selected ${provider.model}.` : "";
    setStatus(models.length ? `Connected. Loaded ${models.length} models.${selected}` : "Connected, but no models returned. Enter the model manually.");
  } catch (error) {
    setStatus(explainFetchError(error, provider), true);
  }
}

function saveInstructions() {
  const chat = activeConversation();
  state.settings.systemPrompt = dom.systemPromptInput.value.trim();
  state.settings.memory = dom.memoryInput.value.trim();
  if (chat) {
    chat.context = dom.contextInput.value.trim();
    chat.updatedAt = new Date().toISOString();
  }
  saveState();
  renderMeta();
}

function openPromptLibrary() {
  openSettingsSection(dom.promptLibrarySettingsDetails, dom.promptSearchInput);
}

function newPromptDraft() {
  dom.promptLibrarySelect.value = "";
  dom.promptNameInput.value = "";
  dom.promptKindInput.value = "prompt";
  dom.promptTagsInput.value = "";
  dom.promptContentInput.value = dom.promptInput.value.trim();
  dom.promptFavoriteInput.checked = false;
  dom.promptNameInput.focus();
}

function saveDraftAsPrompt() {
  const draft = dom.promptInput.value.trim();
  if (!draft) {
    setStatus("Write a draft first, then save it as a prompt.", true);
    focusPromptInput();
    return;
  }
  openPromptLibrary();
  dom.promptLibrarySelect.value = "";
  dom.promptNameInput.value = compact(firstLine(draft), 64) || "Saved Prompt";
  dom.promptKindInput.value = "prompt";
  dom.promptTagsInput.value = "saved";
  dom.promptContentInput.value = draft;
  dom.promptFavoriteInput.checked = true;
  savePromptFromForm();
}

function savePromptFromForm() {
  const name = dom.promptNameInput.value.trim();
  const content = dom.promptContentInput.value.trim();
  if (!name || !content) {
    setStatus("Prompt name and content are required.", true);
    return;
  }
  const now = new Date().toISOString();
  const id = dom.promptLibrarySelect.value || uid();
  const existing = state.promptLibrary.find((item) => item.id === id);
  const item = {
    id,
    name,
    kind: dom.promptKindInput.value === "system" ? "system" : "prompt",
    tags: normalizeTags(dom.promptTagsInput.value),
    content,
    favorite: dom.promptFavoriteInput.checked,
    builtin: Boolean(existing?.builtin),
    createdAt: existing?.createdAt || now,
    updatedAt: now
  };
  if (existing) {
    Object.assign(existing, item);
  } else {
    state.promptLibrary.unshift(item);
  }
  saveState();
  dom.promptSearchInput.value = "";
  renderPromptLibrary();
  dom.promptLibrarySelect.value = id;
  syncPromptForm();
  setStatus("Prompt saved.");
}

function deleteSelectedPrompt() {
  const item = selectedPrompt();
  if (!item) return;
  requireSecondClick(`delete-prompt-${item.id}`, `Click delete again to remove prompt "${item.name}".`, () => {
    state.promptLibrary = state.promptLibrary.filter((prompt) => prompt.id !== item.id);
    if (!state.promptLibrary.length) state.promptLibrary = defaultPromptLibrary();
    saveState();
    renderPromptLibrary();
    setStatus(`Prompt deleted: ${item.name}`);
  });
}

function insertSelectedPrompt() {
  const item = selectedPrompt();
  if (!item) return;
  if (item.kind === "system") {
    applySystemPrompt(item);
    return;
  }
  insertPromptItem(item);
}

function applySelectedSystemPrompt() {
  const item = selectedPrompt();
  if (!item) return;
  applySystemPrompt(item);
}

function applySystemPrompt(item) {
  dom.systemPromptInput.value = item.content;
  saveInstructions();
  setStatus(`Applied system prompt: ${item.name}`);
}

function insertPromptItem(item) {
  if (SETTINGS_OVERLAY_MEDIA.matches) closeSettings();
  if (templateVariables(item.content).length) {
    renderPromptVariablePanel(item);
    return;
  }
  insertPromptText(fillPromptVariables(item.content), item.name);
}

function insertPromptText(text, name) {
  const draft = dom.promptInput.value.trim();
  dom.promptInput.value = draft ? `${draft}\n\n${text}` : text;
  queueDraftSave();
  focusPromptInput();
  setStatus(`Inserted prompt: ${name}`);
}

function insertQuickPrompt(event) {
  const variableAction = event.target?.closest?.("[data-prompt-variable-action]")?.dataset?.promptVariableAction;
  if (variableAction === "cancel") {
    closePromptQuickPanel();
    focusPromptInput();
    return;
  }
  if (variableAction === "insert") {
    insertPendingPromptTemplate();
    return;
  }
  const id = event.target?.closest?.("[data-prompt-id]")?.dataset?.promptId;
  if (!id) return;
  const item = state.promptLibrary.find((prompt) => prompt.id === id);
  if (!item) return;
  closePromptQuickPanel();
  if (slashPromptQuery() !== null) dom.promptInput.value = "";
  insertPromptItem(item);
}

function insertPendingPromptTemplate() {
  if (!pendingPromptTemplate) return;
  const values = {};
  dom.promptQuickPanel.querySelectorAll("[data-prompt-variable]").forEach((input) => {
    values[input.dataset.promptVariable] = input.value.trim();
  });
  const { item } = pendingPromptTemplate;
  closePromptQuickPanel();
  insertPromptText(fillPromptVariables(item.content, values), item.name);
}

function saveControls() {
  try {
    parseExtraBody(dom.extraBodyInput.value);
  } catch (error) {
    setStatus(error.message, true);
    return false;
  }
  state.settings.temperature = numberOrDefault(dom.temperatureInput.value, DEFAULT_STATE.settings.temperature);
  state.settings.topP = numberOrDefault(dom.topPInput.value, DEFAULT_STATE.settings.topP);
  state.settings.maxTokens = Math.max(1, Math.floor(numberOrDefault(dom.maxTokensInput.value, DEFAULT_STATE.settings.maxTokens)));
  state.settings.maxInputTokens = Math.max(512, Math.floor(numberOrDefault(dom.maxInputTokensInput.value, DEFAULT_STATE.settings.maxInputTokens)));
  state.settings.recentTurns = Math.max(1, Math.floor(numberOrDefault(dom.recentTurnsInput.value, DEFAULT_STATE.settings.recentTurns)));
  state.settings.autoTrim = dom.autoTrimInput.checked;
  state.settings.historyImages = dom.historyImagesInput.checked;
  state.settings.stream = dom.streamInput.value === "true";
  state.settings.jsonMode = dom.jsonModeInput.checked;
  state.settings.grounding = dom.groundingInput.checked;
  state.settings.extraBody = dom.extraBodyInput.value.trim();
  saveState();
  renderSelfCheck();
  return true;
}

async function handleImages() {
  const files = [...dom.imageInput.files].slice(0, 8);
  let draftBytes = draftAttachments.reduce((total, attachment) => total + (attachment.size || 0), 0);
  for (const file of files) {
    if (!SUPPORTED_IMAGE_TYPES.has(file.type) || file.size > MAX_IMAGE_BYTES || draftBytes + file.size > MAX_DRAFT_IMAGE_BYTES) {
      setStatus("Skipped an unsupported or oversized image.", true);
      continue;
    }
    const dataUrl = await fileToDataUrl(file);
    draftBytes += file.size;
    draftAttachments.push({
      id: uid(),
      name: file.name,
      type: file.type,
      size: file.size,
      dataUrl
    });
  }
  dom.imageInput.value = "";
  renderAttachments();
}

function renderAttachments() {
  if (!draftAttachments.length) {
    dom.attachmentTray.hidden = true;
    dom.attachmentTray.innerHTML = "";
    renderIntentActions();
    return;
  }
  dom.attachmentTray.hidden = false;
  dom.attachmentTray.innerHTML = renderAttachmentChips(draftAttachments, true);
  dom.attachmentTray.querySelectorAll("[data-remove-attachment]").forEach((button) => {
    button.addEventListener("click", () => {
      draftAttachments = draftAttachments.filter((item) => item.id !== button.dataset.removeAttachment);
      renderAttachments();
    });
  });
  renderIntentActions();
}

function renderIntentActions() {
  const actions = suggestedIntentActions();
  dom.intentActions.innerHTML = renderButtons(
    actions.map((action) => ({
      label: INTENT_ACTIONS[action].label,
      attrs: { "data-intent-action": action }
    })),
    "small-btn"
  );
}

function suggestedIntentActions() {
  const chat = activeConversation();
  const draft = dom.promptInput.value.trim();
  const lastAssistant = [...(chat?.messages || [])].reverse().find((message) => message.role === "assistant" && !message.error);
  if (draftAttachments.length) return ["analyzeImage", "extractImage", draft ? "concise" : "summarize"];
  if (draft) return ["concise", "risks", "plan"];
  if (lastAssistant) return ["nextSteps", "summarize", "risks"];
  return ["summarize", "explain", "draft", "compare", "plan"];
}

function applyIntentAction(event) {
  const key = event.target?.dataset?.intentAction;
  const action = INTENT_ACTIONS[key];
  if (!action) return;
  const draft = dom.promptInput.value.trim();
  dom.promptInput.value = draft ? `${action.instruction}\n\n${draft}` : action.instruction;
  queueDraftSave();
  focusPromptInput();
}

function renderPromptQuickPanel() {
  const query = slashPromptQuery();
  if (query === null) {
    closePromptQuickPanel();
    return;
  }
  const matches = state.promptLibrary
    .filter((item) => item.kind === "prompt")
    .filter((item) => `${item.name} ${item.tags}`.toLowerCase().includes(query))
    .slice(0, 6);
  if (!matches.length) {
    closePromptQuickPanel();
    return;
  }
  dom.promptQuickPanel.hidden = false;
  dom.promptQuickPanel.innerHTML = renderButtons(matches.map((item) => ({
    attrs: { "data-prompt-id": item.id },
    html: `<strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.tags || "prompt")}</span>`
  })));
}

function slashPromptQuery() {
  const draft = dom.promptInput.value;
  const match = draft.match(/^\/([\w\s-]{0,48})$/);
  return match ? match[1].trim().toLowerCase() : null;
}

function closePromptQuickPanel() {
  pendingPromptTemplate = null;
  dom.promptQuickPanel.hidden = true;
  dom.promptQuickPanel.innerHTML = "";
}

function renderPromptVariablePanel(item) {
  const variables = templateVariables(item.content);
  pendingPromptTemplate = { item, variables };
  dom.promptQuickPanel.hidden = false;
  dom.promptQuickPanel.innerHTML = `<div class="prompt-variable-panel">
    <div>
      <strong>${escapeHtml(item.name)}</strong>
      <span>Fill prompt variables before insertion.</span>
    </div>
    <div class="prompt-variable-grid">
      ${variables.map((name) => `<label>${escapeHtml(name)}
        <input data-prompt-variable="${escapeAttr(name)}" value="${escapeAttr(promptVariableFallback(name))}" autocomplete="off" />
      </label>`).join("")}
    </div>
    <div class="prompt-variable-actions">
      ${renderButton({ label: "Cancel", attrs: { "data-prompt-variable-action": "cancel" } }, "small-btn")}
      ${renderButton({ label: "Insert", attrs: { "data-prompt-variable-action": "insert" } }, "primary-btn")}
    </div>
  </div>`;
  setTimeout(() => dom.promptQuickPanel.querySelector("[data-prompt-variable]")?.focus(), 0);
}

function promptVariableFallback(name) {
  return /^(content|context|prompt)$/i.test(name) ? dom.promptInput.value.trim() : "";
}

function fillPromptVariables(template, values = {}) {
  let output = String(template || "");
  for (const name of templateVariables(output)) {
    const value = values[name] ?? promptVariableFallback(name);
    output = output.replace(new RegExp(`\\{\\{\\s*${escapeRegExp(name)}\\s*\\}\\}`, "g"), value);
  }
  return output;
}

function templateVariables(template) {
  return uniqueStrings([...String(template || "").matchAll(/\{\{\s*([\w-]+)\s*\}\}/g)].map((match) => match[1]));
}

function escapeRegExp(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function sendPrompt() {
  if (activeRequest) return;
  saveDraftForActiveChat();
  if (!saveControls()) return;
  saveInstructions();
  const text = dom.promptInput.value.trim();
  if (!text && !draftAttachments.length) return;
  const chat = activeConversation() || createConversation(false);
  const userMessage = {
    id: uid(),
    role: "user",
    content: text,
    attachments: structuredClone(draftAttachments),
    createdAt: new Date().toISOString()
  };
  chat.messages.push(userMessage);
  chat.updatedAt = userMessage.createdAt;
  if (chat.title === "New chat") chat.title = titleFrom(text || draftAttachments[0]?.name || "Image chat");
  dom.promptInput.value = "";
  delete state.drafts[chat.id];
  draftAttachments = [];
  closePromptQuickPanel();
  const workspaceBlock = await workspaceFailClosedReason(text);
  if (workspaceBlock) {
    chat.messages.push({
      id: uid(),
      role: "assistant",
      content: workspaceBlock,
      error: true,
      createdAt: new Date().toISOString()
    });
    chat.updatedAt = new Date().toISOString();
    saveState();
    renderAll();
    setStatus("Workspace evidence required before answering about local files.", true);
    return;
  }
  await runAssistant(chat);
}

async function runAssistant(chat) {
  const provider = activeProvider();
  const key = getProviderKey(provider);
  const needsKey = providerNeedsKey(provider);
  const placeholderBaseUrl = hasBaseUrlPlaceholder(provider?.baseUrl);
  const blockedByPageSecurity = httpEndpointBlockedByPageSecurity(provider?.baseUrl);
  if (!provider?.model || !provider?.baseUrl || (needsKey && !key)) {
    chat.messages.push({
      id: uid(),
      role: "assistant",
      content: `Provider, model, base URL${needsKey ? ", and API key" : ""} are required before sending.`,
      error: true,
      createdAt: new Date().toISOString()
    });
    saveState();
    renderAll();
    return;
  }
  if (placeholderBaseUrl) {
    chat.messages.push({
      id: uid(),
      role: "assistant",
      content: "Edit the provider base URL before sending.",
      error: true,
      createdAt: new Date().toISOString()
    });
    saveState();
    renderAll();
    return;
  }
  if (blockedByPageSecurity) {
    chat.messages.push({
      id: uid(),
      role: "assistant",
      content: "HTTPS-hosted ModelTab cannot call this HTTP endpoint. Use an HTTPS endpoint or serve ModelTab over HTTP on the same LAN.",
      error: true,
      createdAt: new Date().toISOString()
    });
    saveState();
    renderAll();
    return;
  }

  const assistant = {
    id: uid(),
    role: "assistant",
    content: "",
    provider: provider.name,
    model: provider.model,
    createdAt: new Date().toISOString()
  };
  chat.messages.push(assistant);
  saveState();
  renderAll();
  setBusy(true);

  const controller = new AbortController();
  activeRequest = controller;
  try {
    const onToken = (token) => {
      assistant.content += token;
      renderMessages();
    };
    const requestChat = chatForRequest(chat, assistant.id);
    if (provider.type === "gemini") {
      await callGemini(provider, key, requestChat, onToken, controller.signal);
    } else {
      await callOpenAICompatible(provider, key, requestChat, onToken, controller.signal);
    }
    if (!assistant.content.trim()) assistant.content = "(No text returned.)";
  } catch (error) {
    assistant.error = true;
    assistant.content = error.name === "AbortError" ? `${assistant.content}\n\n[Stopped]`.trim() : explainFetchError(error, provider);
  } finally {
    activeRequest = null;
    chat.updatedAt = new Date().toISOString();
    saveState();
    setBusy(false);
    renderAll();
  }
}

function chatForRequest(chat, pendingAssistantId) {
  const messages = trimMessagesForRequest(chat.messages.filter((message) => {
    if (message.id === pendingAssistantId || message.error) return false;
    if (message.role === "assistant") return Boolean(message.content?.trim());
    return message.role === "user";
  }), chat);
  return {
    ...chat,
    messages
  };
}

function trimMessagesForRequest(messages, chat = activeConversation()) {
  let requestMessages = [...messages];
  if (state.settings.autoTrim) {
    const maxMessages = Math.max(1, state.settings.recentTurns * 2);
    requestMessages = requestMessages.slice(-maxMessages);
  }
  requestMessages = requestMessages
    .map((message, index) => requestMessageCopy(message, index === requestMessages.length - 1))
    .filter((message) => message.content || message.attachments?.length || message.role === "assistant");
  if (!state.settings.autoTrim) return requestMessages;
  while (requestMessages.length > 1 && estimateRequestTokens(requestMessages, chat) > state.settings.maxInputTokens) {
    requestMessages.shift();
  }
  return requestMessages;
}

function requestMessageCopy(message, isLatest) {
  const keepAttachments = state.settings.historyImages || isLatest;
  return {
    ...message,
    content: compactWhitespace(message.content || ""),
    attachments: keepAttachments ? (message.attachments || []) : []
  };
}

function stopGeneration() {
  if (activeRequest) activeRequest.abort();
}

async function callOpenAICompatible(provider, key, chat, onToken, signal) {
  const payload = {
    model: provider.model,
    messages: toOpenAIMessages(chat),
    temperature: state.settings.temperature,
    top_p: state.settings.topP,
    max_tokens: state.settings.maxTokens,
    stream: state.settings.stream
  };
  if (state.settings.jsonMode) payload.response_format = { type: "json_object" };
  deepMerge(payload, parseExtraBody());

  const response = await fetch(`${trimSlash(provider.baseUrl)}/chat/completions`, {
    method: "POST",
    headers: buildHeaders(provider, key, true),
    body: JSON.stringify(payload),
    signal
  });
  if (!response.ok) throw new Error(await response.text());
  if (!state.settings.stream) {
    const data = await response.json();
    onToken(data.choices?.[0]?.message?.content || "");
    return;
  }
  await readSse(response, (data) => {
    if (data === "[DONE]") return;
    const parsed = JSON.parse(data);
    const delta = parsed.choices?.[0]?.delta;
    const text = delta?.content || delta?.reasoning_content || "";
    if (text) onToken(text);
  });
}

async function callGemini(provider, key, chat, onToken, signal) {
  const modelPath = provider.model.startsWith("models/") ? provider.model : `models/${provider.model}`;
  const payload = {
    contents: toGeminiContents(chat),
    generationConfig: {
      temperature: state.settings.temperature,
      topP: state.settings.topP,
      maxOutputTokens: state.settings.maxTokens
    }
  };
  const system = combinedSystem(chat);
  if (system) payload.systemInstruction = { parts: [{ text: system }] };
  if (state.settings.jsonMode) payload.generationConfig.responseMimeType = "application/json";
  if (state.settings.grounding) payload.tools = [{ googleSearch: {} }];
  deepMerge(payload, parseExtraBody());

  const method = state.settings.stream ? "streamGenerateContent?alt=sse" : "generateContent";
  const response = await fetch(`${trimSlash(provider.baseUrl)}/${modelPath}:${method}`, {
    method: "POST",
    headers: buildHeaders(provider, key, true, true),
    body: JSON.stringify(payload),
    signal
  });
  if (!response.ok) throw new Error(await response.text());
  if (!state.settings.stream) {
    const data = await response.json();
    onToken(extractGeminiText(data));
    return;
  }
  await readSse(response, (data) => {
    const parsed = JSON.parse(data);
    const text = extractGeminiText(parsed);
    if (text) onToken(text);
  });
}

function toOpenAIMessages(chat) {
  const messages = [];
  const system = combinedSystem(chat);
  if (system) messages.push({ role: "system", content: system });
  for (const message of chat.messages.filter((item) => item.role === "user" || item.role === "assistant")) {
    if (message.role === "user" && message.attachments?.length) {
      messages.push({
        role: "user",
        content: [
          ...(message.content ? [{ type: "text", text: message.content }] : []),
          ...message.attachments.map((attachment) => ({
            type: "image_url",
            image_url: { url: attachment.dataUrl }
          }))
        ]
      });
    } else {
      messages.push({ role: message.role, content: message.content || "" });
    }
  }
  return messages;
}

function toGeminiContents(chat) {
  return chat.messages
    .filter((message) => message.role === "user" || message.role === "assistant")
    .map((message) => {
      const parts = [];
      if (message.content) parts.push({ text: message.content });
      if (message.role === "user") {
        for (const attachment of message.attachments || []) {
          parts.push({
            inlineData: {
              mimeType: attachment.type,
              data: attachment.dataUrl.split(",")[1]
            }
          });
        }
      }
      return {
        role: message.role === "assistant" ? "model" : "user",
        parts: parts.length ? parts : [{ text: "" }]
      };
    });
}

function combinedSystem(chat) {
  return [
    compactWhitespace(state.settings.systemPrompt || ""),
    state.settings.memory?.trim() ? `Persistent memory:\n${compactWhitespace(state.settings.memory)}` : "",
    chat?.context?.trim() ? `Current chat context:\n${compactWhitespace(chat.context)}` : "",
    workspaceTraceForModel()
  ]
    .filter(Boolean)
    .join("\n\n");
}

function workspaceTraceForModel() {
  if (!state.workspace.enabled || !state.workspace.shareTrace || !workspaceDirectoryHandle) return "";
  const entries = workspaceModelTraceEntries();
  if (!entries.length) return "";
  const traces = entries
    .slice(-WORKSPACE_MODEL_TRACE_LIMIT)
    .map((entry) => `${entry.tool} ${entry.ok ? "OK" : "FAILED"}\ninput: ${entry.input || "(none)"}\noutput:\n${entry.output}`)
    .join("\n\n");
  return `Workspace Agent Mode trace from selected folder "${state.workspace.folderName || workspaceRootLabel()}". Only visible successful read-only tool outputs/snippets are included; no raw file bytes, directory handles, hidden writes, or silent file uploads are included.\n\n${compactWorkspaceTraceForModel(traces, 6000)}`;
}

function workspaceModelTraceEntries() {
  if (!state.workspace.enabled || !workspaceDirectoryHandle) return [];
  return state.workspace.trace.filter((entry) => (
    entry?.ok
    && WORKSPACE_MODEL_TRACE_TOOLS.has(entry.tool)
    && String(entry.output || "").trim()
  ));
}

async function workspaceFailClosedReason(text) {
  if (!state.workspace.enabled || !workspacePromptNeedsVerifiedTrace(text)) return "";
  if (!state.workspace.shareTrace) {
    return "Workspace Agent Mode will not answer about local files yet because trace sharing is off. Turn on \"Send visible tool trace snippets with chat\", run List Files, Search, or Inspect File, then send again.";
  }
  if (!workspaceDirectoryHandle) {
    return "Workspace Agent Mode will not answer about local files yet because no live workspace folder is connected. Select Folder, run List Files, Search, or Inspect File, then send again.";
  }
  const permission = await workspaceReadPermissionState();
  if (permission !== "granted") {
    disconnectWorkspaceHandle();
    return "Workspace Agent Mode will not answer about local files because browser read permission is not granted. Select Folder again, run a read-only tool, then send again.";
  }
  if (!workspaceModelTraceEntries().length) {
    return "Workspace Agent Mode will not guess about local files without verified tool output. Run List Files, Search, or Inspect File so the visible trace shows what was actually inspected, then send again.";
  }
  return "";
}

async function workspaceReadPermissionState() {
  if (!workspaceDirectoryHandle) return "denied";
  try {
    if (typeof workspaceDirectoryHandle.queryPermission === "function") {
      return await workspaceDirectoryHandle.queryPermission({ mode: "read" });
    }
  } catch {
    return "denied";
  }
  return "granted";
}

function workspacePromptNeedsVerifiedTrace(text) {
  return WORKSPACE_INTENT_PATTERN.test(String(text || ""));
}

function compactWorkspaceTraceForModel(value, limit) {
  return String(value || "")
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, limit);
}

function requestTokenSummary(chat) {
  const baseMessages = chat.messages.filter((message) => {
    if (message.error) return false;
    if (message.role === "assistant") return Boolean(message.content?.trim());
    return message.role === "user";
  });
  const requestMessages = trimMessagesForRequest(baseMessages, chat);
  const estimate = estimateRequestTokens(requestMessages, chat);
  const trimmed = requestMessages.length < baseMessages.length ? `, ${baseMessages.length - requestMessages.length} older msg trimmed` : "";
  return `~${estimate}/${state.settings.maxInputTokens} input tokens, ${requestMessages.length} msg${requestMessages.length === 1 ? "" : "s"} kept${trimmed}.`;
}

function estimateRequestTokens(messages, chat = activeConversation()) {
  return estimateTokens(combinedSystem(chat))
    + messages.reduce((total, message) => total + estimateMessageTokens(message), 0);
}

function estimateMessageTokens(message) {
  const textTokens = estimateTokens(message.content || "") + 4;
  const attachmentTokens = (message.attachments || []).reduce((total, attachment) => total + estimateImageTokens(attachment), 0);
  return textTokens + attachmentTokens;
}

function estimateImageTokens(attachment) {
  const bytes = Number(attachment.size || 0);
  return Math.max(256, Math.ceil(bytes / 3));
}

function estimateTokens(value) {
  return Math.ceil(String(value || "").length / 4);
}

function compactWhitespace(value) {
  return String(value || "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function parseExtraBody(rawValue = state.settings.extraBody) {
  const raw = rawValue?.trim();
  if (!raw) return {};
  return parseJsonObject(raw, "Extra request body");
}

function buildHeaders(provider, key, json = true, gemini = false) {
  const headers = {};
  const extra = parseHeaders(provider.extraHeaders);
  Object.assign(headers, extra);
  if (json) headers["Content-Type"] = "application/json";
  if (provider.noAuth) {
    return headers;
  }
  if (gemini) {
    headers["x-goog-api-key"] = key;
  } else {
    headers.Authorization = `Bearer ${key}`;
  }
  return headers;
}

function parseHeaders(raw) {
  if (!raw?.trim()) return {};
  const parsed = parseJsonObject(raw, "Extra headers");
  const headers = {};
  for (const [key, value] of Object.entries(parsed)) {
    const name = key.trim();
    const normalized = name.toLowerCase();
    if (!HEADER_NAME_PATTERN.test(name) || RESERVED_EXTRA_HEADERS.has(normalized) || value === null || typeof value === "object") {
      throw new Error("Extra headers must use safe, non-reserved string values.");
    }
    const text = String(value);
    if (/[\r\n]/.test(text)) throw new Error("Extra headers must use safe, non-reserved string values.");
    headers[name] = text;
  }
  return headers;
}

function safeExtraHeaders(value) {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return "";
  try {
    parseHeaders(raw);
    return raw;
  } catch {
    return "";
  }
}

function parseJsonObject(raw, label) {
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("bad object");
    assertSafeObjectKeys(parsed);
    return parsed;
  } catch (error) {
    if (error.message === "JSON object contains reserved keys.") throw error;
    throw new Error(`${label} must be a valid JSON object.`);
  }
}

function assertSafeObjectKeys(value, depth = 0, budget = { nodes: 0 }) {
  if (!value || typeof value !== "object") return;
  budget.nodes += 1;
  if (depth > MAX_JSON_DEPTH) throw new Error("JSON object is too deep.");
  if (budget.nodes > MAX_JSON_NODES) throw new Error("JSON object is too large.");
  if (Array.isArray(value)) {
    for (const child of value) assertSafeObjectKeys(child, depth + 1, budget);
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    if (UNSAFE_OBJECT_KEYS.has(key)) throw new Error("JSON object contains reserved keys.");
    if (key.length > MAX_JSON_KEY_LENGTH) throw new Error("JSON object key is too long.");
    assertSafeObjectKeys(child, depth + 1, budget);
  }
}

async function readSse(response, onData) {
  if (!response.body) throw new Error("Streaming response body is unavailable.");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() || "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith(":")) continue;
      if (trimmed.startsWith("data:")) onData(trimmed.slice(5).trim());
    }
  }
  const final = buffer.trim();
  if (final.startsWith("data:")) onData(final.slice(5).trim());
}

async function readJsonResponse(response) {
  const text = await response.text();
  if (!response.ok) throw new Error(text);
  return text ? JSON.parse(text) : {};
}

function extractGeminiText(data) {
  return (data.candidates || [])
    .flatMap((candidate) => candidate.content?.parts || [])
    .map((part) => part.text || "")
    .join("");
}

function getProviderKey(provider) {
  if (!provider) return "";
  const formKey = provider.id === state.activeProviderId ? dom.providerKeyInput.value.trim() : "";
  return sessionKeys[provider.id] || formKey;
}

function providerNeedsKey(provider) {
  return Boolean(provider) && !provider.noAuth;
}

function hasBaseUrlPlaceholder(baseUrl) {
  const value = String(baseUrl || "");
  return /YOUR-|api\.example\.com|192\.168\.1\.100/i.test(value);
}

function endpointLikelyLocalNoAuth(baseUrl) {
  const url = parseUrl(baseUrl);
  return Boolean(url) && url.protocol === "http:" && (isLoopbackHost(url.hostname) || isPrivateNetworkHost(url.hostname));
}

function isGenericProviderName(name) {
  return /^(|Provider|Custom OpenAI Compatible|Local Network OpenAI Compatible|OpenAI Compatible)$/i.test(String(name || "").trim());
}

function parseUrl(value) {
  try {
    return new URL(String(value || "").trim());
  } catch {
    return null;
  }
}

function httpEndpointBlockedByPageSecurity(baseUrl) {
  if (location.protocol !== "https:") return false;
  try {
    const url = new URL(baseUrl);
    return url.protocol === "http:" && !isLoopbackHost(url.hostname);
  } catch (error) {
    return false;
  }
}

function isLoopbackHost(hostname) {
  const host = String(hostname || "").replace(/^\[|\]$/g, "").toLowerCase();
  return host === "localhost" || host.endsWith(".localhost") || host === "::1" || /^127\./.test(host);
}

function isPrivateNetworkHost(hostname) {
  const host = String(hostname || "").replace(/^\[|\]$/g, "").toLowerCase();
  if (host === "::1" || host.startsWith("fc") || host.startsWith("fd") || host.startsWith("fe80:")) return true;
  const parts = host.split(".").map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false;
  return parts[0] === 10
    || (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31)
    || (parts[0] === 192 && parts[1] === 168)
    || (parts[0] === 169 && parts[1] === 254);
}

function setBusy(busy) {
  dom.sendBtn.disabled = busy;
  dom.stopBtn.hidden = !busy;
}

function setStatus(message, error = false) {
  dom.providerStatus.textContent = message;
  dom.providerStatus.classList.toggle("error", error);
  showToast(error ? "Needs attention" : "ModelTab", message, error ? "error" : "success");
}

function showToast(title, message, tone = "info") {
  clearTimeout(toastTimer);
  dom.toastRegion.innerHTML = `<div class="toast ${escapeAttr(tone)}" role="status">
    <div><strong>${escapeHtml(title)}</strong><p>${escapeHtml(message)}</p></div>
    ${renderButton({ attrs: { "data-close-toast": "true", "aria-label": "Dismiss notification" }, html: "×" })}
  </div>`;
  toastTimer = setTimeout(clearToast, tone === "error" ? 9000 : 5200);
}

function clearToast() {
  dom.toastRegion.innerHTML = "";
}

function handleToastClick(event) {
  if (event.target.closest("[data-close-toast]")) clearToast();
}

function requireSecondClick(key, message, action) {
  const now = Date.now();
  if (pendingConfirm?.key === key && pendingConfirm.expiresAt > now) {
    pendingConfirm = null;
    action();
    return;
  }
  pendingConfirm = { key, expiresAt: now + 7000 };
  setStatus(message, true);
}

function explainFetchError(error, provider = activeProvider()) {
  const raw = String(error?.message || error || "Unknown error");
  if (error?.name === "TypeError" || raw.includes("Failed to fetch")) {
    return localConnectionHelp(provider);
  }
  try {
    const parsed = JSON.parse(raw);
    return parsed.error?.message || parsed.message || raw;
  } catch {
    return compact(raw, 2000);
  }
}

function localConnectionHelp(provider) {
  const preset = presetForProvider(provider);
  const id = preset?.id || provider?.presetId || "";
  const baseUrl = provider?.baseUrl ? ` Base URL: ${provider.baseUrl}.` : "";
  if (id === "lm-studio") {
    return `Network or CORS failure. For LM Studio, start the local server with CORS enabled: lms server start --cors --port 1234.${baseUrl}`;
  }
  if (id === "ollama") {
    return `Network or CORS failure. For Ollama, confirm Ollama is running, its OpenAI-compatible endpoint is reachable, and browser/CORS access is allowed.${baseUrl}`;
  }
  if (preset?.category === "Local" || endpointLikelyLocalNoAuth(provider?.baseUrl)) {
    return `Network or CORS failure. Confirm the local/LAN server is running, reachable from this browser, and allows this page origin.${baseUrl}`;
  }
  return "Network or CORS failure. Some cloud providers do not allow direct browser calls from static sites; use a browser-compatible endpoint or a local endpoint you control.";
}

function regenerateFrom(index) {
  if (activeRequest) return;
  const chat = activeConversation();
  if (!chat) return;
  const userIndex = findPreviousUserIndex(chat.messages, index);
  if (userIndex < 0) return;
  chat.messages = chat.messages.slice(0, userIndex + 1);
  runAssistant(chat);
}

function editFrom(index) {
  if (activeRequest) return;
  const chat = activeConversation();
  const message = chat?.messages[index];
  if (!chat || !message || message.role !== "user") return;
  dom.promptInput.value = message.content || "";
  draftAttachments = structuredClone(message.attachments || []);
  chat.messages = chat.messages.slice(0, index);
  chat.updatedAt = new Date().toISOString();
  state.drafts[chat.id] = dom.promptInput.value;
  saveState();
  renderAll();
  dom.promptInput.focus();
}

function findPreviousUserIndex(messages, start) {
  for (let index = start; index >= 0; index -= 1) {
    if (messages[index]?.role === "user") return index;
  }
  return -1;
}

function copyMessage(index) {
  const message = activeConversation()?.messages[index];
  if (!message) return;
  navigator.clipboard?.writeText(message.content || "");
}

function deleteActiveChat() {
  const chat = activeConversation();
  if (!chat) return;
  deleteChatById(chat.id);
}

function wipeLocalData() {
  requireSecondClick("wipe-local-data", "Click wipe again to remove local chats, settings, and encrypted key vault.", () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(VAULT_KEY);
    state = normalizeState(structuredClone(DEFAULT_STATE));
    sessionKeys = {};
    draftAttachments = [];
    saveState();
    renderAll();
    setStatus("Local data wiped.");
  });
}

function exportData() {
  downloadJson(exportPayload("data"), "modeltab-data");
  setStatus("Data exported without API keys.");
}

async function exportFullBackup() {
  captureVisibleProviderKey();
  if (!vaultCryptoAvailable()) {
    setStatus("Full backup with keys requires browser WebCrypto.", true);
    return;
  }
  const passphrase = dom.vaultPassphraseInput.value;
  if (!passphrase) {
    setStatus("Vault passphrase required to export encrypted full backup.", true);
    return;
  }
  const keys = await keysForFullBackup(passphrase);
  if (!keys) return;
  const keyVault = await encryptJson({ savedAt: new Date().toISOString(), keys }, passphrase);
  downloadJson(exportPayload("full-backup", keyVault), "modeltab-full-backup");
  setStatus("Full backup exported with encrypted keys. Keep the passphrase separate.");
}

async function keysForFullBackup(passphrase) {
  let keys = sanitizeKeyMap(sessionKeys);
  const savedVault = localStorage.getItem(VAULT_KEY);
  if (!savedVault) return keys;
  try {
    const payload = await decryptJson(sanitizeVault(JSON.parse(savedVault)), passphrase);
    keys = { ...sanitizeKeyMap(payload.keys), ...keys };
    return keys;
  } catch {
    setStatus("Vault passphrase could not unlock saved local keys for full backup.", true);
    return null;
  }
}

function exportPayload(kind, keyVault = null) {
  const payload = {
    exportedAt: new Date().toISOString(),
    app: "modeltab",
    formatVersion: 2,
    kind,
    state: exportableState()
  };
  if (keyVault) payload.keyVault = keyVault;
  return payload;
}

function exportableState() {
  const clean = structuredClone(state);
  clean.providers.forEach((provider) => delete provider.apiKey);
  return clean;
}

function downloadJson(payload, basename) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${basename}-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

async function importData() {
  const file = dom.importInput.files?.[0];
  if (!file) return;
  try {
    if (file.size > MAX_IMPORT_BYTES) throw new Error("Import file is too large.");
    const payload = JSON.parse(await file.text());
    assertSafeObjectKeys(payload);
    const imported = payload.state || payload;
    if (!Array.isArray(imported.providers) || !Array.isArray(imported.conversations)) {
      throw new Error("Invalid export.");
    }
    const keyVault = payload.keyVault ? sanitizeVault(payload.keyVault) : null;
    state = normalizeState({
      ...structuredClone(DEFAULT_STATE),
      ...imported,
      providerPresetVersion: presetVersionOf(imported.providerPresetVersion),
      promptLibraryVersion: presetVersionOf(imported.promptLibraryVersion),
      promptLibrary: Array.isArray(imported.promptLibrary) && imported.promptLibrary.length ? imported.promptLibrary : structuredClone(DEFAULT_STATE.promptLibrary),
      settings: { ...DEFAULT_STATE.settings, ...(imported.settings || {}) }
    });
    if (keyVault) localStorage.setItem(VAULT_KEY, JSON.stringify(keyVault));
    saveState();
    renderAll();
    setStatus(keyVault ? "Full backup imported. Unlock the encrypted key vault with its passphrase." : "Data imported without API keys.");
  } catch (error) {
    setStatus(`Import failed: ${error.message}`, true);
  } finally {
    dom.importInput.value = "";
  }
}

async function unlockVault() {
  const passphrase = dom.vaultPassphraseInput.value;
  const vault = localStorage.getItem(VAULT_KEY);
  if (!vaultCryptoAvailable()) {
    setStatus("Encrypted vault requires browser WebCrypto. Session keys still work.", true);
    return;
  }
  if (!passphrase || !vault) {
    setStatus("Vault passphrase and saved vault are required.", true);
    return;
  }
  try {
    const payload = await decryptJson(sanitizeVault(JSON.parse(vault)), passphrase);
    sessionKeys = { ...sessionKeys, ...sanitizeKeyMap(payload.keys || {}) };
    syncSettingsForm();
    setStatus("Key vault unlocked for this session.");
  } catch {
    setStatus("Vault unlock failed.", true);
  }
}

async function saveVault() {
  const passphrase = dom.vaultPassphraseInput.value;
  captureVisibleProviderKey();
  if (!vaultCryptoAvailable()) {
    setStatus("Encrypted vault requires browser WebCrypto. Session keys still work.", true);
    return;
  }
  if (!passphrase) {
    setStatus("Passphrase required to save encrypted keys.", true);
    return;
  }
  const payload = { savedAt: new Date().toISOString(), keys: sanitizeKeyMap(sessionKeys) };
  localStorage.setItem(VAULT_KEY, JSON.stringify(await encryptJson(payload, passphrase)));
  setStatus("Encrypted key vault saved locally.");
}

function clearVault() {
  requireSecondClick("clear-vault", "Click clear vault again to remove saved local keys from this browser.", () => {
    localStorage.removeItem(VAULT_KEY);
    sessionKeys = {};
    dom.providerKeyInput.value = "";
    setStatus("Encrypted vault cleared.");
  });
}

function captureVisibleProviderKey() {
  const provider = activeProvider();
  const key = dom.providerKeyInput.value.trim();
  if (provider && key) sessionKeys[provider.id] = key;
}

function sanitizeVault(vault) {
  if (!vault || typeof vault !== "object" || Array.isArray(vault)) throw new Error("Invalid encrypted key vault.");
  const clean = {
    v: Number(vault.v),
    kdf: String(vault.kdf || ""),
    salt: String(vault.salt || ""),
    iv: String(vault.iv || ""),
    data: String(vault.data || "")
  };
  if (clean.v !== 1 || clean.kdf !== "PBKDF2-SHA256-210000") throw new Error("Unsupported key vault.");
  if (!isBoundedBase64(clean.salt, 256) || !isBoundedBase64(clean.iv, 256) || !isBoundedBase64(clean.data, MAX_VAULT_B64_CHARS)) {
    throw new Error("Invalid encrypted key vault.");
  }
  return clean;
}

function isBoundedBase64(value, maxLength) {
  return Boolean(value)
    && value.length <= maxLength
    && value.length % 4 === 0
    && /^[A-Za-z0-9+/]+={0,2}$/.test(value);
}

async function encryptJson(payload, passphrase) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);
  const data = new TextEncoder().encode(JSON.stringify(payload));
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, data);
  return {
    v: 1,
    kdf: "PBKDF2-SHA256-210000",
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
    data: bytesToBase64(new Uint8Array(encrypted))
  };
}

async function decryptJson(vault, passphrase) {
  const cleanVault = sanitizeVault(vault);
  const salt = base64ToBytes(cleanVault.salt);
  const iv = base64ToBytes(cleanVault.iv);
  const key = await deriveKey(passphrase, salt);
  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, base64ToBytes(cleanVault.data));
  return JSON.parse(new TextDecoder().decode(decrypted));
}

async function deriveKey(passphrase, salt) {
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(passphrase), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 210000, hash: "SHA-256" },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

function vaultCryptoAvailable() {
  return Boolean(globalThis.crypto?.subtle && globalThis.crypto?.getRandomValues);
}

function renderAttachmentStrip(attachments) {
  if (!attachments.length) return "";
  return `<div class="attachment-strip">${renderAttachmentChips(attachments, false)}</div>`;
}

function renderAttachmentChips(attachments, removable) {
  return attachments
    .map((attachment) => `<span class="attachment-chip">
      <img src="${escapeAttr(attachment.dataUrl)}" alt="" />
      <span title="${escapeAttr(attachment.name)}">${escapeHtml(compact(attachment.name, 24))}</span>
      ${removable ? renderButton({ attrs: { "data-remove-attachment": attachment.id, "aria-label": "Remove attachment" }, html: "×" }) : ""}
    </span>`)
    .join("");
}

function renderMarkdown(source) {
  const lines = String(source || "").split(/\r?\n/);
  let html = "";
  let paragraph = [];
  let listType = "";
  let inCode = false;
  let code = [];

  const flushParagraph = () => {
    if (paragraph.length) {
      html += `<p>${renderInline(paragraph.join(" "))}</p>`;
      paragraph = [];
    }
  };
  const closeList = () => {
    if (listType) {
      html += `</${listType}>`;
      listType = "";
    }
  };

  for (const line of lines) {
    if (line.trim().startsWith("```")) {
      if (inCode) {
        html += `<pre><code>${escapeHtml(code.join("\n"))}</code></pre>`;
        code = [];
        inCode = false;
      } else {
        flushParagraph();
        closeList();
        inCode = true;
      }
      continue;
    }
    if (inCode) {
      code.push(line);
      continue;
    }
    if (!line.trim()) {
      flushParagraph();
      closeList();
      continue;
    }
    const heading = line.match(/^(#{1,3})\s+(.*)$/);
    if (heading) {
      flushParagraph();
      closeList();
      const level = heading[1].length + 2;
      html += `<h${level}>${renderInline(heading[2])}</h${level}>`;
      continue;
    }
    const quote = line.match(/^>\s?(.*)$/);
    if (quote) {
      flushParagraph();
      closeList();
      html += `<blockquote>${renderInline(quote[1])}</blockquote>`;
      continue;
    }
    const unordered = line.match(/^\s*[-*]\s+(.*)$/);
    const ordered = line.match(/^\s*\d+\.\s+(.*)$/);
    if (unordered || ordered) {
      flushParagraph();
      const wanted = unordered ? "ul" : "ol";
      if (listType && listType !== wanted) closeList();
      if (!listType) {
        listType = wanted;
        html += `<${listType}>`;
      }
      html += `<li>${renderInline((unordered || ordered)[1])}</li>`;
      continue;
    }
    paragraph.push(line.trim());
  }
  if (inCode) html += `<pre><code>${escapeHtml(code.join("\n"))}</code></pre>`;
  flushParagraph();
  closeList();
  return html;
}

function renderInline(text) {
  let html = escapeHtml(text);
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  return html;
}

function deepMerge(target, source) {
  for (const [key, value] of Object.entries(source || {})) {
    if (UNSAFE_OBJECT_KEYS.has(key)) continue;
    if (isMergeableObject(value) && isMergeableObject(target[key])) {
      deepMerge(target[key], value);
    } else {
      target[key] = value;
    }
  }
  return target;
}

function titleFrom(text) {
  return compact(text.replace(/\s+/g, " ").trim(), 54) || "New chat";
}

function firstLine(text) {
  return String(text || "").split(/\r?\n/).find((line) => line.trim())?.trim() || "";
}

function trimSlash(value) {
  return String(value || "").replace(/\/+$/, "");
}

function compact(value, length) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text.length > length ? `${text.slice(0, Math.max(0, length - 1))}…` : text;
}

function formatBytes(value) {
  const bytes = Number(value || 0);
  if (!Number.isFinite(bytes) || bytes < 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }
  return `${size.toFixed(unit ? 1 : 0)} ${units[unit]}`;
}

function numberOrDefault(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function clampNumber(value, min, max, fallback) {
  return Math.min(max, Math.max(min, numberOrDefault(value, fallback)));
}

function presetVersionOf(value) {
  const version = Number(value);
  return Number.isFinite(version) ? version : 0;
}

function safeId(value) {
  const id = String(value || "");
  return isSafeObjectKey(id) ? id : uid();
}

function isSafeObjectKey(key) {
  return Boolean(key) && key.length <= MAX_ID_LENGTH && !UNSAFE_OBJECT_KEYS.has(key);
}

function sanitizeKeyMap(keys) {
  const clean = {};
  if (!keys || typeof keys !== "object" || Array.isArray(keys)) return clean;
  for (const [id, key] of Object.entries(keys)) {
    if (isSafeObjectKey(id) && typeof key === "string") clean[id] = key;
  }
  return clean;
}

function isMergeableObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll("`", "&#096;");
}

function renderButton({ label = "", html = "", className = "", attrs = {} }, defaultClassName = "") {
  return `<button ${renderAttrs({ type: "button", class: className || defaultClassName, ...attrs })}>${html || escapeHtml(label)}</button>`;
}

function renderButtons(buttons, defaultClassName = "") {
  return buttons.map((button) => renderButton(button, defaultClassName)).join("");
}

function renderAttrs(attrs) {
  return Object.entries(attrs)
    .filter(([, value]) => value !== undefined && value !== null && value !== false && value !== "")
    .map(([name, value]) => `${name}="${escapeAttr(value)}"`)
    .join(" ");
}

function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function defaultProviders() {
  return PROVIDER_PRESETS.map((preset) => providerFromPreset(preset, preset.defaultId));
}

function defaultPromptLibrary() {
  return DEFAULT_PROMPT_LIBRARY.map((item) => ({
    ...item,
    builtin: true,
    favorite: Boolean(item.favorite),
    createdAt: "builtin",
    updatedAt: "builtin"
  }));
}

function providerFromPreset(preset, id = uid()) {
  return {
    id,
    name: preset.name,
    type: preset.type,
    baseUrl: preset.baseUrl,
    model: preset.model,
    extraHeaders: preset.extraHeaders,
    noAuth: Boolean(preset.noAuth),
    presetId: preset.id
  };
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function bytesToBase64(bytes) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function base64ToBytes(base64) {
  return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
}

function closeMobileSidebar() {
  dom.sidebar.classList.remove("open");
  syncOverlayState();
}

function attachManifest() {
  if (!isHttpLikePage()) return;
  const link = document.createElement("link");
  link.rel = "manifest";
  link.href = "./manifest.webmanifest";
  document.head.append(link);
}

function registerServiceWorker() {
  if (isHttpLikePage() && "serviceWorker" in navigator) {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {});
  }
}

function isHttpLikePage() {
  return location.protocol === "http:" || location.protocol === "https:";
}
