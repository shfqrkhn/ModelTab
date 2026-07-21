# Runtime Module Architecture

Last updated: 2026-07-21.

ModelTab keeps classic self-hosted scripts so an extracted repository can run directly from `file://`. `index.html` loads these modules in order before `app.js`; no bundler, remote dependency, dynamic import, or relaxed CSP is required.

- `modules/provider.js`: endpoint normalization, local/private endpoint classification, reserved-header validation, and protected extra-body merging.
- `modules/persistence.js`: legacy-key migration, safe state reads, corrupt-state quarantine, API-key-free persistence, and attachment-stripping fallback.
- `modules/encrypted-backup.js`: bounded vault validation, key-map sanitization, PBKDF2-SHA256 key derivation, and AES-GCM JSON encryption/decryption.
- `modules/workspace.js`: selected-folder path containment, trace normalization/compaction, verified-trace selection, and fail-closed local-file intent decisions.
- `modules/chat-state.js`: message normalization, attachment-payload recovery fallback, request filtering, history-image policy, and token/turn trimming.
- `app.js`: DOM orchestration, provider calls, browser file handles, rendering, and compatibility wrappers around the modules.

The module objects are frozen globals because native ES modules have inconsistent direct-file behavior across browsers. Safety-sensitive dependencies and current state are passed explicitly into pure functions. `tests/modeltab.modules.mjs` characterizes module boundaries; browser provider/workspace tests prove integration and `tests/modeltab.local-file-smoke.mjs` proves direct-file loading.

Keep extraction incremental: establish a passing browser characterization first, move one stable seam, run its direct tests and focused browser coverage, then run `npm run test:all`. Do not move API keys, directory handles, or user data into globals.
