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

- Critical chat, provider, cleaner, workspace, import/export, and settings workflows must remain usable by keyboard-only, mouse/pointer-only, and touch-only users.
- Accessibility claims require current evidence from visual/provider/live tests, focus-return checks, labels/ARIA review, visible feedback checks, and tap-target/no-overflow checks where applicable.
- If a workflow lacks direct input-mode coverage, label it `PASS_WITH_LIMITATIONS` or `NOT_RUN`; do not claim full accessibility from layout tests alone.

## Recovery And Data Safety Evidence

- Import, export, encrypted backup, key vault, corrupt-state, quota, reset/wipe, and workspace-trace recovery claims must remain fail-closed and tied to current provider, visual, local-file, or static tests.
- Normal export must stay key-free; full backup may include keys only through explicit encrypted user action; stale session keys and saved vaults must not silently attach to key-free imports.
- If a recovery path lacks current coverage, label it `PASS_WITH_LIMITATIONS` or `NOT_RUN`; do not imply cloud backup, remote recovery, or provider-side data control.

## Provider Currentness Evidence

- Provider docs, marketing pages, search results, dashboards, or screenshots are not evidence for ModelTab presets until the preset source URL, source date, and in-app wording are updated together.
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
| Repository ZIP safety | `PASS_WITH_LIMITATIONS` | `docs/REPO_ZIP_POLICY.md`, static tests | Recheck no keys, exports, logs, workspace data, or provider payloads are bundled. |
| Input accessibility | `PASS_WITH_LIMITATIONS` | visual tests, provider smoke tests, live smoke, static labels/ARIA checks | Does not certify screen-reader behavior or every assistive technology/browser pairing. |
| Recovery/data safety | `PASS_WITH_LIMITATIONS` | provider smoke tests, key-free export tests, encrypted backup tests, corrupt-state recovery tests | Does not guarantee recovery from browser profile loss or provider-side data retention. |

## Required Before Public-Facing Change

- `git status --short --ignored`
- `git rev-list --left-right --count 'HEAD...@{u}'`
- `gh release list --limit 5` returns no releases
- `npm run qa`
- `git diff --check`
- protected-path and credential scan
- live Pages check after runtime or public-surface changes
