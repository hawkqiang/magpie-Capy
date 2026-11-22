import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { CapyError } from "../../domain/errors.ts";
import type { LoginCredential } from "../../ports/login.ts";
import { coerceAesKey, decryptChromiumAesGcm, dpapiUnprotect } from "../platform/dpapi.ts";
import { decodeJwtPayload } from "../platform/jwt.ts";

const DPAPI_PREFIX = "DPAPI";

function capyDir(): string {
  const appData = String(process.env.APPDATA ?? "").trim();
  return path.join(appData || path.join(os.homedir(), "AppData", "Roaming"), "Capy");
}

function readJson(file: string, label: string): Record<string, unknown> {
  let text: string;
  try {
    text = fs.readFileSync(file, "utf8");
  } catch {
    throw new CapyError("sign_in_required", `未找到 Capy 的 ${label}，请先在 Capy 桌面端登录`);
  }
  try {
    const value: unknown = JSON.parse(text);
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("not object");
    return value as Record<string, unknown>;
  } catch {
    throw new CapyError("invalid_request", `Capy 的 ${label} 不是有效 JSON`);
  }
}

function stringOf(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function jwtPayload(token: string): Record<string, unknown> {
  const value = decodeJwtPayload(token);
  if (!value) throw new CapyError("sign_in_required", "Capy 登录凭据的 JWT payload 无法解析");
  return value;
}

interface CapyInstallCredential extends LoginCredential {
  readonly deviceId: string;
}

/** 只读 `%APPDATA%\\Capy` 的登录态；不启动 Capy，也不碰设备 token。 */
export function readCapyInstall(dir = capyDir()): CapyInstallCredential {
  if (process.platform !== "win32") {
    throw new CapyError(
      "invalid_request",
      "本机导入只支持 Windows（Capy 本地凭据用 DPAPI 加密）；请用浏览器登录",
    );
  }

  const session = readJson(path.join(dir, "session-credential.json"), "session-credential.json");
  const device = readJson(path.join(dir, "device-credentials.json"), "device-credentials.json");
  const localState = readJson(path.join(dir, "Local State"), "Local State");

  const sessionId = stringOf(session.sessionId);
  const userId = stringOf(session.userId);
  const ciphertext = stringOf(session.ciphertext);
  if (!sessionId || !userId || !ciphertext) {
    throw new CapyError("invalid_request", "Capy 的 session-credential.json 缺少字段");
  }

  const orgs = device.orgs;
  if (!orgs || typeof orgs !== "object" || Array.isArray(orgs)) {
    throw new CapyError("invalid_request", "Capy 的 device-credentials.json 缺少 orgs");
  }
  const orgId = Object.keys(orgs as Record<string, unknown>)[0] ?? "";
  const entry = orgId ? (orgs as Record<string, unknown>)[orgId] : null;
  const deviceId = entry && typeof entry === "object" && !Array.isArray(entry)
    ? stringOf((entry as Record<string, unknown>).deviceId)
    : "";
  if (!orgId || !deviceId) {
    throw new CapyError("sign_in_required", "Capy 桌面端还没有已登录的组织/设备");
  }

  const osCrypt = localState.os_crypt;
  const encryptedKey = osCrypt && typeof osCrypt === "object" && !Array.isArray(osCrypt)
    ? stringOf((osCrypt as Record<string, unknown>).encrypted_key)
    : "";
  if (!encryptedKey) {
    throw new CapyError("invalid_request", "Capy 的 Local State 缺少 os_crypt.encrypted_key");
  }
  const raw = Buffer.from(encryptedKey, "base64");
  if (raw.subarray(0, DPAPI_PREFIX.length).toString("latin1") !== DPAPI_PREFIX) {
    throw new CapyError("invalid_request", "Capy 的本地密钥不是 DPAPI 格式");
  }

  let clientJwt = "";
  try {
    const key = coerceAesKey(dpapiUnprotect(raw.subarray(DPAPI_PREFIX.length)));
    clientJwt = decryptChromiumAesGcm(ciphertext, key);
  } catch (error) {
    throw new CapyError(
      "sign_in_required",
      "无法解密 Capy 本地登录态，请确认当前 Windows 用户就是登录 Capy 的用户，或重新登录",
      { cause: error },
    );
  }

  const claims = jwtPayload(clientJwt);
  const clientId = stringOf(claims.id);
  if (!clientId) throw new CapyError("sign_in_required", "Capy 登录凭据缺少 Clerk client id");

  return {
    clientJwt,
    sessionId,
    userId,
    clientId,
    orgId,
    deviceId,
    source: "local",
  };
}
