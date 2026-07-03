import { existsSync, readFileSync } from "node:fs";
import { join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const read = (path) => readFileSync(join(root, path), "utf8");

const html = read("index.html");
const cleanerHtml = read("tools/ai-studio-cleaner/index.html");
const app = read("app.js");
const serviceWorker = read("service-worker.js");
const manifest = JSON.parse(read("manifest.webmanifest"));

const failures = [];

function check(name, condition, detail = "") {
  if (!condition) failures.push(`${name}${detail ? `: ${detail}` : ""}`);
}

function localPath(ref, base = "") {
  const cleaned = ref.replace(/^\.\//, "");
  return normalize(join(root, base, cleaned));
}

function htmlAssetRefs(source) {
  return [
    ...[...source.matchAll(/<script\b[^>]*src="([^"]+)"/g)].map((match) => match[1]),
    ...[...source.matchAll(/<link\b(?=[^>]*\brel="(?:stylesheet|icon|apple-touch-icon)")(?=[^>]*\bhref="([^"]+)")[^>]*>/g)].map((match) => match[1])
  ].filter((ref) => ref && !ref.startsWith("data:"));
}

const assetRefs = [
  ...htmlAssetRefs(html).map((ref) => ({ ref, base: "" })),
  ...htmlAssetRefs(cleanerHtml).map((ref) => ({ ref, base: "tools/ai-studio-cleaner" })),
  ...[...serviceWorker.matchAll(/"(\.\/[^"]+)"/g)].map((match) => ({ ref: match[1], base: "" })),
  ...(manifest.icons || []).map((icon) => ({ ref: icon.src, base: "" })),
  ...(manifest.screenshots || []).map((screenshot) => ({ ref: screenshot.src, base: "" }))
];

for (const { ref, base } of assetRefs) {
  check("asset reference is local-relative", !/^(?:https?:)?\/\//.test(ref) && !ref.startsWith("/"), ref);
  check("asset exists beside extracted app", existsSync(localPath(ref, base)), ref);
}

check("index has no manifest link that would force file-mode fetch", !/<link\b[^>]*rel="manifest"/i.test(html));
check("manifest is attached only after HTTP-like check", /function attachManifest\(\)\s*\{\s*if \(!isHttpLikePage\(\)\) return;/s.test(app));
check("service worker registers only after HTTP-like check", /function registerServiceWorker\(\)\s*\{\s*if \(isHttpLikePage\(\) && "serviceWorker" in navigator\)/s.test(app));
check("file-mode user notice is present", app.includes("Local file mode.") && app.includes("ordinary chat still works from this file"));
check("runtime has no bundled remote scripts", !/<script\b[^>]*src="https?:\/\//i.test(html));
check("runtime has no bundled remote styles", !/<link\b(?=[^>]*\brel="stylesheet")(?=[^>]*\bhref="https?:\/\/)[^>]*>/i.test(html));
check("cleaner has no bundled remote scripts", !/<script\b[^>]*src="https?:\/\//i.test(cleanerHtml));
check("cleaner has no bundled remote styles", !/<link\b(?=[^>]*\brel="stylesheet")(?=[^>]*\bhref="https?:\/\/)[^>]*>/i.test(cleanerHtml));
check("cleaner uses local runtime only", !/(cdn\.tailwindcss|unpkg\.com|ReactDOM|React\.|type=["']text\/babel["']|Babel|fonts\.googleapis|fonts\.gstatic)/i.test(cleanerHtml));
check("PWA start URL stays relative", manifest.start_url === "./");
check("PWA scope stays relative", manifest.scope === "./");
check("PWA id stays relative for static/local portability", manifest.id === "./");
check("PWA manifest includes local install preview metadata", Array.isArray(manifest.categories) && manifest.categories.length >= 3 && Array.isArray(manifest.screenshots) && manifest.screenshots.some((screenshot) => screenshot.src === "./screenshot.png"));
check("PWA install icons include png and iOS touch assets", manifest.icons.some((icon) => icon.src === "./icons/icon-192.png") && manifest.icons.some((icon) => icon.src === "./icons/icon-512.png") && html.includes("./icons/apple-touch-icon.png"));
check("service worker shell excludes provider/API URLs", !/api\.openai|generativelanguage|localhost:1234|openrouter/i.test(serviceWorker));

if (failures.length) {
  failures.forEach((failure) => console.error(`FAIL ${failure}`));
  process.exit(1);
}

console.log(`PASS local-file contract smoke (${assetRefs.length} local asset references verified)`);
