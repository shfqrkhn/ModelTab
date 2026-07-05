# Evidence Receipt

This public-safe receipt keeps ModelTab claims tied to evidence instead of chat history.

## Evidence Classes

- `PASS`: directly covered by current files, tests, or checks.
- `PASS_WITH_LIMITATIONS`: true only within the stated scope.
- `NOT_RUN`: not checked in the current pass.
- `BLOCKED`: cannot be checked until an external condition changes.
- `NO_GO`: failed or unsafe; do not publish until fixed.

## Claim Boundaries

| Area | Class | Evidence | Limit |
| --- | --- | --- | --- |
| Static BYOK PWA | `PASS` | README, app shell, service worker, static tests | Provider browser/CORS behavior is outside this repo. |
| No bundled keys/backend/telemetry | `PASS` | static tests, repository ZIP policy, provider smoke tests | User-entered keys remain local runtime data and must not be exported silently. |
| Free/testing presets | `PASS_WITH_LIMITATIONS` | source-dated provider preset tests | No free-forever, quota, pricing, or availability guarantee. Refresh sources before reliance. |
| Workspace Agent Mode | `PASS_WITH_LIMITATIONS` | provider/workspace tests, worker guardrails | Must remain opt-in, selected-folder scoped, read-only by default, trace-visible, and fail-closed. |
| AI Studio Cleaner integration | `PASS_WITH_LIMITATIONS` | static tests and bundled cleaner checks | Cleaner remains a local bundled tool, not a remote service. |
| Repository ZIP safety | `PASS_WITH_LIMITATIONS` | `docs/REPO_ZIP_POLICY.md`, static tests | Recheck no keys, exports, logs, workspace data, or provider payloads are bundled. |

## Required Before Public-Facing Change

- `git status --short --ignored`
- `git rev-list --left-right --count HEAD..."@{u}"`
- `npm run test:all`
- `npm run test:live` when live behavior is relevant
- `git diff --check`
- protected-path and credential scan
- live Pages check after runtime or public-surface changes
