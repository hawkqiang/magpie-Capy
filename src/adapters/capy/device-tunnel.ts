import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import type { AccountSession } from "../../domain/account.ts";
import { accountKey } from "../../domain/account.ts";
import { CapyError, errorText, isAuthError } from "../../domain/errors.ts";
import { CAPTURED_HANDLERS, captureInvocation, extractJamId } from "../../application/capture.ts";
import type { HeadlessCredential, DeviceRuntimePort } from "../../ports/device-runtime.ts";
import type { CapyAppPort, DeviceInfo } from "../../ports/capy-app.ts";
import type { ClockPort, LoggerPort, SecretStorePort } from "../../ports/platform.ts";
import { dpapiProtect, dpapiUnprotect } from "../platform/dpapi.ts";
import { CONTRACT_VERSION, DEVICE_TUNNEL } from "./endpoints.ts";

const HEADLESS_NAME = "magpie-headless";
const READY_TIMEOUT_MS = 15_000;
const CONNECT_POLL_MS = 400;
const STATE_VERSION = 1;

function deviceOs(): string {
  if (process.platform === "win32") return "win32";
  if (process.platform === "darwin") return "darwin";
  return "linux";
}

function deviceArch(): string {
  return process.arch === "arm64" ? "arm64" : "x86_64";
}

/** 设备名优先用主机名（这台机器是 `baijiu`），没有就用系统用户名。 */
export function defaultDeviceName(): string {
  const override = String(process.env.MAGPIE_CAPY_DEVICE_NAME ?? "").trim();
  if (override) return override.slice(0, 80);
  let host = "";
  try { host = os.hostname(); } catch {}
  let user = "";
  try { user = os.userInfo().username; } catch {}
  if (!user) user = String(process.env.USERNAME ?? process.env.USER ?? "").trim();
  const raw = host || user || "capy-headless";
  return raw
    .replace(/[^A-Za-z0-9._@-]+/gu, "-")
    .replace(/^-+|-+$/gu, "")
    .slice(0, 80) || "capy-headless";
}

function stateDir(): string {
  const override = String(process.env.MAGPIE_CAPY_STATE_DIR ?? "").trim();
  if (override) return path.resolve(override);
  if (process.platform === "win32") {
    return path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local"), "magpie-capy");
  }
  if (process.platform === "darwin") {
    return path.join(os.homedir(), "Library", "Application Support", "magpie-capy");
  }
  return path.join(process.env.XDG_STATE_HOME || path.join(os.homedir(), ".local", "state"), "magpie-capy");
}

export class FileSecretStore implements SecretStorePort {
  private readonly baseDir: string;

  constructor(baseDir = stateDir()) {
    this.baseDir = baseDir;
  }

  async load(account: string): Promise<HeadlessCredential | null> {
    try {
      const doc = JSON.parse(fs.readFileSync(this.fileOf(account), "utf8")) as Record<string, unknown>;
      if (doc.version !== STATE_VERSION) return null;
      const orgId = String(doc.orgId ?? "");
      const deviceId = String(doc.deviceId ?? "");
      const name = String(doc.name ?? HEADLESS_NAME);
      const token = typeof doc.token === "string"
        ? doc.token
        : typeof doc.tokenCiphertext === "string"
          ? dpapiUnprotect(Buffer.from(doc.tokenCiphertext, "base64")).toString("utf8")
          : "";
      if (!orgId || !deviceId || !token.startsWith("capyd_")) return null;
      return { orgId, deviceId, name, token };
    } catch {
      return null;
    }
  }

  async save(account: string, credential: HeadlessCredential): Promise<void> {
    fs.mkdirSync(this.baseDir, { recursive: true });
    const file = this.fileOf(account);
    const tmp = `${file}.${process.pid}.tmp`;
    const secret = process.platform === "win32"
      ? { tokenCiphertext: dpapiProtect(credential.token) }
      : { token: credential.token };
    fs.writeFileSync(tmp, JSON.stringify({
      version: STATE_VERSION,
      orgId: credential.orgId,
      deviceId: credential.deviceId,
      name: credential.name,
      ...secret,
    }, null, 2), { mode: 0o600 });
    fs.renameSync(tmp, file);
    if (process.platform !== "win32") {
      try { fs.chmodSync(file, 0o600); } catch {}
    }
  }

  async clear(account: string): Promise<void> {
    try { fs.unlinkSync(this.fileOf(account)); } catch {}
  }

  private fileOf(account: string): string {
    const safe = account.replace(/[^A-Za-z0-9._-]+/gu, "_").slice(0, 120);
    return path.join(this.baseDir, `headless-${safe}.json`);
  }
}

interface TunnelFrame {
  readonly type?: string;
  readonly [key: string]: unknown;
}

interface StreamState {
  readonly streamId: number;
  readonly path: string;
  readonly headers: Record<string, string>;
  readonly expectedLength: number;
  readonly chunks: Buffer[];
  received: number;
  timer: ReturnType<typeof setTimeout> | null;
  done: boolean;
}

const STREAM_TIMEOUT_MS = 60_000;


function encodeDataFrame(streamId: number, body: Buffer): Buffer {
  const frame = Buffer.alloc(4 + body.length);
  frame.writeUInt32BE(streamId >>> 0, 0);
  body.copy(frame, 4);
  return frame;
}

function decodeDataFrame(bytes: Uint8Array): { streamId: number; body: Uint8Array } | null {
  if (bytes.length < 4) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return { streamId: view.getUint32(0), body: bytes.subarray(4) };
}

type MachineOutcome =
  | { readonly status: "succeeded"; readonly result: unknown }
  | { readonly status: "failed"; readonly error: { readonly code: string; readonly message: string } };

function ok(result: unknown): MachineOutcome {
  return { status: "succeeded", result };
}

function fail(code: string, message: string): MachineOutcome {
  return { status: "failed", error: { code, message } };
}

function ensureWorktree(base: string, raw: unknown): MachineOutcome {
  if (!raw) return ok({ root: "", created: false, checkouts: [] });
  const root = path.resolve(String(raw));
  const rel = path.relative(base, root);
  // 与上游一致：worktreeBase 本身是合法边界；只在它下面校验，绝不拿上一个 root 当基目录。
  if (rel === ".." || rel.startsWith(`..${path.sep}`) || path.isAbsolute(rel)) {
    return fail("MachineServer.Refused", "worktree root must be below worktreeBase");
  }
  let current = base;
  for (const part of rel ? rel.split(path.sep) : []) {
    current = path.join(current, part);
    if (fs.lstatSync(current, { throwIfNoEntry: false })?.isSymbolicLink()) {
      return fail("MachineServer.Refused", "worktree root contains a symbolic link");
    }
  }
  const created = !fs.existsSync(root);
  fs.mkdirSync(root, { recursive: true });
  return ok({ root, created, checkouts: [] });
}

export class WorktreeMachine {
  constructor(private readonly base: string) {}

  invoke(handler: string, params: Record<string, unknown>): MachineOutcome {
    if (handler === "worktree_ensure") return ensureWorktree(this.base, params.root);
    if (handler === "worktree_list") {
      return ok({ kind: "worktree_list", entries: [] });
    }
    if (handler === "volume_landed") {
      const mounts = Array.isArray(params.mounts) ? params.mounts : [];
      return ok({
        kind: "volume_landed",
        mounts: mounts.map((mount) => ({
          mountPath: String((mount as Record<string, unknown>)?.mountPath ?? ""),
          current: true,
        })),
        landing: false,
        checkpoints: false,
        directories: [],
        unretained: [],
        handback: true,
      });
    }
    if (handler === "volume_probe") {
      const mounts = Array.isArray(params.mounts) ? params.mounts : [];
      return ok({
        mounts: mounts.map((mount) => ({
          mountPath: String((mount as Record<string, unknown>)?.mountPath ?? ""),
          state: "current",
        })),
      });
    }
    // 中性拒绝：不触发模型的防提示词注入检测；真正需要工具的请求已通过方案 B 拦截并短路返回 DSH。
    return ok({
      kind: "failure",
      isError: true,
      message: "Tool execution is delegated to the client harness.",
    });
  }
}

class HeadlessDevice {
  private readonly credential: HeadlessCredential;
  private readonly WebSocketImpl: typeof WebSocket;
  private readonly worktreeBase: string;
  private ws: WebSocket | null = null;
  private ready = false;
  private connectPromise: Promise<void> | null = null;
  private readyResolve: (() => void) | null = null;
  private readyReject: ((error: Error) => void) | null = null;
  private readonly streams = new Map<number, StreamState>();
  private readonly machine: WorktreeMachine;

  constructor(options: {
    readonly credential: HeadlessCredential;
    readonly WebSocketImpl?: typeof WebSocket;
    readonly worktreeBase?: string;
  }) {
    this.credential = options.credential;
    const Impl = options.WebSocketImpl ?? globalThis.WebSocket;
    if (typeof Impl !== "function") {
      throw new CapyError("upstream_unavailable", "当前运行时没有 WebSocket（需要 Bun / Node 22+）");
    }
    this.WebSocketImpl = Impl;
    this.worktreeBase = options.worktreeBase ?? path.join(os.homedir(), ".capy", "worktrees");
    this.machine = new WorktreeMachine(this.worktreeBase);
  }

  get info(): DeviceInfo {
    return {
      id: this.credential.deviceId,
      name: this.credential.name,
      connected: this.ready,
    };
  }

  async ensure(timeoutMs = READY_TIMEOUT_MS): Promise<void> {
    if (this.ready && this.ws?.readyState === 1) return;
    if (this.connectPromise) return await this.connectPromise;
    this.connectPromise = this.connect(timeoutMs);
    try {
      await this.connectPromise;
    } finally {
      this.connectPromise = null;
    }
  }

  close(): void {
    this.ready = false;
    try { this.ws?.close(1000, "headless closed"); } catch {}
    this.ws = null;
  }

  private async connect(timeoutMs: number): Promise<void> {
    this.ready = false;
    let ws: WebSocket;
    try {
      ws = new this.WebSocketImpl(DEVICE_TUNNEL, {
        headers: { authorization: `Bearer ${this.credential.token}` },
      } as unknown as string[]);
    } catch (error) {
      throw tunnelError(error, "连接 Capy 设备隧道失败");
    }
    this.ws = ws;
    ws.binaryType = "arraybuffer";
    const ready = new Promise<void>((resolve, reject) => {
      this.readyResolve = resolve;
      this.readyReject = reject;
    });
    const timer = setTimeout(() => {
      const failure = new Error(`连接 Capy 设备隧道超时（${Math.round(timeoutMs / 1000)}s）`);
      (failure as Error & { code?: string }).code = "device_connect_timeout";
      this.readyReject?.(failure);
      try { ws.close(4000, "ready timeout"); } catch {}
    }, Math.max(3000, timeoutMs));
    timer.unref?.();

    ws.addEventListener("open", () => {
      this.send({
        type: "hello",
        contractVersion: CONTRACT_VERSION,
        deviceId: this.credential.deviceId,
        hostname: os.hostname(),
        os: deviceOs(),
        workspaces: [],
        worktreeBase: this.worktreeBase,
        clientVersion: "magpie-headless 1.0",
      });
    });
    ws.addEventListener("message", (event) => this.onMessage(event));
    ws.addEventListener("close", (event) => {
      this.ready = false;
      this.ws = null;
      clearTimeout(timer);
      if (!this.readyResolve) return;
      const reason = String(event.reason || "");
      const rejected = [4001, 4003, 4401, 4403].includes(Number(event.code))
        || /auth|token|unauthor|forbidden/iu.test(reason);
      const failure = new Error(`Capy 设备隧道已关闭（${event.code}${reason ? `：${reason}` : ""}）`);
      (failure as Error & { code?: string }).code = rejected ? "device_token_rejected" : "device_connect_failed";
      this.readyReject?.(failure);
    });
    ws.addEventListener("error", () => {
      const failure = new Error("Capy 设备隧道连接失败");
      (failure as Error & { code?: string }).code = "device_connect_failed";
      this.readyReject?.(failure);
    });

    try {
      await ready;
    } finally {
      clearTimeout(timer);
      this.readyResolve = null;
      this.readyReject = null;
    }
    this.ready = true;
  }

  private send(frame: Record<string, unknown>): void {
    if (!this.ws || this.ws.readyState !== 1) return;
    try { this.ws.send(JSON.stringify(frame)); } catch {}
  }

  private sendBinary(bytes: Buffer): void {
    if (!this.ws || this.ws.readyState !== 1) return;
    try { this.ws.send(bytes); } catch {}
  }

  private onMessage(event: MessageEvent): void {
    if (typeof event.data === "string") {
      this.onControl(event.data);
      return;
    }
    const raw = event.data instanceof ArrayBuffer
      ? new Uint8Array(event.data)
      : ArrayBuffer.isView(event.data)
        ? new Uint8Array(event.data.buffer, event.data.byteOffset, event.data.byteLength)
        : null;
    if (!raw) return;
    const frame = decodeDataFrame(raw);
    if (!frame) return;
    const stream = this.streams.get(frame.streamId);
    if (!stream || stream.done) return;
    const chunk = Buffer.from(frame.body);
    stream.chunks.push(chunk);
    stream.received += chunk.length;
    if (stream.expectedLength > 0 && stream.received >= stream.expectedLength) this.runStream(stream);
  }

  private onControl(text: string): void {
    let frame: TunnelFrame;
    try { frame = JSON.parse(text) as TunnelFrame; } catch { return; }
    const type = String(frame.type ?? "");
    if (type === "ping") {
      this.send({ type: "pong" });
      return;
    }
    if (type === "session-config") {
      this.send({ type: "workspaces-changed", workspaces: [] });
      this.send({ type: "ready" });
      this.readyResolve?.();
      return;
    }
    if (type === "open") {
      const streamId = Number(frame.streamId);
      if (!Number.isInteger(streamId)) return;
      const headers: Record<string, string> = {};
      if (frame.headers && typeof frame.headers === "object") {
        for (const [key, value] of Object.entries(frame.headers as Record<string, unknown>)) {
          headers[key.toLowerCase()] = String(value);
        }
      }
      const expectedLength = Number(headers["content-length"] ?? 0);
      const timer = setTimeout(() => {
        const stream = this.streams.get(streamId);
        if (!stream || stream.done) return;
        stream.done = true;
        this.streams.delete(streamId);
        this.respond(streamId, 200, fail("MachineServer.Timeout", "machine RPC stream timed out"));
      }, STREAM_TIMEOUT_MS);
      timer.unref?.();
      this.streams.set(streamId, {
        streamId,
        path: String(frame.path ?? ""),
        headers,
        expectedLength: Number.isFinite(expectedLength) && expectedLength > 0 ? expectedLength : 0,
        chunks: [],
        received: 0,
        timer,
        done: false,
      });
      return;
    }
    if (type === "close") {
      const streamId = Number(frame.streamId);
      const stream = this.streams.get(streamId);
      if (stream) this.runStream(stream);
    }
  }

  private runStream(stream: StreamState): void {
    if (stream.done) return;
    stream.done = true;
    if (stream.timer) clearTimeout(stream.timer);
    stream.timer = null;
    void this.handleStream(stream).catch((error) => {
      this.respond(stream.streamId, 200, fail("MachineServer.Internal", errorText(error)));
    });
  }

  private async handleStream(stream: StreamState): Promise<void> {
    this.streams.delete(stream.streamId);
    let payload: unknown = null;
    try {
      const body = stream.chunks.length > 0 ? Buffer.concat(stream.chunks) : Buffer.alloc(0);
      payload = body.length > 0 ? JSON.parse(body.toString("utf8")) : null;
    } catch {}
    const record = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
    let result: MachineOutcome;
    if (stream.path.startsWith("/v1/git/capture")) {
      result = ok({ repos: [] });
    } else if (stream.path.startsWith("/v1/invocations")) {
      const handler = String(record.handler ?? "");
      const params = record.params && typeof record.params === "object"
        ? record.params as Record<string, unknown>
        : {};
      // 方案 B：按 jamId 截获模型发出的真实 bash/read/write/edit 调用，供对应请求即时短路转交 DSH。
      if (CAPTURED_HANDLERS.has(handler.toLowerCase())) {
        const jamId = extractJamId(
          stream.headers["x-capy-workspace"],
          typeof record.invocationId === "string" ? record.invocationId : undefined,
          typeof record.cwd === "string" ? record.cwd : undefined,
        );
        try { captureInvocation(handler, params, jamId); } catch { /* 捕获失败不影响拒绝 */ }
      }
      result = this.machine.invoke(handler, params);
    } else {
      result = fail("MachineServer.Unavailable", `未实现的路径 ${stream.path}`);
    }
    this.respond(stream.streamId, 200, result);
  }

  private respond(streamId: number, status: number, payload: unknown): void {
    const body = Buffer.from(JSON.stringify(payload));
    this.send({
      type: "response",
      streamId,
      status,
      headers: {
        "content-type": "application/json",
        "content-length": String(body.length),
      },
    });
    this.sendBinary(encodeDataFrame(streamId, body));
    this.send({ type: "close", streamId });
  }
}

function tunnelError(error: unknown, prefix: string): Error {
  const message = `${prefix}：${error instanceof Error ? error.message : String(error)}`;
  const failure = new Error(message, { cause: error });
  (failure as Error & { code?: string }).code = /40[13]|unauthor|forbidden/iu.test(message)
    ? "device_token_rejected"
    : "device_connect_failed";
  return failure;
}

function tokenRejected(error: unknown): boolean {
  return (error as { code?: unknown } | null)?.code === "device_token_rejected";
}

export class HeadlessDeviceRuntime implements DeviceRuntimePort {
  private readonly app: CapyAppPort;
  private readonly store: SecretStorePort;
  private readonly clock: ClockPort;
  private readonly logger: LoggerPort | undefined;
  private readonly deviceName: string;
  private readonly devices = new Map<string, HeadlessDevice>();

  constructor(options: {
    readonly app: CapyAppPort;
    readonly store: SecretStorePort;
    readonly clock: ClockPort;
    readonly logger?: LoggerPort;
    readonly deviceName?: string;
  }) {
    this.app = options.app;
    this.store = options.store;
    this.clock = options.clock;
    this.logger = options.logger;
    this.deviceName = options.deviceName?.trim() || defaultDeviceName();
  }

  async ensure(session: AccountSession, signal?: AbortSignal): Promise<DeviceInfo> {
    return await this.ensureOne(session, signal);
  }

  close(): void {
    for (const device of this.devices.values()) device.close();
    this.devices.clear();
  }

  private async ensureOne(session: AccountSession, signal?: AbortSignal): Promise<DeviceInfo> {
    const key = accountKey(session);
    const existing = this.devices.get(key);
    if (existing) {
      try {
        await existing.ensure();
        return existing.info;
      } catch {
        existing.close();
        this.devices.delete(key);
      }
    }

    const jwt = await this.app.sessionJwt(session.clerk, signal);
    let credential = await this.store.load(key);
    if (!credential || credential.orgId !== session.orgId) {
      credential = await this.pair(session, jwt, signal);
    } else if (credential.name !== this.deviceName) {
      try {
        await this.app.renameDevice(jwt, session.orgId, credential.deviceId, this.deviceName, signal);
        credential = { ...credential, name: this.deviceName };
        await this.store.save(key, credential);
      } catch (error) {
        this.logger?.warn("capy device rename failed", {
          deviceId: credential.deviceId,
          message: errorText(error),
        });
      }
    }

    let device: HeadlessDevice;
    try {
      device = await this.connect(credential, signal);
    } catch (error) {
      if (!tokenRejected(error)) throw error;
      credential = await this.pair(session, jwt, signal);
      device = await this.connect(credential, signal);
    }
    const connected = await this.waitConnected(jwt, session.orgId, credential.deviceId, signal);
    if (!connected) {
      device.close();
      throw new CapyError("upstream_unavailable", "无头设备已连上隧道，但服务端没有标记 connected");
    }
    this.devices.set(key, device);
    return { id: credential.deviceId, name: credential.name, connected: true };
  }



  private async connect(credential: HeadlessCredential, signal?: AbortSignal): Promise<HeadlessDevice> {
    let lastError: unknown = null;
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      const device = new HeadlessDevice({ credential });
      try {
        await device.ensure();
        return device;
      } catch (error) {
        lastError = error;
        this.logger?.warn("capy device connect failed", {
          attempt,
          code: String((error as { code?: unknown } | null)?.code ?? ""),
          message: errorText(error),
        });
        device.close();
        if (tokenRejected(error) || attempt === 3) break;
        await this.clock.sleep(800 * attempt, signal);
      }
    }
    throw lastError instanceof Error
      ? lastError
      : new CapyError("upstream_unavailable", `无头设备连接失败：${String(lastError)}`);
  }

  private async pair(session: AccountSession, jwt: string, signal?: AbortSignal): Promise<HeadlessCredential> {
    const start = await this.app.startDeviceCode(jwt, {
      hostname: os.hostname(),
      os: deviceOs(),
      arch: deviceArch(),
    }, signal);
    try {
      await this.app.approveDeviceCode(jwt, session.orgId, start.userCode, this.deviceName, signal);
    } catch (error) {
      const hint = start.verificationUrl ? `；可在浏览器打开 ${start.verificationUrl} 手动批准` : "";
      throw new CapyError("device_pair_failed", `Capy 设备码自动批准失败：${errorText(error)}${hint}`);
    }
    let intervalMs = start.pollIntervalSeconds * 1000;
    const deadline = this.clock.now() + start.expiresInSeconds * 1000;
    while (this.clock.now() < deadline) {
      let poll;
      try {
        poll = await this.app.pollDeviceCode(jwt, start.deviceCode, signal);
      } catch (error) {
        if ((error as { status?: unknown } | null)?.status === 401) throw error;
        await this.clock.sleep(intervalMs, signal);
        continue;
      }
      if (poll.status === "approved") {
        const credential: HeadlessCredential = {
          orgId: poll.enrolled.orgId || session.orgId,
          deviceId: poll.enrolled.deviceId,
          name: this.deviceName,
          token: poll.enrolled.token,
        };
        await this.store.save(accountKey(session), credential);
        return credential;
      }
      if (poll.status === "denied" || poll.status === "expired") {
        throw new CapyError("device_pair_failed", `Capy 设备码配对${poll.status === "denied" ? "被拒绝" : "已过期"}`);
      }
      if (poll.status === "slow_down") intervalMs = Math.min(10_000, Math.round(intervalMs * 1.5));
      await this.clock.sleep(intervalMs, signal);
    }
    throw new CapyError("upstream_timeout", "等待 Capy 设备码批准超时");
  }

  private async waitConnected(
    jwt: string,
    orgId: string,
    deviceId: string,
    signal?: AbortSignal,
  ): Promise<boolean> {
    const deadline = this.clock.now() + 20_000;
    let attempt = 0;
    while (this.clock.now() < deadline) {
      try {
        const devices = await this.app.listDevices(jwt, orgId, signal);
        const hit = devices.find((device) => device.id === deviceId);
        if (hit?.connected) return true;
      } catch (error) {
        if (signal?.aborted || isAuthError(error)) throw error;
      }
      attempt += 1;
      await this.clock.sleep(Math.min(3_000, CONNECT_POLL_MS * (2 ** Math.min(attempt, 4))), signal);
    }
    return false;
  }
}
