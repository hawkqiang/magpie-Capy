import { spawn, type ChildProcess } from "node:child_process";
import { createServer } from "node:net";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { CapyError } from "../../domain/errors.ts";
import type { LoginCredential, LoginSourcePort } from "../../ports/login.ts";
import { decodeJwtPayload } from "../platform/jwt.ts";
import { readCapyInstall } from "./local-login.ts";

const LOGIN_URL = "https://capy.ai/sign-in";
const POLL_MS = 500;
const DEFAULT_TIMEOUT_MS = 5 * 60_000;

const WIN_BROWSERS = [
  ["Google", "Chrome", "Application", "chrome.exe"],
  ["Microsoft", "Edge", "Application", "msedge.exe"],
  ["Chromium", "Application", "chrome.exe"],
  ["BraveSoftware", "Brave-Browser", "Application", "brave.exe"],
] as const;

function exists(file: string): boolean {
  try { return fs.statSync(file).isFile(); } catch { return false; }
}

function findBrowser(): string {
  const explicit = String(process.env.MAGPIE_CAPY_BROWSER ?? "").trim().replace(/^"|"$/gu, "");
  if (explicit && exists(explicit)) return explicit;
  const candidates: string[] = [];
  if (process.platform === "win32") {
    const roots = [
      process.env.PROGRAMFILES,
      process.env["PROGRAMFILES(X86)"],
      process.env.LOCALAPPDATA,
    ].filter((value): value is string => Boolean(value));
    for (const root of roots) {
      for (const parts of WIN_BROWSERS) candidates.push(path.join(root, ...parts));
    }
  } else if (process.platform === "darwin") {
    candidates.push(
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
      "/Applications/Chromium.app/Contents/MacOS/Chromium",
      "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    );
  } else {
    const pathDirs = String(process.env.PATH ?? "").split(":");
    for (const name of ["google-chrome", "chromium", "chromium-browser", "microsoft-edge", "brave-browser"]) {
      for (const dir of pathDirs) {
        const file = path.join(dir, name);
        if (exists(file)) candidates.push(file);
      }
    }
  }
  return candidates.find(exists) ?? "";
}

interface CdpMessage {
  readonly id?: number;
  readonly method?: string;
  readonly params?: unknown;
  readonly result?: unknown;
  readonly error?: { readonly message?: string };
}

class CdpConnection {
  private readonly ws: WebSocket;
  private nextId = 1;
  private readonly pending = new Map<number, {
    resolve: (value: unknown) => void;
    reject: (error: Error) => void;
    timer: ReturnType<typeof setTimeout>;
  }>();

  constructor(ws: WebSocket) {
    this.ws = ws;
    ws.addEventListener("message", (event) => this.onMessage(event));
    ws.addEventListener("close", () => {
      for (const item of this.pending.values()) {
        clearTimeout(item.timer);
        item.reject(new Error("CDP 连接已关闭"));
      }
      this.pending.clear();
    });
  }

  send(method: string, params: Record<string, unknown> = {}, timeoutMs = 10_000): Promise<unknown> {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`CDP ${method} 超时`));
      }, timeoutMs);
      timer.unref?.();
      this.pending.set(id, { resolve, reject, timer });
      try {
        this.ws.send(JSON.stringify({ id, method, params }));
      } catch (error) {
        clearTimeout(timer);
        this.pending.delete(id);
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    });
  }

  close(): void {
    try { this.ws.close(); } catch {}
  }

  private onMessage(event: MessageEvent): void {
    let message: CdpMessage;
    try { message = JSON.parse(String(event.data)) as CdpMessage; } catch { return; }
    if (typeof message.id !== "number") return;
    const item = this.pending.get(message.id);
    if (!item) return;
    clearTimeout(item.timer);
    this.pending.delete(message.id);
    if (message.error) item.reject(new Error(message.error.message || "CDP error"));
    else item.resolve(message.result);
  }
}

async function cdpJson(port: number, route: string, signal?: AbortSignal): Promise<unknown> {
  const timeout = AbortSignal.timeout(2_000);
  const response = await fetch(`http://127.0.0.1:${port}${route}`, {
    signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
  });
  if (!response.ok) return null;
  try { return await response.json(); } catch { return null; }
}

async function waitPort(port: number, signal: AbortSignal, timeoutMs: number): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    throwIfAborted(signal);
    const info = await cdpJson(port, "/json/version").catch(() => null);
    if (info && typeof info === "object") return true;
    await sleep(150, signal);
  }
  return false;
}

async function connectPage(port: number, signal: AbortSignal, timeoutMs: number): Promise<CdpConnection> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    throwIfAborted(signal);
    const list = await cdpJson(port, "/json/list").catch(() => null);
    if (Array.isArray(list)) {
      const page = list.find((item) => {
        if (!item || typeof item !== "object") return false;
        const record = item as Record<string, unknown>;
        return record.type === "page" && typeof record.webSocketDebuggerUrl === "string";
      }) as Record<string, unknown> | undefined;
      if (page && typeof page.webSocketDebuggerUrl === "string") {
        const ws = new WebSocket(page.webSocketDebuggerUrl);
        await waitOpen(ws, signal);
        return new CdpConnection(ws);
      }
    }
    await sleep(200, signal);
  }
  throw new CapyError("upstream_unavailable", "连不上浏览器调试端口，请确认浏览器没有禁用调试");
}

function waitOpen(ws: WebSocket, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      try { ws.close(); } catch {}
      reject(new Error("浏览器 CDP WebSocket 连接超时"));
    }, 10_000);
    timer.unref?.();
    const onAbort = () => {
      clearTimeout(timer);
      try { ws.close(); } catch {}
      reject(abortError());
    };
    if (signal.aborted) return onAbort();
    signal.addEventListener("abort", onAbort, { once: true });
    ws.addEventListener("open", () => {
      clearTimeout(timer);
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, { once: true });
    ws.addEventListener("error", () => {
      clearTimeout(timer);
      signal.removeEventListener("abort", onAbort);
      try { ws.close(); } catch {}
      reject(new CapyError("upstream_unavailable", "浏览器 CDP WebSocket 连接失败"));
    }, { once: true });
  });
}

async function evaluate<T>(cdp: CdpConnection, expression: string): Promise<T | null> {
  const result = await cdp.send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  const record = result as { result?: { value?: unknown } } | null;
  return (record?.result?.value ?? null) as T | null;
}

const CLERK_STATE = `(() => {
  try {
    const clerk = window.Clerk;
    if (!clerk || !clerk.session || !clerk.user) return null;
    const sessionId = typeof clerk.session.id === "string" ? clerk.session.id : "";
    const userId = typeof clerk.user.id === "string" ? clerk.user.id : "";
    if (!sessionId || !userId) return null;
    return JSON.stringify({ sessionId, userId });
  } catch { return null; }
})()`;

const SELECTED_ORG = `(() => {
  try {
    return localStorage.getItem("capy-web:selected-org")
      || localStorage.getItem("capy-web:last-selected-org")
      || "";
  } catch { return ""; }
})()`;

async function readCookie(cdp: CdpConnection): Promise<string> {
  for (const method of ["Network.getAllCookies", "Storage.getCookies"] as const) {
    let result: unknown;
    try { result = await cdp.send(method); } catch { continue; }
    const record = result as { cookies?: unknown } | null;
    const cookies = Array.isArray(record?.cookies) ? record.cookies : [];
    for (const cookie of cookies) {
      if (!cookie || typeof cookie !== "object") continue;
      const value = cookie as Record<string, unknown>;
      if (value.name === "__client" && typeof value.value === "string") return value.value;
    }
  }
  return "";
}

function clientIdOf(clientJwt: string): string {
  const payload = decodeJwtPayload(clientJwt);
  return typeof payload?.id === "string" ? payload.id : "";
}

function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.unref();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 0;
      server.close(() => (port ? resolve(port) : reject(new Error("no free port"))));
    });
  });
}

function launchArgs(port: number, profile: string): string[] {
  return [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-extensions",
    "--disable-background-networking",
    // Chrome exposes navigator.webdriver=true whenever remote debugging is on.
    // Google sign-in reads that flag and refuses the login as "insecure browser".
    "--disable-blink-features=AutomationControlled",
    LOGIN_URL,
  ];
}

function browserExited(child: ChildProcess): boolean {
  return child.exitCode !== null || child.signalCode !== null;
}

async function waitDevToolsFile(profile: string, signal: AbortSignal, timeoutMs: number): Promise<number> {
  const file = path.join(profile, "DevToolsActivePort");
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    throwIfAborted(signal);
    if (fs.existsSync(file)) {
      const port = Number(fs.readFileSync(file, "utf8").split(/\r?\n/u)[0]?.trim() ?? 0);
      if (Number.isInteger(port) && port > 0) return port;
    }
    await sleep(150, signal);
  }
  return 0;
}

async function chromiumLogin(options: {
  readonly browser?: string;
  readonly signal?: AbortSignal;
  readonly timeoutMs?: number;
} = {}): Promise<LoginCredential> {
  const exe = options.browser || findBrowser();
  if (!exe) {
    throw new CapyError(
      "invalid_request",
      "没有找到 Chromium 浏览器（Chrome / Edge / Chromium / Brave）。请安装，或设置 MAGPIE_CAPY_BROWSER",
    );
  }
  const signal = options.signal ?? new AbortController().signal;
  const timeoutMs = Math.max(10_000, options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "magpie-capy-"));
  let child: ChildProcess | null = null;
  try {
    let port = 0;
    for (let attempt = 0; attempt < 3 && !port; attempt += 1) {
      const tryPort = attempt === 0 ? 0 : await freePort();
      child = spawn(exe, launchArgs(tryPort, profile), { stdio: "ignore", windowsHide: false });
      if (tryPort === 0) {
        port = await waitDevToolsFile(profile, signal, 15_000);
        if (!port) {
          try { child.kill("SIGTERM"); } catch {}
          child = null;
        }
      } else if (await waitPort(tryPort, signal, 15_000)) {
        port = tryPort;
      } else {
        try { child.kill("SIGTERM"); } catch {}
        child = null;
      }
    }
    if (!port) throw new CapyError("upstream_unavailable", "浏览器没有打开调试端口");

    const deadline = Date.now() + timeoutMs;
    let sawClerk = false;
    let cdp: CdpConnection | null = null;
    try {
      while (Date.now() < deadline) {
        throwIfAborted(signal);
        if (child && browserExited(child)) {
          throw new CapyError("sign_in_required", "Capy 登录浏览器已关闭，请重新发起登录");
        }
        try {
          cdp ??= await connectPage(port, signal, 5_000);
          const stateRaw = await evaluate<string>(cdp, CLERK_STATE);
          if (stateRaw) {
            sawClerk = true;
            let state: { sessionId?: string; userId?: string } | null = null;
            try { state = JSON.parse(stateRaw) as { sessionId?: string; userId?: string }; } catch {}
            const clientJwt = await readCookie(cdp);
            if (clientJwt && state?.sessionId && state.userId) {
              const orgId = await evaluate<string>(cdp, SELECTED_ORG).catch(() => "");
              return {
                clientJwt,
                sessionId: state.sessionId,
                userId: state.userId,
                clientId: clientIdOf(clientJwt),
                ...(orgId ? { orgId: String(orgId) } : {}),
                source: "browser",
              };
            }
          }
        } catch (error) {
          cdp?.close();
          cdp = null;
          if (signal.aborted) throw abortError();
          if (error instanceof CapyError && error.kind === "sign_in_required") throw error;
        }
        await sleep(POLL_MS, signal);
      }
    } finally {
      cdp?.close();
    }
    if (sawClerk) {
      throw new CapyError(
        "sign_in_required",
        "已在 Capy 登录，但读不到 __client Cookie。请让浏览器停留在 capy.ai 页面后重试",
      );
    }
    throw new CapyError("upstream_timeout", "等待 Capy 浏览器登录超时，请重试");
  } finally {
    if (child) killTree(child);
    setTimeout(() => {
      try { fs.rmSync(profile, { recursive: true, force: true }); } catch {}
    }, 1000).unref?.();
  }
}

function killTree(child: ChildProcess): void {
  try { child.kill("SIGTERM"); } catch {}
  if (process.platform === "win32" && child.pid) {
    try {
      const killer = spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"], {
        windowsHide: true,
        stdio: "ignore",
      });
      killer.unref();
    } catch {}
  }
}

export class CapyLoginSources implements LoginSourcePort {
  async local(): Promise<LoginCredential> {
    return readCapyInstall();
  }

  async browser(signal?: AbortSignal): Promise<LoginCredential> {
    return chromiumLogin({ ...(signal ? { signal } : {}) });
  }
}

function abortError(): Error {
  return new DOMException("Aborted", "AbortError");
}

function throwIfAborted(signal: AbortSignal): void {
  if (signal.aborted) throw abortError();
}

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(abortError());
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(abortError());
    };
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

