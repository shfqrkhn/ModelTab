# Evidence Receipt

This public-safe receipt keeps ModelTab claims tied to evidence instead of chat history.

## Evidence Classes

- `PASS`: directly covered by current files, tests, or checks.
- `PASS_WITH_LIMITATIONS`: true only within the stated scope.
- `NOT_RUN`: not checked in the current pass.
- `BLOCKED`: cannot be checked until an external condition changes.
- `NO_GO`: failed or unsafe; do not publish until fixed.

## Claim Firewall Invariant

- Every public technical, security, privacy, download, provider, model, pricing, quota, workspace, or cleaner claim must map to a `Claim Boundaries` row or be added with evidence before publication.
- Public claims may not exceed `PASS` or `PASS_WITH_LIMITATIONS`; `NOT_RUN`, `BLOCKED`, and `NO_GO` items must stay unpublished or be labeled as unavailable.
- Volatile provider, model, pricing, quota, browser, and GitHub settings must be rechecked from current source/repo state before reliance.

## Currentness Watchdog

- Recheck claim evidence before public-facing changes, not on a fixed calendar.
- If current evidence is stale, missing, inaccessible, or contradicted by provider/source/repo/GitHub state, downgrade the affected claim to `NOT_RUN`, `BLOCKED`, or `NO_GO`.
- Do not preserve old status snapshots as proof after provider presets, source dates, workspace authority, key handling, workflows, or public privacy wording changes.

## Safe-To-Publish Receipt

- Mark this repo safe to publish only when the current pass proves a clean synced tree, no GitHub Releases, no protected tracked paths, no open secret/dependabot/code-scanning alerts or a documented code-scanning not-applicable/no-analysis state, passing required gates, and working live or repository-ZIP distribution surface.
- Runtime app code scanning uses `.github/workflows/codeql.yml` with CodeQL JavaScript analysis; missing or failed analysis must be reported as `PASS_WITH_LIMITATIONS`, `NOT_RUN`, or `NO_GO`.
- If any proof is missing, stale, or contradicted by GitHub/repo/provider state, record the repo as `PASS_WITH_LIMITATIONS`, `NOT_RUN`, `BLOCKED`, or `NO_GO` instead of safe.
- The final status table must name remaining risks rather than implying safety from silence.

## Input Accessibility Evidence

- After setup, critical chat, provider, cleaner, workspace, import/export, and settings workflows must remain fully usable with one available input mode: keyboard only, mouse/pointer only, touch only, or platform-limited input only.
- No critical workflow may require a combined keyboard-plus-pointer, keyboard-plus-touch, hover-plus-keyboard, drag-plus-keyboard, or browser-popup path.
- Accessibility claims require current evidence from visual/provider/live tests, focus-return checks, labels/ARIA review, visible feedback checks, platform text-entry support, and tap-target/no-overflow checks where applicable.
- If keyboard-only, mouse-only, touch-only, or platform-limited operation is not directly covered, label it `PASS_WITH_LIMITATIONS` or `NOT_RUN`; do not claim full accessibility from layout tests alone.

## Design Language Evidence

- UI changes must preserve a modern minimalist, utilitarian, professional, joyful, responsive, BYOK-chat-contextual design language with local CSS/tokens, semantic native controls, visible focus, reduced-motion-safe transitions, no horizontal overflow, and no component overlap.
- Signature Ecosystem Evidence: ModelTab must look and feel like part of the shared `shfqrkhn` ecosystem while staying contextual to provider setup, private local workspaces, and BYOK chat.
- MIT UI libraries/resources such as Uiverse, Open Props, Primer, Radix Colors, Pico CSS, Heroicons, Bootstrap Icons, Floating UI, or A11y Dialog are inspiration sources only unless a source-backed, license-checked, tested need justifies a dependency.
- Reject browser JS popups, blocking overlays, arbitrary component copy-paste, mixed visual systems, unbounded animation, external CDNs, or styling that weakens provider/key/workspace safety.

## Recovery And Data Safety Evidence

- Import, export, encrypted backup, key vault, corrupt-state, quota, reset/wipe, and workspace-trace recovery claims must remain fail-closed and tied to current provider, visual, local-file, or static tests.
- Normal export must stay key-free; full backup may include keys only through explicit encrypted user action; stale session keys and saved vaults must not silently attach to key-free imports.
- If a recovery path lacks current coverage, label it `PASS_WITH_LIMITATIONS` or `NOT_RUN`; do not imply cloud backup, remote recovery, or provider-side data control.

## Mission-Critical Reliability Evidence

- Critical BYOK, provider, workspace, cleaner, import/export, and settings workflows must stay self-checking, crash-recoverable, state-explicit, modular, maintainable, simple, one-input accessible, and TDD/SDD-backed.
- Runtime failures must fail closed with sanitized in-app status, preserved user control, no browser popup APIs, no hidden upload, and no silent key or workspace-data exposure.
- New complexity is acceptable only when it directly improves resilience, usability, state clarity, security, or maintainability and is covered by current tests or explicit evidence.
- Autonomous AI-assisted development must start from current files, add or update tests before broad behavior changes, keep claims inside evidence boundaries, and leave a reproducible recovery path.

## Provider Currentness Evidence

- Provider docs, marketing pages, search results, dashboards, or screenshots are not evidence for ModelTab presets until the preset source URL, source date, and in-app wording are updated together.
- The in-app provider preset help must expose the source URL, setup URL when available, source date, and caution text so users can verify free/testing presets before sending prompts.
- Free/testing labels may describe only the source-dated preset intent; they must not imply free-forever availability, current quota, current pricing, CORS success, model availability, retention policy, or a paid fallback.
- If a provider source is stale, unreachable, contradicted, or not checked in the current pass, keep the preset usable as BYOK/custom configuration but downgrade public claims to `PASS_WITH_LIMITATIONS`, `NOT_RUN`, `BLOCKED`, or `NO_GO`.

## Claim Boundaries

| Area | Class | Evidence | Limit |
| --- | --- | --- | --- |
| Static BYOK PWA | `PASS` | README, app shell, service worker, static tests | Provider browser/CORS behavior is outside this repo. |
| No bundled keys/backend/telemetry | `PASS` | static tests, repository ZIP policy, provider smoke tests | User-entered keys remain local runtime data and must not be exported silently. |
| Free/testing presets | `PASS_WITH_LIMITATIONS` | source-dated provider preset tests | No free-forever, quota, pricing, or availability guarantee. Refresh sources before reliance. |
| Workspace Agent Mode | `PASS_WITH_LIMITATIONS` | provider/workspace tests, worker guardrails | Must remain opt-in, selected-folder scoped, read-only by default, trace-visible, and fail-closed. |
| AI Studio Cleaner integration | `PASS_WITH_LIMITATIONS` | static tests and bundled cleaner checks | Cleaner remains a local bundled tool, not a remote service. |
| Repository ZIP safety | `PASS_WITH_LIMITATIONS` | `docs/REPO_ZIP_POLICY.md`, `git archive`, static tests | Recheck no keys, exports, logs, workspace data, or provider payloads are bundled. |
| Input accessibility | `PASS_WITH_LIMITATIONS` | visual tests, provider smoke tests, live smoke, static labels/ARIA checks | Does not certify screen-reader behavior or every assistive technology/browser pairing. |
| Single input operation | `PASS_WITH_LIMITATIONS` | input accessibility evidence, visual/provider/live checks, no browser popup policy | Does not certify every OS assistive technology or unusual HID/browser pairing. |
| Design language/UI safety | `PASS_WITH_LIMITATIONS` | handoff/evidence docs, static tests, visual/provider/live checks where run | Does not certify every viewport or assistive technology; contextual BYOK/workspace surfaces may differ from other repos. |
| Signature ecosystem fit | `PASS_WITH_LIMITATIONS` | shared signature design system reference, design evidence, static/visual/provider/live tests | Does not require identical UI components; provider setup and workspace flows remain domain-specific. |
| Recovery/data safety | `PASS_WITH_LIMITATIONS` | provider smoke tests, key-free export tests, encrypted backup tests, corrupt-state recovery tests | Does not guarantee recovery from browser profile loss or provider-side data retention. |
| Mission-critical reliability | `PASS_WITH_LIMITATIONS` | mission-critical reliability evidence, provider/workspace/static/visual tests | Does not make provider networks, browsers, models, local files, or user devices mission-critical infrastructure. |

## Required Before Public-Facing Change

- `git status --short --ignored`
- `git rev-list --left-right --count 'HEAD...@{u}'`
- `gh release list --limit 5` returns no releases
- `npm run qa`
- `git diff --check`
- protected-path and credential scan
- live Pages check after runtime or public-surface changes
