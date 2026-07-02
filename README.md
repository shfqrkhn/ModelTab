# ModelTab

Every model. One tab.

ModelTab is a static GitHub Pages-hostable BYOK AI chat PWA for OpenAI-compatible endpoints and native Gemini API keys.

**Live Demo:** `https://shfqrkhn.github.io/ModelTab/`

## Contract

- No install, account, bundled provider key, backend, analytics, or telemetry.
- Runs directly from `index.html` after zip download/extract, without a local server.
- Browser UI only; AI inference runs on the selected provider endpoint.
- Default chat mode does not run local model inference, local RAG, or document parsing.
- Optional Workspace Agent Mode can run explicit read-only folder inspection in the browser after the user selects a folder.
- Direct-browser BYOK cannot hide keys from the browser runtime.
- Some providers block direct browser calls with CORS, Private Network Access, `file://` origins, or mixed-content rules; those require a browser-compatible endpoint, HTTPS local endpoint, same-LAN HTTP hosting of ModelTab, or future optional proxy mode.

## Core Workflow

1. Open ModelTab.
2. Add or select a provider profile.
3. Enter base URL, model, and API key when the endpoint requires one.
4. Optionally fetch models, tune controls, set system prompt, memory, and per-chat context.
5. Reuse saved prompts/system presets from the prompt library, slash menu, or composer save shortcut.
6. Organize chats into nested folders, archive old threads, duplicate useful threads, move chats between folders, and delete with non-modal second-click safeguards.
7. Chat with streaming, edit, regenerate, copy, search, data export, full encrypted backup, import, and image input where the provider supports vision.

## Workspace Agent Mode

- Off by default and explicit opt-in from Settings.
- Uses the browser File System Access API when available; the user must pick a project folder, and access is limited to that selected folder for the current session.
- Folder handles are not stored in localStorage, export, backup, or prompt context. Reopen/reload requires selecting the folder again.
- Tools are read-only and allowlisted: list files, search text snippets, hash files, extract strings, hexdump samples, and inspect PE/COFF, ELF, Mach-O, and WebAssembly headers.
- List Files populates a session-only discovered-file picker; selecting a file fills the inspect path without granting broader access.
- The trace panel has a local filter for long inspection sessions without changing what is stored or shared.
- Binary inspection runs in `workspace-worker.js` off the UI thread and includes a WebAssembly sandbox capability check for future compiled analyzers.
- Inspection reads capped samples: full files up to 2 MB, then first-and-last 1 MB chunks for larger files. SHA-256 hashing is capped at 8 MB.
- Tool activity is always visible in the Workspace Agent trace panel.
- Provider requests receive no workspace data unless the user enables "Send visible tool trace snippets with chat."
- Trace sharing sends only visible tool outputs/snippets, never directory handles or hidden raw file uploads. Raw file upload still requires explicit user attachment through the composer.
- Browser support varies. Folder picking generally requires a supporting Chromium browser in a secure context such as HTTPS or localhost; local `file://` mode remains usable for ordinary chat.

## Provider Support

- OpenAI-compatible `/chat/completions`: custom base URL, model, optional API key, no-auth local mode, extra headers, streaming, JSON mode, image messages, and extra request-body JSON.
- Gemini native API: model selection, streaming, system instruction, image input, JSON response mode, optional Google Search grounding, and extra request-body JSON.
- Gemini native requests send the API key through `x-goog-api-key`, not URL query parameters.
- Built-in cloud/gateway presets include OpenAI, Azure OpenAI v1, OpenRouter, Groq, Gemini Native, Gemini OpenAI-compatible, DeepSeek, MiniMax Global, MiniMax China, Mistral, xAI, Together AI, Perplexity, Fireworks AI, Cerebras, NVIDIA NIM Cloud, DeepInfra, SambaNova, DashScope Qwen, and Vercel AI Gateway.
- Built-in local presets include LM Studio, Ollama, llama.cpp, vLLM, LocalAI, NVIDIA NIM Local, Text Generation WebUI, and editable LAN OpenAI-compatible endpoints.
- Presets fill provider type, base URL, auth mode, default model, extra headers, and model suggestions; users can still edit every field.
- Local OpenAI-compatible presets use no-auth mode by default and cover `http://localhost:1234/v1`, `http://localhost:11434/v1`, `http://localhost:8080/v1`, `http://localhost:8000/v1`, `http://localhost:5000/v1`, and editable LAN HTTP endpoints such as `http://192.168.1.100:8080/v1`.
- Provider setup auto-detects known base URLs and likely local HTTP endpoints, then fills safe defaults while preserving custom names.
- Settings default to the shortest useful provider setup path; advanced provider fields, key vault, memory, prompt library, generation controls, and data actions are collapsed until needed.
- Browser use with LM Studio requires CORS on the LM Studio server, for example `lms server start --cors --port 1234`; enable it only when needed because it allows websites you visit to access that local server.

## Prompt Library

- Saved prompt snippets and system prompt presets are stored in local app state and included in import/export.
- Built-ins cover summary, explanation, critique, planning, reply drafting, code review, prompt improvement, concise operator, senior engineer, and product critic workflows.
- Favorites sort first so large prompt libraries stay fast to scan.
- Type `/` in the composer to search prompt snippets without opening settings.
- The composer prompt-library button opens settings, expands Prompt Library, and focuses prompt search.
- Save the current composer draft as a prompt with the star button.
- Prompt variables such as `{{topic}}` and `{{content}}` are filled before insertion.
- System prompt presets can be applied directly to the global system prompt field.

## Token Efficiency

- Requests default to automatic context trimming, a bounded recent-turn window, and an estimated input-token budget.
- Readiness shows estimated input tokens, kept messages, and whether older context was trimmed.
- Historical image attachments are omitted from provider requests by default unless explicitly enabled; the latest image turn is preserved.
- Whitespace is compacted before provider calls without changing saved chat history.
- Built-in prompts and system presets include token-efficient answer and context-compression workflows.

## Reliability

- Readiness panel checks provider URL, model, required API key, online state, and recovered draft state.
- Placeholder endpoints such as Azure `YOUR-RESOURCE` and LAN `192.168.1.100` are flagged before model fetch or send.
- Suggested next-action buttons route users to the next likely step.
- Intent shortcuts adapt to empty chats, active drafts, attached images, and prior assistant answers.
- Prompt library actions keep reusable instructions close to the composer and settings.
- Chat library actions support tree folders/subfolders, archive/restore, duplicate, move, and delete without blocking browser dialogs.
- Successes, failures, and confirmation-required actions update the provider status line and show dismissible toasts.
- Token budget controls prevent accidental oversized context sends.
- Responsive shell covers narrow phones, touch-first panels, desktop workstations, and very large displays with capped reading width.
- Conversation, chat, and settings panes scroll vertically within the app shell; horizontal scrolling is prevented, including long code blocks and unbroken tokens.
- Conversation and settings side panes are collapsible; the central chat workspace automatically takes all remaining width.
- Left and right pane motion, focus states, hover feedback, and reduced-motion behavior use shared UI tokens for consistency.
- Readiness, header metadata, and settings disclosures are bounded so the main chat remains the primary workspace.
- Settings become an overlay on crowded desktop/tablet widths instead of permanently squeezing the chat workspace.
- Collapsed overlay panes are inert and hidden from assistive navigation until opened.
- Draft prompts autosave per chat and recover after reload.
- Runtime and async faults surface in-app and preserve state where possible.
- Local storage quota fallback preserves text state and skips stored image payloads.
- Imported state is size/depth/node/key bounded, normalized, deduplicated, and validated before use.
- Extra request JSON and headers reject reserved prototype/auth fields before provider calls; imported auth-like extra headers are stripped before storage/export.
- Provider requests exclude pending empty assistant placeholders and prior error turns.
- Service worker caches only app-shell assets, never provider requests or responses.
- Offline navigation falls back to the cached app shell.
- Local file mode skips manifest and service-worker registration so double-clicked `index.html` runs without PWA-only browser errors.
- CSP allows self-hosted assets plus HTTPS and HTTP provider endpoints so user-selected localhost and LAN OpenAI-compatible servers can be reached where browser security policy permits.
- HTTPS-hosted pages flag plain-HTTP non-loopback endpoints before fetch because browsers can block those mixed-content LAN calls; use HTTPS on the endpoint or serve ModelTab over HTTP on the same LAN.
- Frame-ancestor protection requires a hosting HTTP header; it cannot be enforced from a meta CSP.

## Input Accessibility

All critical workflows are operable after setup with keyboard only, mouse only, touch only, or platform-limited input:

- Buttons back every file-picker action.
- `Esc` closes panels.
- `Ctrl/Cmd+K` focuses chat search.
- `Ctrl/Cmd+Enter` sends from anywhere.
- Core actions remain visible or reachable from the readiness panel, top bar, sidebar, composer, or settings panel.

## Security Model

- Keys are session-only unless the user explicitly saves an encrypted local vault.
- No-auth local providers do not send `Authorization` or Gemini API-key headers.
- Encrypted vault uses WebCrypto PBKDF2 + AES-GCM.
- Normal data export never includes API keys.
- Extra headers are for non-secret provider metadata; auth-like header names are rejected or stripped.
- Full backup requires a vault passphrase and exports current session keys plus any saved local vault keys only as an encrypted vault blob.
- Full backup import stores the encrypted vault locally; plaintext keys are available only after the user unlocks it with the passphrase.
- Provider content is sent only to the selected endpoint.
- Workspace files are not sent to providers unless the user explicitly exposes visible trace snippets or attaches files.
- Full local wipe is available in settings.
- Image attachments are limited to PNG, JPEG, WebP, and GIF with local size caps.
- Imported image attachments must match their declared MIME type, base64 shape, and size bounds.

## Local Portability

- Data export includes conversations, providers without keys, settings, system prompt, memory, per-chat context, prompt library, drafts, and image attachments still present in local state.
- Full encrypted backup adds the key vault so a user can move the entire app state between browsers or devices without a server account.
- Import accepts both normal data exports and full backups from local JSON files.
- Local wipe removes app state, session keys, and encrypted vault data from this browser.

## Files

- `index.html`: app shell and CSP.
- `styles.css`: responsive UI, shared component tokens, input accessibility, readiness states.
- `app.js`: state, chat organization, provider adapters, reusable UI render helpers, self-checks, key vault, recovery, import/export.
- `workspace-worker.js`: browser worker for bounded Workspace Agent file inspection.
- `service-worker.js`: app-shell cache only.
- `manifest.webmanifest`: PWA metadata.
- `icons/icon.svg`: app icon.

## Preview

```powershell
python -m http.server 4173
```

Open `http://127.0.0.1:4173/`.
