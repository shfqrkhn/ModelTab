(function installModelTabWorkspace(global) {
  "use strict";

  function compactWhitespace(value) {
    return String(value || "")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function compactOutput(value, length) {
    const text = compactWhitespace(value);
    return text.length > length ? `${text.slice(0, Math.max(0, length - 1))}…` : text;
  }

  function normalizeTrace(entry, { safeId, compact }) {
    if (!entry || typeof entry !== "object") return null;
    return {
      id: safeId(entry.id),
      createdAt: String(entry.createdAt || new Date().toISOString()),
      tool: compact(String(entry.tool || "workspace.tool"), 80),
      input: compact(String(entry.input || ""), 240),
      output: compactOutput(entry.output, 4000),
      ok: entry.ok !== false,
    };
  }

  function normalizeWorkspace(workspace = {}, options) {
    return {
      enabled: Boolean(workspace.enabled),
      shareTrace: Boolean(workspace.shareTrace),
      folderName: String(workspace.folderName || ""),
      trace: Array.isArray(workspace.trace)
        ? workspace.trace.map((entry) => normalizeTrace(entry, options)).filter(Boolean).slice(-options.traceLimit)
        : [],
    };
  }

  function safeName(name) {
    return Boolean(name) && name !== "." && name !== ".." && !/[\\/]/.test(name);
  }

  function normalizePath(filePath) {
    const parts = String(filePath || "").replaceAll("\\", "/").split("/").filter(Boolean);
    if (parts.some((part) => !safeName(part))) throw new Error("Workspace path must stay inside the selected folder.");
    return parts.join("/");
  }

  function isProbablyText(bytes) {
    const limit = Math.min(bytes.length, 4096);
    if (!limit) return true;
    let suspicious = 0;
    for (let index = 0; index < limit; index += 1) {
      const byte = bytes[index];
      if (byte === 0) return false;
      if (byte < 7 || (byte > 14 && byte < 32)) suspicious += 1;
    }
    return suspicious / limit < 0.02;
  }

  function verifiedTraceEntries(workspace, hasLiveHandle, allowedTools) {
    if (!workspace.enabled || !hasLiveHandle) return [];
    return workspace.trace.filter((entry) => (
      entry?.ok
      && allowedTools.has(entry.tool)
      && String(entry.output || "").trim()
    ));
  }

  function promptNeedsVerifiedTrace(text, pattern) {
    pattern.lastIndex = 0;
    return pattern.test(String(text || ""));
  }

  function compactTraceForModel(value, limit) {
    return String(value || "")
      .replace(/\r\n?/g, "\n")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
      .slice(0, limit);
  }

  async function failClosedReason(options) {
    if (!options.enabled || !promptNeedsVerifiedTrace(options.text, options.intentPattern)) return "";
    if (!options.shareTrace) {
      return "Workspace Agent Mode will not answer about local files yet because trace sharing is off. Turn on \"Send visible tool trace snippets with chat\", run List Files, Search, or Inspect File, then send again.";
    }
    if (!options.hasLiveHandle) {
      return "Workspace Agent Mode will not answer about local files yet because no live workspace folder is connected. Select Folder, run List Files, Search, or Inspect File, then send again.";
    }
    const permission = await options.readPermission();
    if (permission !== "granted") {
      options.onPermissionDenied();
      return "Workspace Agent Mode will not answer about local files because browser read permission is not granted. Select Folder again, run a read-only tool, then send again.";
    }
    if (!options.hasVerifiedTrace()) {
      return "Workspace Agent Mode will not guess about local files without verified tool output. Run List Files, Search, or Inspect File so the visible trace shows what was actually inspected, then send again.";
    }
    return "";
  }

  global.ModelTabWorkspace = Object.freeze({
    compactOutput,
    compactTraceForModel,
    failClosedReason,
    isProbablyText,
    normalizePath,
    normalizeTrace,
    normalizeWorkspace,
    promptNeedsVerifiedTrace,
    safeName,
    verifiedTraceEntries,
  });
})(globalThis);
