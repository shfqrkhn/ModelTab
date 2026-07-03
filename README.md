# ModelTab

<p><a href="https://github.com/sponsors/shfqrkhn?o=esb"><strong>Sponsor this project</strong></a></p>

Every model. One tab.

- **Status:** Active flagship
- **Live Demo:** [shfqrkhn.github.io/ModelTab](https://shfqrkhn.github.io/ModelTab/)
- **Bundled Tool:** [AI Studio Cleaner](https://shfqrkhn.github.io/ModelTab/tools/ai-studio-cleaner/)
- **Portfolio Role:** Primary AI application.
- **License:** MIT

ModelTab is a no-install BYOK AI chat PWA for OpenAI-compatible endpoints and native Gemini API keys. It gives users a browser-based alternative to desktop AI chat tools: bring an endpoint, bring a key, and use the provider directly.

`AI-Studio-Cleaner` now lives inside this repository at `tools/ai-studio-cleaner/` as the focused utility for cleaning Google AI Studio exports into readable Markdown.

## Screenshot

![ModelTab AI chat workspace](./screenshot.png)

## Why This Exists

Many AI chat tools require a desktop install, a hosted account, or a single provider. ModelTab keeps the workflow portable: static files, direct provider calls, local settings, and no bundled backend.

## What It Does

- Supports OpenAI-compatible `/chat/completions` endpoints and native Gemini APIs.
- Includes presets for OpenAI, Azure OpenAI, OpenRouter, Groq, Gemini, DeepSeek, MiniMax, Mistral, xAI, Together, Perplexity, Fireworks, Cerebras, NVIDIA NIM, DeepInfra, SambaNova, DashScope, Vercel AI Gateway, LM Studio, Ollama, llama.cpp, vLLM, LocalAI, Text Generation WebUI, and LAN endpoints.
- Provides prompt library, system prompt presets, slash prompt search, prompt variables, memory, per-chat context, image input, JSON mode, streaming, regeneration, copy/edit, and tree chat organization.
- Offers encrypted full backup, normal key-free export, import, local wipe, and browser-only operation.
- Includes optional Workspace Agent Mode for explicit selected-folder, read-only inspection with visible tool traces.
- Includes `tools/ai-studio-cleaner/` for local Google AI Studio export cleanup.

## Quick Start

1. Open the live demo or download the repository and open `index.html`.
2. Select or add a provider profile.
3. Enter base URL, model, and API key if the endpoint requires one.
4. For LM Studio browser use, start the local server with CORS enabled:

   ```powershell
   lms server start --cors --port 1234
   ```

5. Chat, save prompts, organize conversations, and export or back up local data.

AI Studio export cleanup:

1. Open `tools/ai-studio-cleaner/index.html` locally or through the ModelTab Pages path.
2. Drop or select exported Google AI Studio JSON.
3. Review, copy, or download the cleaned Markdown.

## Privacy And Data Model

- No account, backend, analytics, telemetry, or bundled provider key.
- Keys are session-only unless the user explicitly saves an encrypted local vault.
- Normal export never includes API keys.
- Full backup encrypts keys with a user passphrase.
- Provider content is sent only to the selected endpoint.
- Workspace files are not sent unless the user explicitly shares visible trace snippets or attaches files.

## Local And Static Hosting

- GitHub Pages: serve from the repository root.
- Zip download: extract and open `index.html` directly.
- PWA shell caching is active on HTTP/HTTPS.
- Local `file://` mode skips manifest and service-worker registration for zip-download reliability.

## Quality Gates

- Static regression gate: `npm test`
- Workspace worker gate: `npm run test:worker`
- Local-file contract smoke: `npm run test:local-file`
- Responsive visual gate: `npm run test:visual`
- Local provider smoke gate: `npm run test:provider`
- Live Pages gate after deployment: `npm run test:live`
- Before release, also run syntax checks, a secret scan, README link/media checks, local static smoke, provider setup smoke, and GitHub Pages checks.

## Relationship To Other Projects

ModelTab is the main AI flagship. `AI-Studio-Cleaner` has been consolidated here to keep AI tooling in one canonical repo. Future AI import, cleanup, and migration workflows should extend this repository instead of creating or reviving separate AI utility repos.

## Repository Layout

```text
.
├── index.html
├── app.js
├── styles.css
├── workspace-worker.js
├── service-worker.js
├── manifest.webmanifest
├── icons/
└── tools/
    └── ai-studio-cleaner/
```

## Maintenance

Keep the release tree minimal: only files needed to run the app, bundled tools, README, license material, and GitHub Pages metadata. Never commit API keys, local exports, full backups, or test/runtime artifacts.

## License

MIT. See `LICENSE`.
