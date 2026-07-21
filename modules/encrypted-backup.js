(function installModelTabEncryptedBackup(global) {
  "use strict";

  function isBoundedBase64(value, maxLength) {
    return Boolean(value)
      && value.length <= maxLength
      && value.length % 4 === 0
      && /^[A-Za-z0-9+/]+={0,2}$/.test(value);
  }

  function sanitizeVault(vault, maxDataChars) {
    if (!vault || typeof vault !== "object" || Array.isArray(vault)) throw new Error("Invalid encrypted key vault.");
    const clean = {
      v: Number(vault.v),
      kdf: String(vault.kdf || ""),
      salt: String(vault.salt || ""),
      iv: String(vault.iv || ""),
      data: String(vault.data || ""),
    };
    if (clean.v !== 1 || clean.kdf !== "PBKDF2-SHA256-210000") throw new Error("Unsupported key vault.");
    if (!isBoundedBase64(clean.salt, 256) || !isBoundedBase64(clean.iv, 256) || !isBoundedBase64(clean.data, maxDataChars)) {
      throw new Error("Invalid encrypted key vault.");
    }
    return clean;
  }

  function bytesToBase64(bytes, encode = global.btoa) {
    let binary = "";
    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });
    return encode(binary);
  }

  function base64ToBytes(base64, decode = global.atob) {
    return Uint8Array.from(decode(base64), (character) => character.charCodeAt(0));
  }

  async function deriveKey(passphrase, salt, cryptoApi = global.crypto) {
    const material = await cryptoApi.subtle.importKey(
      "raw",
      new TextEncoder().encode(passphrase),
      "PBKDF2",
      false,
      ["deriveKey"],
    );
    return cryptoApi.subtle.deriveKey(
      { name: "PBKDF2", salt, iterations: 210000, hash: "SHA-256" },
      material,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"],
    );
  }

  async function encryptJson(payload, passphrase, cryptoApi = global.crypto) {
    const salt = cryptoApi.getRandomValues(new Uint8Array(16));
    const iv = cryptoApi.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(passphrase, salt, cryptoApi);
    const data = new TextEncoder().encode(JSON.stringify(payload));
    const encrypted = await cryptoApi.subtle.encrypt({ name: "AES-GCM", iv }, key, data);
    return {
      v: 1,
      kdf: "PBKDF2-SHA256-210000",
      salt: bytesToBase64(salt),
      iv: bytesToBase64(iv),
      data: bytesToBase64(new Uint8Array(encrypted)),
    };
  }

  async function decryptJson(vault, passphrase, maxDataChars, cryptoApi = global.crypto) {
    const clean = sanitizeVault(vault, maxDataChars);
    const salt = base64ToBytes(clean.salt);
    const iv = base64ToBytes(clean.iv);
    const key = await deriveKey(passphrase, salt, cryptoApi);
    const decrypted = await cryptoApi.subtle.decrypt({ name: "AES-GCM", iv }, key, base64ToBytes(clean.data));
    return JSON.parse(new TextDecoder().decode(decrypted));
  }

  function sanitizeKeyMap(keys, isSafeObjectKey) {
    const clean = {};
    if (!keys || typeof keys !== "object" || Array.isArray(keys)) return clean;
    for (const [id, key] of Object.entries(keys)) {
      if (isSafeObjectKey(id) && typeof key === "string") clean[id] = key;
    }
    return clean;
  }

  global.ModelTabEncryptedBackup = Object.freeze({
    base64ToBytes,
    bytesToBase64,
    decryptJson,
    deriveKey,
    encryptJson,
    isBoundedBase64,
    sanitizeKeyMap,
    sanitizeVault,
    vaultCryptoAvailable: (cryptoApi = global.crypto) => Boolean(cryptoApi?.subtle && cryptoApi?.getRandomValues),
  });
})(globalThis);
