(function installModelTabPersistence(global) {
  "use strict";

  function migrateLegacyStorage(storage, keys) {
    if (!storage.getItem(keys.state) && storage.getItem(keys.legacyState)) {
      storage.setItem(keys.state, storage.getItem(keys.legacyState));
    }
    if (!storage.getItem(keys.vault) && storage.getItem(keys.legacyVault)) {
      storage.setItem(keys.vault, storage.getItem(keys.legacyVault));
    }
  }

  function readState(storage, key, assertSafeObjectKeys) {
    const raw = storage.getItem(key) || "";
    if (!raw) return { found: false, raw, value: null };
    const value = JSON.parse(raw);
    assertSafeObjectKeys(value);
    return { found: true, raw, value };
  }

  function quarantineCorruptState(storage, key, raw, error, maxBytes, compact) {
    if (!raw) return "";
    try {
      storage.setItem(key, JSON.stringify({
        savedAt: new Date().toISOString(),
        reason: compact(error?.message || "State could not be loaded.", 200),
        raw: String(raw).slice(0, maxBytes),
      }));
      return "Saved local data could not be loaded. ModelTab restored defaults and kept a local recovery snapshot in this browser.";
    } catch {
      return "Saved local data could not be loaded. ModelTab restored defaults.";
    }
  }

  function cleanStateForStorage(state) {
    const clean = structuredClone(state);
    for (const provider of clean.providers || []) delete provider.apiKey;
    return clean;
  }

  function saveState(storage, key, state, stripAttachmentPayloads) {
    const clean = cleanStateForStorage(state);
    try {
      storage.setItem(key, JSON.stringify(clean));
      return "ok";
    } catch {
      try {
        storage.setItem(key, JSON.stringify(stripAttachmentPayloads(clean)));
        return "stripped";
      } catch {
        return "failed";
      }
    }
  }

  global.ModelTabPersistence = Object.freeze({
    cleanStateForStorage,
    migrateLegacyStorage,
    quarantineCorruptState,
    readState,
    saveState,
  });
})(globalThis);
