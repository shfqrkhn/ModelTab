(function installModelTabProvider(global) {
  "use strict";

  function parseUrl(value) {
    try {
      return new URL(String(value || "").trim());
    } catch {
      return null;
    }
  }

  function normalizePath(pathname, type = "openai") {
    const suffixes = type === "gemini"
      ? ["/models"]
      : ["/chat/completions", "/completions", "/responses", "/models"];
    let root = String(pathname || "/").replace(/\/+$/g, "") || "/";
    let changed = true;
    while (changed) {
      changed = false;
      const lower = root.toLowerCase();
      for (const suffix of suffixes) {
        if (lower.endsWith(suffix)) {
          root = root.slice(0, -suffix.length).replace(/\/+$/g, "") || "/";
          changed = true;
          break;
        }
      }
    }
    return root;
  }

  function normalizeBaseUrl(baseUrl, type = "openai") {
    const raw = String(baseUrl || "").trim();
    if (!raw) return "";
    const url = parseUrl(raw);
    if (!url || !["http:", "https:"].includes(url.protocol)) {
      throw new Error("Provider base URL must start with http:// or https://.");
    }
    url.hash = "";
    url.search = "";
    url.pathname = normalizePath(url.pathname, type);
    return url.href.replace(/\/+$/, "");
  }

  function normalizeEndpointUrl(value) {
    const url = parseUrl(value);
    if (!url) return "";
    return `${url.protocol}//${url.host}${url.pathname.replace(/\/+$/, "")}`;
  }

  function isLoopbackHost(hostname) {
    const host = String(hostname || "").replace(/^\[|\]$/g, "").toLowerCase();
    return host === "localhost" || host.endsWith(".localhost") || host === "::1" || /^127\./.test(host);
  }

  function isPrivateNetworkHost(hostname) {
    const host = String(hostname || "").replace(/^\[|\]$/g, "").toLowerCase();
    if (host === "::1" || host.startsWith("fc") || host.startsWith("fd") || host.startsWith("fe80:")) return true;
    const parts = host.split(".").map((part) => Number(part));
    if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false;
    return parts[0] === 10
      || (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31)
      || (parts[0] === 192 && parts[1] === 168)
      || (parts[0] === 169 && parts[1] === 254);
  }

  function endpointLikelyLocalNoAuth(baseUrl) {
    const url = parseUrl(baseUrl);
    return Boolean(url) && url.protocol === "http:" && (isLoopbackHost(url.hostname) || isPrivateNetworkHost(url.hostname));
  }

  function httpEndpointBlockedByPageSecurity(baseUrl, pageProtocol) {
    if (pageProtocol !== "https:") return false;
    const url = parseUrl(baseUrl);
    return Boolean(url) && url.protocol === "http:" && !isLoopbackHost(url.hostname);
  }

  function parseHeaders(raw, { parseJsonObject, reservedHeaders, headerNamePattern }) {
    if (!raw?.trim()) return {};
    const parsed = parseJsonObject(raw, "Extra headers");
    const headers = {};
    for (const [key, value] of Object.entries(parsed)) {
      const name = key.trim();
      const normalized = name.toLowerCase();
      if (!headerNamePattern.test(name) || reservedHeaders.has(normalized) || value === null || typeof value === "object") {
        throw new Error("Extra headers must use safe, non-reserved string values.");
      }
      const text = String(value);
      if (/[\r\n]/.test(text)) throw new Error("Extra headers must use safe, non-reserved string values.");
      headers[name] = text;
    }
    return headers;
  }

  function mergeExtraBody(target, source, path, blockedTopLevelKeys, isMergeableObject) {
    for (const [key, value] of Object.entries(source || {})) {
      const fieldPath = [...path, key];
      if (!path.length && blockedTopLevelKeys.has(key)) {
        throw new Error(`Extra request body cannot override core request field: ${fieldPath.join(".")}.`);
      }
      if (Object.hasOwn(target, key)) {
        if (isMergeableObject(value) && isMergeableObject(target[key])) {
          mergeExtraBody(target[key], value, fieldPath, blockedTopLevelKeys, isMergeableObject);
        } else {
          throw new Error(`Extra request body cannot override core request field: ${fieldPath.join(".")}.`);
        }
      } else {
        target[key] = value;
      }
    }
    return target;
  }

  global.ModelTabProvider = Object.freeze({
    endpointLikelyLocalNoAuth,
    hasBaseUrlPlaceholder: (baseUrl) => /YOUR-|api\.example\.com|192\.168\.1\.100/i.test(String(baseUrl || "")),
    httpEndpointBlockedByPageSecurity,
    isLoopbackHost,
    isPrivateNetworkHost,
    mergeExtraBody,
    normalizeBaseUrl,
    normalizeEndpointUrl,
    normalizePath,
    parseHeaders,
    parseUrl,
    providerNeedsKey: (provider) => Boolean(provider) && !provider.noAuth,
  });
})(globalThis);
