import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const listeners = new Map();
const posted = [];
const sandbox = {
  Array,
  ArrayBuffer,
  BigInt,
  DataView,
  Date,
  Error,
  Math,
  Number,
  String,
  TextDecoder,
  Uint8Array,
  WebAssembly,
  self: {
    addEventListener(type, listener) {
      listeners.set(type, listener);
    },
    postMessage(message) {
      posted.push(message);
    }
  }
};

vm.createContext(sandbox);
vm.runInContext(readFileSync("workspace-worker.js", "utf8"), sandbox, { filename: "workspace-worker.js" });

function inspect(name, bytes) {
  posted.length = 0;
  listeners.get("message")({
    data: {
      id: name,
      type: "inspect",
      payload: {
        name,
        path: name,
        size: bytes.length,
        type: "application/octet-stream",
        sha256: "fixture",
        sampleStrategy: `fixture ${bytes.length} bytes`,
        bytes: Uint8Array.from(bytes).buffer
      }
    }
  });
  assert.equal(posted.length, 1);
  assert.equal(posted[0].ok, true, `${name} should inspect successfully`);
  return posted[0].result;
}

const pe = new Uint8Array(192);
pe[0] = 0x4d;
pe[1] = 0x5a;
new DataView(pe.buffer).setUint32(0x3c, 0x80, true);
pe[0x80] = 0x50;
pe[0x81] = 0x45;
new DataView(pe.buffer).setUint16(0x84, 0x8664, true);
new DataView(pe.buffer).setUint16(0x86, 2, true);
new DataView(pe.buffer).setUint16(0x94, 0xf0, true);
new DataView(pe.buffer).setUint16(0x98, 0x20b, true);
assert.equal(inspect("sample.exe", pe).format, "PE/COFF executable");

assert.equal(inspect("sample.elf", [0x7f, 0x45, 0x4c, 0x46, 2, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0x3e, 0]).format, "ELF executable/object");

const wasm = inspect("sample.wasm", [0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00]);
assert.equal(wasm.format, "WebAssembly module");
assert.equal(typeof wasm.wasmAvailable, "boolean");

const text = inspect("README.txt", new TextEncoder().encode("hello ModelTab workspace strings"));
assert.equal(text.format, "text/structured text");
assert.ok(text.strings.some((value) => value.includes("ModelTab")));
assert.ok(text.hexdump.includes("00000000"));

posted.length = 0;
listeners.get("message")({ data: { id: "bad", type: "write", payload: {} } });
assert.equal(posted[0].ok, false);
assert.match(posted[0].error, /Unsupported workspace worker task/);

console.log("PASS workspace worker executable inspection gate");
