# AI Studio Cleaner

Clean Google AI Studio chat exports into readable Markdown.

- **Status:** Stable companion utility
- **Live Demo:** [shfqrkhn.github.io/AI-Studio-Cleaner](https://shfqrkhn.github.io/AI-Studio-Cleaner/)
- **Portfolio Role:** AI utility supporting the ModelTab flagship.

AI Studio Cleaner is a lightweight browser app for parsing exported Google AI Studio conversation JSON files and converting them into clean Markdown, optionally including or hiding model reasoning blocks.

## Screenshot

![AI Studio Cleaner interface](./screenshot.png)

## Why This Exists

AI Studio exports are useful but noisy. This tool turns them into portable, readable documents for review, archiving, migration, and reuse.

## What It Does

- Accepts Google AI Studio JSON export files in the browser.
- Handles common export shapes such as chunks and parts.
- Lets users include or omit thinking/reasoning blocks.
- Previews generated Markdown.
- Copies or downloads the cleaned output.
- Runs as static files with no backend.

## Quick Start

1. Open the live demo.
2. Drop or select one or more AI Studio JSON export files.
3. Choose whether to include reasoning blocks.
4. Review the Markdown.
5. Copy or download the result.

## Privacy And Data Model

- Files are processed locally in the browser.
- No server upload is required for normal use.
- No account, telemetry, or bundled API key.
- Users should review cleaned output before sharing it externally.

## Relationship To Other Projects

This repo is a stable companion to `ModelTab`. Keep it focused on AI Studio export cleanup; broader AI chat, BYOK provider setup, and future import workflows belong in `ModelTab`.

## Repository Layout

```text
.
├── index.html
├── screenshot.png
├── package.json
└── benchmark_*.js
```

## Deployment

Host the repository root on GitHub Pages or open `index.html` locally.

## Maintenance

Maintenance-only unless Google AI Studio changes its export format or the parser needs compatibility updates.

## License

See `LICENSE`.
