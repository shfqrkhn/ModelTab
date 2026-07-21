import assert from "node:assert/strict";

await import("../modules/provider.js");
await import("../modules/persistence.js");
await import("../modules/encrypted-backup.js");
await import("../modules/workspace.js");
await import("../modules/chat-state.js");

const provider = globalThis.ModelTabProvider;
assert.equal(provider.normalizeBaseUrl("http://localhost:1234/v1/chat/completions?x=1#y"), "http://localhost:1234/v1");
assert.equal(provider.normalizeBaseUrl("https://generativelanguage.googleapis.com/v1beta/models", "gemini"), "https://generativelanguage.googleapis.com/v1beta");
assert.throws(() => provider.normalizeBaseUrl("file:///tmp/model"), /must start with http/);
assert.equal(provider.endpointLikelyLocalNoAuth("http://127.0.0.1:11434/v1"), true);
assert.equal(provider.endpointLikelyLocalNoAuth("https://api.openai.com/v1"), false);
assert.equal(provider.httpEndpointBlockedByPageSecurity("http://192.168.1.10:8000/v1", "https:"), true);
assert.equal(provider.httpEndpointBlockedByPageSecurity("http://localhost:8000/v1", "https:"), false);
assert.equal(provider.isPrivateNetworkHost("172.31.1.2"), true);
assert.equal(provider.isPrivateNetworkHost("172.32.1.2"), false);

const parseJsonObject = (raw) => JSON.parse(raw);
const headerOptions = {
  parseJsonObject,
  reservedHeaders: new Set(["authorization", "x-api-key"]),
  headerNamePattern: /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/,
};
assert.deepEqual(provider.parseHeaders('{"X-Client":"ModelTab"}', headerOptions), { "X-Client": "ModelTab" });
assert.throws(() => provider.parseHeaders('{"Authorization":"secret"}', headerOptions), /non-reserved/);
assert.throws(() => provider.parseHeaders('{"X-Test":"ok\\nno"}', headerOptions), /non-reserved/);
assert.throws(() => provider.mergeExtraBody(
  { model: "" }, { model: "override" }, [], new Set(["model"]),
  (value) => Boolean(value) && typeof value === "object" && !Array.isArray(value),
), /cannot override/);

console.log("PASS ModelTab provider module characterization");

function memoryStorage(initial = {}, failAfter = Infinity) {
  const values = new Map(Object.entries(initial));
  let writes = 0;
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem(key, value) {
      writes += 1;
      if (writes > failAfter) throw new Error("quota");
      values.set(key, String(value));
    },
    value: (key) => values.get(key),
  };
}

const persistence = globalThis.ModelTabPersistence;
const migrated = memoryStorage({ legacy: '{"ok":true}', legacyVault: "cipher" });
persistence.migrateLegacyStorage(migrated, { state: "state", vault: "vault", legacyState: "legacy", legacyVault: "legacyVault" });
assert.equal(migrated.value("state"), '{"ok":true}');
assert.equal(migrated.value("vault"), "cipher");
assert.deepEqual(persistence.readState(migrated, "state", () => {}), { found: true, raw: '{"ok":true}', value: { ok: true } });
assert.throws(() => persistence.readState(memoryStorage({ state: "{" }), "state", () => {}), SyntaxError);

const stateWithKey = { providers: [{ id: "p", apiKey: "secret" }], conversations: [] };
const stored = memoryStorage();
assert.equal(persistence.saveState(stored, "state", stateWithKey, (value) => value), "ok");
assert.equal(JSON.parse(stored.value("state")).providers[0].apiKey, undefined);
const quotaThenFallback = (() => {
  const storage = memoryStorage();
  let first = true;
  return {
    ...storage,
    setItem(key, value) {
      if (first) {
        first = false;
        throw new Error("quota");
      }
      storage.setItem(key, value);
    },
  };
})();
assert.equal(persistence.saveState(quotaThenFallback, "state", stateWithKey, () => ({ providers: [], conversations: [] })), "stripped");
const noWrites = memoryStorage({}, 0);
assert.equal(persistence.saveState(noWrites, "state", stateWithKey, (value) => value), "failed");
const recovery = memoryStorage();
assert.match(persistence.quarantineCorruptState(recovery, "recovery", "bad", new Error("parse"), 3, (value) => value), /recovery snapshot/);
assert.equal(JSON.parse(recovery.value("recovery")).raw, "bad");
console.log("PASS ModelTab persistence module characterization");

const backup = globalThis.ModelTabEncryptedBackup;
assert.equal(backup.vaultCryptoAvailable(), true);
assert.equal(backup.isBoundedBase64("YWJjZA==", 8), true);
assert.equal(backup.isBoundedBase64("not base64", 100), false);
const keyMap = backup.sanitizeKeyMap({ safe: "secret", __proto__: "blocked", bad: 12 }, (id) => id !== "__proto__");
assert.deepEqual(keyMap, { safe: "secret" });
const encrypted = await backup.encryptJson({ keys: { safe: "secret" }, marker: 7 }, "correct horse battery staple");
assert.equal(encrypted.v, 1);
assert.equal(encrypted.kdf, "PBKDF2-SHA256-210000");
assert.deepEqual(
  await backup.decryptJson(encrypted, "correct horse battery staple", 1024 * 1024),
  { keys: { safe: "secret" }, marker: 7 },
);
await assert.rejects(() => backup.decryptJson(encrypted, "wrong passphrase", 1024 * 1024));
assert.throws(() => backup.sanitizeVault({ ...encrypted, data: "x" }, 1024 * 1024), /Invalid encrypted/);
console.log("PASS ModelTab encrypted-backup module characterization");

const workspace = globalThis.ModelTabWorkspace;
assert.equal(workspace.normalizePath("src\\app.js"), "src/app.js");
assert.throws(() => workspace.normalizePath("../secret.txt"), /stay inside/);
assert.equal(workspace.safeName("."), false);
assert.equal(workspace.isProbablyText(new TextEncoder().encode("hello\nworld")), true);
assert.equal(workspace.isProbablyText(new Uint8Array([1, 0, 2])), false);
assert.equal(workspace.compactTraceForModel(" a   b\r\n\r\n\r\nc ", 100), "a b\n\nc");
const intentPattern = /workspace|local files?/i;
const failClosed = (overrides = {}) => workspace.failClosedReason({
  enabled: true,
  text: "inspect local files",
  intentPattern,
  shareTrace: true,
  hasLiveHandle: true,
  readPermission: async () => "granted",
  onPermissionDenied: () => {},
  hasVerifiedTrace: () => true,
  ...overrides,
});
assert.match(await failClosed({ shareTrace: false }), /trace sharing is off/);
assert.match(await failClosed({ hasLiveHandle: false }), /no live workspace folder/);
let disconnected = false;
assert.match(await failClosed({ readPermission: async () => "denied", onPermissionDenied: () => { disconnected = true; } }), /permission is not granted/);
assert.equal(disconnected, true);
assert.match(await failClosed({ hasVerifiedTrace: () => false }), /will not guess/);
assert.equal(await failClosed(), "");
assert.deepEqual(workspace.verifiedTraceEntries({ enabled: true, trace: [
  { tool: "workspace.list", ok: true, output: "a" },
  { tool: "workspace.search", ok: false, output: "b" },
] }, true, new Set(["workspace.list", "workspace.search"])), [{ tool: "workspace.list", ok: true, output: "a" }]);
console.log("PASS ModelTab workspace module characterization");

const chatState = globalThis.ModelTabChatState;
const normalizedMessage = chatState.normalizeMessage({
  id: "m1",
  role: "unexpected",
  content: 42,
  attachments: [{ id: "safe" }, { id: "bad" }],
  error: 1,
}, { safeId: (id) => id, isSafeAttachment: (attachment) => attachment.id === "safe" });
assert.equal(normalizedMessage.role, "assistant");
assert.equal(normalizedMessage.content, "42");
assert.deepEqual(normalizedMessage.attachments, [{ id: "safe" }]);
assert.equal(normalizedMessage.error, true);
const strippedState = chatState.stripAttachmentPayloads({ conversations: [{ messages: [{ attachments: [
  { id: "a", name: "image", type: "image/png", size: 10, dataUrl: "data:image/png;base64,AAAA" },
] }] }] });
assert.deepEqual(strippedState.conversations[0].messages[0].attachments[0], {
  id: "a", name: "image", type: "image/png", size: 10, omitted: true,
});
const requestChat = chatState.chatForRequest({ id: "c", messages: [
  { id: "u1", role: "user", content: " old ", attachments: [{ id: "old" }] },
  { id: "a1", role: "assistant", content: " answer ", attachments: [] },
  { id: "bad", role: "assistant", content: "error", error: true },
  { id: "u2", role: "user", content: " latest ", attachments: [{ id: "latest" }] },
  { id: "pending", role: "assistant", content: "" },
] }, "pending", { autoTrim: true, recentTurns: 2, maxInputTokens: 1000, historyImages: false },
(value) => String(value).trim(), () => 10);
assert.deepEqual(requestChat.messages.map((message) => message.id), ["u1", "a1", "u2"]);
assert.deepEqual(requestChat.messages[0].attachments, []);
assert.deepEqual(requestChat.messages.at(-1).attachments, [{ id: "latest" }]);
const tokenTrimmed = chatState.trimMessagesForRequest(requestChat.messages, requestChat,
  { autoTrim: true, recentTurns: 10, maxInputTokens: 5, historyImages: true },
  (value) => String(value).trim(), (messages) => messages.length * 4);
assert.deepEqual(tokenTrimmed.map((message) => message.id), ["u2"]);
console.log("PASS ModelTab chat-state module characterization");
