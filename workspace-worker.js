const WASM_EMPTY_MODULE = new Uint8Array([0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00]);

self.addEventListener("message", (event) => {
  const { id, type, payload } = event.data || {};
  try {
    if (type !== "inspect") throw new Error("Unsupported workspace worker task.");
    self.postMessage({ id, ok: true, result: inspectBytes(payload) });
  } catch (error) {
    self.postMessage({ id, ok: false, error: error.message || String(error) });
  }
});

function inspectBytes(payload) {
  const bytes = new Uint8Array(payload.bytes || []);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const analysis = {
    name: String(payload.name || ""),
    path: String(payload.path || ""),
    size: Number(payload.size || 0),
    type: String(payload.type || "application/octet-stream"),
    sha256: String(payload.sha256 || ""),
    sampleStrategy: String(payload.sampleStrategy || `sampled bytes: ${bytes.length}`),
    format: detectFormat(bytes, view),
    wasmAvailable: typeof WebAssembly !== "undefined" && WebAssembly.validate(WASM_EMPTY_MODULE),
    details: [],
    strings: extractStrings(bytes, 24),
    hexdump: hexdump(bytes, 256)
  };
  analysis.details = formatDetails(analysis.format, bytes, view, analysis.sampleStrategy);
  return analysis;
}

function detectFormat(bytes, view) {
  if (bytes.length >= 4 && bytes[0] === 0x7f && bytes[1] === 0x45 && bytes[2] === 0x4c && bytes[3] === 0x46) return "ELF executable/object";
  if (bytes.length >= 2 && bytes[0] === 0x4d && bytes[1] === 0x5a) return "PE/COFF executable";
  if (bytes.length >= 4) {
    const be = view.getUint32(0, false);
    const le = view.getUint32(0, true);
    if ([0xfeedface, 0xfeedfacf, 0xcafebabe, 0xcafebabf].includes(be) || [0xfeedface, 0xfeedfacf].includes(le)) return "Mach-O binary";
    if (be === 0x0061736d) return "WebAssembly module";
    if (be === 0x89504e47) return "PNG image";
    if (be === 0x25504446) return "PDF document";
    if (bytes[0] === 0x50 && bytes[1] === 0x4b) return "ZIP/JAR/APK archive";
  }
  return isLikelyText(bytes) ? "text/structured text" : "unknown binary";
}

function formatDetails(format, bytes, view, sampleStrategy) {
  const details = [
    sampleStrategy,
    `entropy: ${entropy(bytes).toFixed(2)} bits/byte`
  ];
  if (format.startsWith("PE/COFF")) details.push(...peDetails(bytes, view));
  if (format.startsWith("ELF")) details.push(...elfDetails(bytes, view));
  if (format.startsWith("Mach-O")) details.push(...machoDetails(bytes, view));
  if (format.startsWith("WebAssembly")) details.push(`wasm header version: ${bytes.length >= 8 ? view.getUint32(4, true) : "unknown"}`);
  return details;
}

function peDetails(bytes, view) {
  if (bytes.length < 0x40) return ["PE header incomplete in sample"];
  const peOffset = view.getUint32(0x3c, true);
  if (peOffset + 24 > bytes.length) return [`PE header offset ${peOffset} outside sample`];
  if (bytes[peOffset] !== 0x50 || bytes[peOffset + 1] !== 0x45) return ["MZ header found but PE signature missing"];
  const machine = view.getUint16(peOffset + 4, true);
  const sections = view.getUint16(peOffset + 6, true);
  const timestamp = view.getUint32(peOffset + 8, true);
  const optionalSize = view.getUint16(peOffset + 20, true);
  const optionalOffset = peOffset + 24;
  const optionalMagic = optionalOffset + 2 <= bytes.length ? view.getUint16(optionalOffset, true) : 0;
  const sectionOffset = optionalOffset + optionalSize;
  const names = [];
  for (let index = 0; index < sections && index < 8; index += 1) {
    const offset = sectionOffset + index * 40;
    if (offset + 8 > bytes.length) break;
    names.push(ascii(bytes.subarray(offset, offset + 8)).replace(/\0+$/g, ""));
  }
  return [
    `machine: 0x${machine.toString(16)}`,
    `sections: ${sections}${names.length ? ` (${names.join(", ")})` : ""}`,
    `timestamp: ${timestamp ? new Date(timestamp * 1000).toISOString() : "0"}`,
    `optional header: ${optionalMagic === 0x20b ? "PE32+" : optionalMagic === 0x10b ? "PE32" : `0x${optionalMagic.toString(16)}`}`
  ];
}

function elfDetails(bytes, view) {
  if (bytes.length < 20) return ["ELF header incomplete in sample"];
  const is64 = bytes[4] === 2;
  const little = bytes[5] !== 2;
  const type = view.getUint16(16, little);
  const machine = view.getUint16(18, little);
  const entry = is64 && bytes.length >= 32
    ? `0x${view.getBigUint64(24, little).toString(16)}`
    : bytes.length >= 28 ? `0x${view.getUint32(24, little).toString(16)}` : "unknown";
  return [
    `class: ${is64 ? "64-bit" : "32-bit"}`,
    `endian: ${little ? "little" : "big"}`,
    `type: 0x${type.toString(16)}`,
    `machine: 0x${machine.toString(16)}`,
    `entry: ${entry}`
  ];
}

function machoDetails(bytes, view) {
  if (bytes.length < 16) return ["Mach-O header incomplete in sample"];
  const magic = view.getUint32(0, false);
  const little = magic === 0xcefaedfe || magic === 0xcffaedfe;
  return [
    `magic: 0x${magic.toString(16)}`,
    `cpu type: 0x${view.getUint32(4, little).toString(16)}`,
    `file type: 0x${view.getUint32(12, little).toString(16)}`
  ];
}

function extractStrings(bytes, limit) {
  const strings = [];
  let current = "";
  for (const byte of bytes) {
    if (byte >= 32 && byte <= 126) {
      current += String.fromCharCode(byte);
    } else {
      if (current.length >= 4) strings.push(current.slice(0, 180));
      current = "";
      if (strings.length >= limit) break;
    }
  }
  if (current.length >= 4 && strings.length < limit) strings.push(current.slice(0, 180));
  return strings;
}

function hexdump(bytes, limit) {
  const rows = [];
  const size = Math.min(bytes.length, limit);
  for (let offset = 0; offset < size; offset += 16) {
    const slice = bytes.subarray(offset, offset + 16);
    const hex = [...slice].map((byte) => byte.toString(16).padStart(2, "0")).join(" ").padEnd(47, " ");
    const text = [...slice].map((byte) => byte >= 32 && byte <= 126 ? String.fromCharCode(byte) : ".").join("");
    rows.push(`${offset.toString(16).padStart(8, "0")}  ${hex}  ${text}`);
  }
  return rows.join("\n");
}

function entropy(bytes) {
  if (!bytes.length) return 0;
  const counts = new Array(256).fill(0);
  bytes.forEach((byte) => { counts[byte] += 1; });
  return counts.reduce((total, count) => {
    if (!count) return total;
    const p = count / bytes.length;
    return total - p * Math.log2(p);
  }, 0);
}

function isLikelyText(bytes) {
  const limit = Math.min(bytes.length, 4096);
  if (!limit) return true;
  let bad = 0;
  for (let index = 0; index < limit; index += 1) {
    const byte = bytes[index];
    if (byte === 0) return false;
    if (byte < 7 || (byte > 14 && byte < 32)) bad += 1;
  }
  return bad / limit < 0.02;
}

function ascii(bytes) {
  return [...bytes].map((byte) => byte >= 32 && byte <= 126 ? String.fromCharCode(byte) : "\0").join("");
}
