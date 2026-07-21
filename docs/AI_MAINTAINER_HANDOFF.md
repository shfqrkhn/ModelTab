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
- Keep all critical workflows usable with one available input mode after setup: keyboard only, mouse/pointer only, touch only, or platform-limited input only.
- Avoid JS popup APIs; use in-app UI and toasts.
- Treat OmniOS/OmniDevOS materials in the local GH workspace docs bundle as private process references only. Do not expand ModelTab scope from those files unless the user explicitly requests product work.

## OmniOS Transfer Contract

- Product truth: static BYOK AI chat PWA with direct user-selected provider calls, not a hosted proxy or bundled-key service.
- Execution truth: preserve provider, workspace, cleaner, export/import, local-file, visual, and live gates before publishing.
- Evidence truth: use `docs/EVIDENCE_RECEIPT.md`, provider source dates, sanitized test output, and static/provider/workspace tests; public claims must stay within `PASS` or `PASS_WITH_LIMITATIONS`.
- Operations truth: live Pages or current main repository ZIP are the only distribution paths; GitHub Releases stay absent.
- Reliability truth: keep BYOK, provider, workspace, cleaner, import/export, and settings paths self-checking, crash-recoverable, state-explicit, modular, maintainable, simple, one-input accessible, and TDD/SDD-backed; remove complexity that does not improve resilience or usability.
- Ecosystem truth: follow the shared signature design system in `shfqrkhn/.github/docs/SIGNATURE_DESIGN_SYSTEM.md` for public UI/UX changes; adapt it to BYOK AI workspace flows rather than copying components blindly.
- Design truth: keep UI changes modern minimalist, utilitarian, professional, joyful, responsive, and contextual to BYOK chat/workspace workflows; use local CSS/tokens and native controls first, treat MIT UI libraries/resources as inspiration only unless a source-backed need justifies a dependency, and reject browser JS popups, blocking overlays, overlapping components, inaccessible controls, unbounded motion, or arbitrary component copy-paste.
- Single input truth: after setup, critical BYOK chat, provider, cleaner, workspace, import/export, and settings workflows must remain fully operable by keyboard only, mouse/pointer only, touch only, or platform-limited input only; never require a combined input-mode path.
- Transfer truth: update this handoff and the evidence receipt when provider presets, workspace authority, key handling, or public-surface guarantees change.

## Doctrine Delta Decision

- After incidents, rescue runs, maturity passes, or repeated failures, classify reusable lessons as `promote`, `reject`, `quarantine`, or `keep_local`.
- Promote only source-backed, reusable, non-secret lessons that strengthen a gate, checklist, source rule, or failure guard without weakening BYOK privacy.
- Keep private, project-specific, speculative, or unverified lessons out of public repos unless the user explicitly approves publication.

## Key Files

- `index.html`: app shell.
- `app.js`: DOM orchestration, provider calls, settings, prompts, and compatibility wrappers.
- `modules/`: file-mode-safe provider, persistence, encrypted-backup, workspace, and chat-state modules.
- `docs/MODULE_ARCHITECTURE.md`: module contracts and incremental extraction workflow.
- `styles.css`: responsive layout and visual system.
- `workspace-worker.js`: selected-folder read-only tool layer.
- `service-worker.js`: static/PWA cache.
- `manifest.webmanifest`: install metadata.
- `tools/ai-studio-cleaner/`: integrated cleaner.
- `tests/`: module, static, visual, local-file, provider, worker, and live gates.

## Required Checks

Run relevant gates after material changes:

```bash
npm run qa
```

Also perform a secret scan and verify no API keys, exports, encrypted backups, local chat data, screenshots with personal data, `node_modules`, `test-results`, or `playwright-report` are committed.

## Known Continuation Priorities

1. Keep tightening the small-screen chat layout without sacrificing pane discoverability.
2. Keep AI Studio Cleaner visually and navigationally native to ModelTab.
3. Expand provider setup only when it improves real usability without creating key-handling risk.
4. Keep provider preset help source-dated and link-visible: source URL, setup URL when available, verification date, and caution text must stay visible before users rely on free/testing presets.
5. Expand Workspace Agent Mode only behind explicit consent, visible traces, and read-only/browser-sandboxed defaults.
