import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, isAbsolute, join, normalize, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const docs = [
  "README.md",
  "index.html",
  "tools/ai-studio-cleaner/README.md",
  "tools/ai-studio-cleaner/index.html"
];
const checks = [];

function read(path) {
  return readFileSync(join(root, path), "utf8");
}

function check(name, condition) {
  checks.push({ name, ok: Boolean(condition) });
}

function existsNonEmpty(path) {
  const fullPath = join(root, path);
  return existsSync(fullPath) && statSync(fullPath).size > 0;
}

function isInsideRoot(path) {
  const rel = relative(root, path);
  return rel === "" || (!rel.startsWith("..") && !isAbsolute(rel));
}

function localTarget(fromFile, href) {
  return normalize(join(dirname(join(root, fromFile)), href.replace(/#.*$/, "")));
}

function localFileExists(fromFile, href) {
  const target = localTarget(fromFile, href);
  return isInsideRoot(target) && existsSync(target);
}

function isSafeProjectPath(fromFile, href) {
  if (!href || href.startsWith("#")) return true;
  if (/^(https?:|mailto:)/i.test(href)) return true;
  if (/^data:image\//i.test(href)) return true;
  if (/^(javascript:|data:|file:)/i.test(href)) return false;
  return localFileExists(fromFile, href);
}

for (const doc of docs) {
  const body = read(doc);
  const localMarkdownImages = [...body.matchAll(/!\[[^\]]*]\(([^)]+)\)/g)].map((match) => match[1]);
  const localMarkdownLinks = [...body.matchAll(/\[[^\]]+]\(([^)]+)\)/g)].map((match) => match[1]);
  const htmlLinks = [...body.matchAll(/\b(?:href|src)=["']([^"']+)["']/g)].map((match) => match[1]);
  const links = [...localMarkdownLinks, ...htmlLinks];

  check(`${doc} links stay inside project or use safe external/static targets`, links.every((href) => isSafeProjectPath(doc, href)));
  check(`${doc} markdown images exist`, localMarkdownImages.every((href) => /^(https?:|data:|blob:)/i.test(href) || (localFileExists(doc, href) && statSync(localTarget(doc, href)).size > 0)));
}

check("root screenshot exists for README and social preview", existsNonEmpty("screenshot.png"));
check("AI Studio Cleaner screenshot exists", existsNonEmpty("tools/ai-studio-cleaner/screenshot.png"));
check("PWA preview and install icons exist", ["icons/icon.svg", "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png", "screenshot.png"].every(existsNonEmpty));
check("root LICENSE exists", existsNonEmpty("LICENSE"));
check("README exposes Sponsor, live demo, bundled cleaner, and license", [
  "https://github.com/sponsors/shfqrkhn?o=esb",
  "https://shfqrkhn.github.io/ModelTab/",
  "https://shfqrkhn.github.io/ModelTab/tools/ai-studio-cleaner/",
  "https://github.com/shfqrkhn/ModelTab/archive/refs/heads/main.zip",
  "Download current main ZIP",
  "MIT"
].every((needle) => read("README.md").includes(needle)));
check("README covers repository ZIP, local zip, PWA install, CORS, and local/LAN setup paths", [
  "Repository ZIP And Download",
  "download the current main repository ZIP",
  "open `index.html`",
  "Direct browser calls require",
  "local/LAN server",
  "install the PWA"
].every((needle) => read("README.md").includes(needle)));

const failed = checks.filter((item) => !item.ok);
if (failed.length) {
  for (const item of failed) console.error(`FAIL ${item.name}`);
  process.exit(1);
}

for (const item of checks) console.log(`PASS ${item.name}`);
