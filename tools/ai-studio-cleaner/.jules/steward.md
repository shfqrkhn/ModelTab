## 2026-01-25 - [Sentinel] - [Tailwind Play CDN CORS Constraint]
**Insight:** The Tailwind Play CDN (`https://cdn.tailwindcss.com`) does not serve `Access-Control-Allow-Origin` headers. This prevents the use of Subresource Integrity (SRI) because `integrity` requires `crossorigin="anonymous"`, which fails without CORS headers.
**Protocol:** Do not attempt to add SRI to `cdn.tailwindcss.com` scripts unless the CDN configuration changes or the architecture moves to a local build.

## 2026-02-04 - [Palette] - [Mobile Input Latency]
**Insight:** Standard buttons trigger a 300ms delay on mobile browsers to detect double-tap gestures, degrading perceived responsiveness.
**Protocol:** All interactive elements must apply `touch-action: manipulation` (Tailwind: `touch-manipulation`) to disable double-tap zoom and eliminate the delay.

## 2026-02-02 - [Palette] - [Decorative Icon Noise]
**Insight:** Functional React components wrapping raw SVGs (like `Icon`) often lack accessibility context, causing screen readers to announce them as "group" or "image" without labels.
**Protocol:** All decorative icon components MUST strictly include `aria-hidden="true"` by default unless explicitly labeled.

## 2026-02-14 - [Bolt] - [Logic Extraction for Verification]
**Insight:** Embedding complex logic (like markdown generation) inside React hooks makes it inaccessible to external verification scripts (e.g., stress tests) without fragile string parsing.
**Protocol:** complex data transformation logic MUST be extracted into standalone pure functions outside the component to enable direct testing and benchmarking.

## 2026-02-15 - [Palette] - [Empty Thought Noise]
**Insight:** Empty "Thinking Process" blocks (whitespace only) degrade UX by displaying meaningless containers.
**Protocol:** The parser MUST filter out any thought parts that contain only whitespace or are empty before adding them to the conversation object.

## 2026-02-18 - [Sentinel] - [Falsy Text Data Loss]
**Insight:** Using simple truthiness checks (e.g., `if (text)`) on content fields causes data loss for valid falsy values like `0` (number), which are critical for mathematical or code contexts.
**Protocol:** Content validation MUST explicitly check for `undefined` or `null` (e.g., `if (text !== undefined && text !== null)`) instead of relying on implicit type coercion.

## 2026-02-16 - [Palette] - [Semantic Drift]
**Protocol:** Toggle UI elements (switches) must use semantic `role="switch"` and `aria-checked`, not `button` + `aria-pressed`.

## 2026-02-16 - [Hygiene] - [Artifact Decay]
**Protocol:** Benchmark scripts must be actively referenced in `package.json`; unreferenced scripts are considered entropy and must be purged.

## 2026-02-18 - [Hygiene] - [Documentation Drift]
**Insight:** `CLAUDE.md` file listings often drift from the actual repository state as files are added or removed.
**Protocol:** Any file addition or deletion MUST be accompanied by an update to the "File Structure" section in `CLAUDE.md`.

## 2026-03-02 - [Bolt] - [Object Retention Memory Leaks]
**Insight:** Storing arrays of raw `File` objects in React state prevents garbage collection over thousands of uploads, creating a significant memory leak and violating performance mandates.
**Protocol:** When only scalar metrics (like the total count of processed files) are needed for UI rendering, track that metric directly (e.g. `fileCount`) rather than retaining an array of raw objects.

## 2026-03-03 - [Bolt] - [O(N) Derived State in High-Frequency Batches]
**Insight:** Using `useMemo` to derive a scalar value (e.g., `errorCount = parsedData.filter(p => p.error).length`) from an array that continuously grows during batch processing causes an O(N) operation on every render, severely degrading performance for large datasets.
**Protocol:** When incrementally building a large dataset, standalone scalar metrics (like `errorCount`) MUST be tracked directly via state and updated incrementally, avoiding full array traversals.
