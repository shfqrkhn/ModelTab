# AI Maintainer Handoff

Last updated: 2026-07-03.
Repo: `D:\VSCode\GH\ModelTab`.

Treat this as a public-safe continuation map. Re-read current files before editing.

## Mission

Maintain ModelTab as the flagship no-install BYOK AI chat PWA. It must remain static-hostable, browser-first, privacy-forward, provider-flexible, and usable from GitHub Pages or a local extracted folder.

## Product Contract

- Support OpenAI-compatible chat endpoints and native Gemini.
- Support common cloud providers and local/LAN endpoints including LM Studio, Ollama, llama.cpp, vLLM, LocalAI, and Text Generation WebUI.
- Keep API keys user-owned. No bundled keys, telemetry, backend, hidden upload, or silent key export.
- Keep normal export key-free. Full backup may include keys only through explicit encrypted user action.
- Keep AI Studio Cleaner integrated under `tools/ai-studio-cleaner/`; do not revive it as a separate app surface.
- Keep optional Workspace Agent Mode opt-in, selected-folder scoped, read-only by default, trace-visible, and fail-closed when no verified tool trace exists.
- Keep all critical workflows usable by keyboard-only, mouse-only, and touch-only input.
- Avoid JS popup APIs; use in-app UI and toasts.
- Treat OmniOS/OmniDevOS materials in the local GH workspace docs bundle as private process references only. Do not expand ModelTab scope from those files unless the user explicitly requests product work.

## OmniOS Transfer Contract

- Product truth: static BYOK AI chat PWA with direct user-selected provider calls, not a hosted proxy or bundled-key service.
- Execution truth: preserve provider, workspace, cleaner, export/import, local-file, visual, and live gates before publishing.
- Evidence truth: use `docs/EVIDENCE_RECEIPT.md`, provider source dates, sanitized test output, and static/provider/workspace tests; public claims must stay within `PASS` or `PASS_WITH_LIMITATIONS`.
- Operations truth: live Pages or current main repository ZIP are the only distribution paths; GitHub Releases stay absent.
- Transfer truth: update this handoff and the evidence receipt when provider presets, workspace authority, key handling, or public-surface guarantees change.

## Doctrine Delta Decision

- After incidents, rescue runs, maturity passes, or repeated failures, classify reusable lessons as `promote`, `reject`, `quarantine`, or `keep_local`.
- Promote only source-backed, reusable, non-secret lessons that strengthen a gate, checklist, source rule, or failure guard without weakening BYOK privacy.
- Keep private, project-specific, speculative, or unverified lessons out of public repos unless the user explicitly approves publication.

## Key Files

- `index.html`: app shell.
- `app.js`: main state, provider, chat, settings, prompt, memory, workspace, and UI logic.
- `styles.css`: responsive layout and visual system.
- `workspace-worker.js`: selected-folder read-only tool layer.
- `service-worker.js`: static/PWA cache.
- `manifest.webmanifest`: install metadata.
- `tools/ai-studio-cleaner/`: integrated cleaner.
- `tests/`: static, visual, local-file, provider, worker, and live gates.

## Required Checks

Run relevant gates after material changes:

```bash
npm test
npm run test:worker
npm run test:local-file
npm run test:visual
npm run test:provider
npm run test:live
```

Also perform a secret scan and verify no API keys, exports, encrypted backups, local chat data, screenshots with personal data, `node_modules`, `test-results`, or `playwright-report` are committed.

## Known Continuation Priorities

1. Keep tightening the small-screen chat layout without sacrificing pane discoverability.
2. Keep AI Studio Cleaner visually and navigationally native to ModelTab.
3. Expand provider setup only when it improves real usability without creating key-handling risk.
4. Expand Workspace Agent Mode only behind explicit consent, visible traces, and read-only/browser-sandboxed defaults.
