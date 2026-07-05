# Repository ZIP Policy

Users should run the live GitHub Pages app or download the repository through **Code > Download ZIP**. The generated repository ZIP may contain the static BYOK PWA and bundled local tools only. It must not contain user keys, private workspace data, telemetry, backend code, or unproven provider claims.

## Allowed

- Static app files, PWA icons/manifest/service worker, tests, public docs, screenshots, and bundled `tools/ai-studio-cleaner/`.
- BYOK provider setup UI for OpenAI-compatible, Gemini, and local-compatible endpoints.
- Source-dated free/testing provider presets when they remain BYOK-only, key-free by default, and clear that cloud prompts leave the browser.
- Key-free normal exports and encrypted full backups only when explicitly initiated by the user.

## Forbidden

- Bundled API keys, default credentials, telemetry, backend services, hidden remote scripts, silent upload paths, private workspace contents, provider payload logs, raw responses, local absolute paths, `node_modules/`, `test-results/`, and `playwright-report/`.
- Claims that a provider, model list, quota, price, retention policy, or compatible endpoint is current unless a fresh source-backed currentness receipt exists.
- Free-forever claims, bundled provider keys, automatic paid fallback, or hidden proxy behavior for free/testing providers.
- Workspace Agent write access, hidden folder reads, trace-free agent behavior, or fail-open folder inspection.

## Public Claims

- Allowed: static local-first BYOK AI chat PWA, explicit provider setup, source-dated free/testing presets, no bundled keys/backend/telemetry, key-free normal export, encrypted backup by explicit action, integrated AI Studio Cleaner, and opt-in read-only Workspace Agent Mode.
- Not claimed unless separately evidenced: provider availability, model availability, external compliance review, account policy, live provider success, or enterprise/security certification.

## Verification

Before pushing public ZIP/download-facing changes, run:

```bash
npm run qa
git diff --check
```

Repository ZIP review must confirm normal exports omit keys, free/testing provider claims include current source links and no free-forever promise, and the repository ZIP contains no private workspace data or credential material.
Use `git archive --format=tar HEAD` as the local generated-archive proxy when checking runtime entries and forbidden archive paths before public download-facing changes.
