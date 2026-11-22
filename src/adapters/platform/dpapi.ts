import { execFileSync } from "node:child_process";
import crypto from "node:crypto";

const V10_PREFIX = "v10";
const NONCE_BYTES = 12;
const TAG_BYTES = 16;
const AES_KEY_BYTES = 32;
const DPAPI_TIMEOUT_MS = 15_000;

function powershell(script: string): string {
  return execFileSync(
    "powershell.exe",
    ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", script],
    { encoding: "utf8", timeout: DPAPI_TIMEOUT_MS, windowsHide: true, maxBuffer: 1024 * 1024 },
  ).trim();
}

function dpapiTransform(encoded: string, op: "Protect" | "Unprotect"): string {
  if (process.platform !== "win32") throw new Error("DPAPI 只在 Windows 可用");
  const script = `$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Security
$b=[Convert]::FromBase64String('${encoded}')
$p=[System.Security.Cryptography.ProtectedData]::${op}($b,$null,[System.Security.Cryptography.DataProtectionScope]::CurrentUser)
[Convert]::ToBase64String($p)`;
  return powershell(script);
}

export function dpapiUnprotect(blob: Uint8Array): Buffer {
  return Buffer.from(dpapiTransform(Buffer.from(blob).toString("base64"), "Unprotect"), "base64");
}

export function dpapiProtect(text: string): string {
  return dpapiTransform(Buffer.from(text, "utf8").toString("base64"), "Protect");
}

/** Chromium "v10" + 12-byte nonce + AES-256-GCM ciphertext + 16-byte tag。 */
export function decryptChromiumAesGcm(ciphertextBase64: string, key: Uint8Array): string {
  const raw = Buffer.from(ciphertextBase64, "base64");
  if (raw.length < V10_PREFIX.length + NONCE_BYTES + TAG_BYTES) {
    throw new Error("ciphertext 长度异常");
  }
  if (raw.subarray(0, V10_PREFIX.length).toString("latin1") !== V10_PREFIX) {
    throw new Error("ciphertext 不是 v10 格式");
  }
  const nonce = raw.subarray(V10_PREFIX.length, V10_PREFIX.length + NONCE_BYTES);
  const body = raw.subarray(V10_PREFIX.length + NONCE_BYTES, raw.length - TAG_BYTES);
  const tag = raw.subarray(raw.length - TAG_BYTES);
  const decipher = crypto.createDecipheriv("aes-256-gcm", Buffer.from(key), nonce);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(body), decipher.final()]).toString("utf8").trim();
}

export function coerceAesKey(value: unknown): Buffer {
  let key: Buffer | null = null;
  if (ArrayBuffer.isView(value)) key = Buffer.from(value.buffer, value.byteOffset, value.byteLength);
  else if (value instanceof ArrayBuffer) key = Buffer.from(value);
  else if (typeof value === "string" && /^[0-9a-fA-F]{64}$/u.test(value.trim())) {
    key = Buffer.from(value.trim(), "hex");
  }
  if (!key || key.length !== AES_KEY_BYTES) throw new Error("AES key 必须是 32 字节");
  return key;
}

