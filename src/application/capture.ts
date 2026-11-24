import type { ToolCall, ToolDefinition } from "../domain/chat.ts";
import { primaryArg } from "./cmd-tags.ts";

/**
 * Machine RPC 截获与映射中心（方案 B）。
 *
 * Capy agent 发起 bash / read / write / edit 等设备调用时，隧道会收到完整的
 * {handler, params} 以及带 jamId 的 x-capy-workspace 头。
 * 这里按 jamId 隔离分发：订阅者（正在流式等待的同一请求）收到首个合法工具调用后
 * 立刻短路返回给 DSH，不再空等 Capy 重试，也不产生跨请求串台。
 */

export interface CapturedInvocation {
  readonly jamId?: string;
  readonly handler: string;
  readonly params: Record<string, unknown>;
  readonly at: number;
}

export type InvocationListener = (inv: CapturedInvocation) => void;

const TTL_MS = 60_000;
const MAX_PER_KEY = 8;
const JAM_ID_RE = /(?<![0-9A-Za-z])(jam_[0-9A-Z]{26})(?![0-9A-Za-z])/iu;

export const COMMAND_HANDLERS = new Set(["bash", "shell", "run", "exec", "command"]);
export const CAPTURED_HANDLERS = new Set([
  ...COMMAND_HANDLERS,
  "read",
  "file_read",
  "write",
  "file_write",
  "edit",
]);

const buffered = new Map<string, CapturedInvocation[]>();
const listeners = new Map<string, InvocationListener>();

/** 从隧道头/载荷中提取 jam_<ULID>，用于把 RPC 调用精确关联到发起它的 HTTP 请求。 */
export function extractJamId(...sources: readonly (string | undefined)[]): string {
  for (const raw of sources) {
    if (!raw) continue;
    let text = raw;
    try {
      text = decodeURIComponent(raw);
    } catch {
      // 保留原文继续匹配
    }
    const match = JAM_ID_RE.exec(text);
    if (match?.[1]) return match[1];
  }
  return "";
}

/** 隧道收到工具型 invocation 时调用：写入对应 jamId 缓冲并即时通知订阅者。 */
export function captureInvocation(
  handler: string,
  params: Record<string, unknown>,
  jamId = "",
): void {
  const now = Date.now();
  const inv: CapturedInvocation = {
    ...(jamId ? { jamId } : {}),
    handler,
    params,
    at: now,
  };
  pruneBuffers(now);
  const key = jamId || "";
  const list = buffered.get(key) ?? [];
  list.push(inv);
  buffered.set(key, list.slice(-MAX_PER_KEY));

  if (jamId) {
    const listener = listeners.get(jamId);
    if (listener) {
      try {
        listener(inv);
      } catch {
        // 监听异常不能破坏隧道响应
      }
    }
  }
}

/** 为指定 jamId 订阅实时 invocation；若已有缓冲则立即回放。返回取消订阅函数。 */
export function subscribeJamInvocation(
  jamId: string,
  listener: InvocationListener,
): () => void {
  listeners.set(jamId, listener);
  const now = Date.now();
  const existing = (buffered.get(jamId) ?? []).filter((item) => now - item.at <= TTL_MS);
  for (const inv of existing) {
    try {
      listener(inv);
    } catch {
      // ignore
    }
  }
  return () => {
    if (listeners.get(jamId) === listener) listeners.delete(jamId);
    buffered.delete(jamId);
  };
}

/** 取出并清空缓冲（若传 jamId 只取该 jam，否则取全部；兼容旧调用方与单测）。 */
export function drainInvocations(jamId?: string): CapturedInvocation[] {
  const now = Date.now();
  pruneBuffers(now);
  if (jamId !== undefined) {
    const list = buffered.get(jamId) ?? [];
    buffered.delete(jamId);
    return list;
  }
  const all: CapturedInvocation[] = [];
  for (const list of buffered.values()) all.push(...list);
  buffered.clear();
  return all;
}

function pruneBuffers(now: number): void {
  for (const [key, list] of buffered) {
    const fresh = list.filter((item) => now - item.at <= TTL_MS);
    if (fresh.length > 0) buffered.set(key, fresh);
    else buffered.delete(key);
  }
}

/**
 * 剥离 Capy 拼接在每条 bash 命令前的 co-author git shim 环境初始化头。
 * 真实命令位于 `unset __capy_co_author` 之后；若剥离后为空说明只是纯环境初始化，忽略。
 */
export function stripCapyPreamble(command: string): string {
  const text = command.trim();
  if (!text) return "";
  if (text.includes("__CAPY_CO_AUTHOR_SHIM__") || text.startsWith("__capy_co_author=")) {
    const marker = /(?:^|\r?\n)unset __capy_co_author[ \t]*(?:\r?\n|$)/gu;
    let lastEnd = -1;
    for (const match of text.matchAll(marker)) {
      lastEnd = (match.index ?? 0) + match[0].length;
    }
    if (lastEnd >= 0) {
      return text.slice(lastEnd).trim();
    }
    // 只有 guard 头部没有后续命令，忽略
    return "";
  }
  return text;
}

/** 从命令类 invocation 取出真实命令原文（已剥除 Capy preamble 与外层 shell 包装）。 */
export function commandOf(inv: CapturedInvocation): string {
  const p = inv.params;
  for (const key of ["command", "cmd", "script", "commandLine", "input"]) {
    const value = p[key];
    if (typeof value === "string" && value.trim()) {
      const stripped = stripCapyPreamble(value);
      if (!stripped) return "";
      return unwrapShell(stripped);
    }
  }
  return "";
}

/**
 * Capy 内部常以 `pwsh -Command "..."` / `bash -lc '...'` 包装命令。
 * 转交给 DSH shell 工具时剥掉外壳只留内层脚本，避免嵌套启动。
 */
function unwrapShell(command: string): string {
  const trimmed = command.trim();
  const head = /^(?:pwsh|powershell|bash|sh|zsh)(?:\.exe)?\s+/iu.exec(trimmed);
  if (!head) return command;
  const rest = trimmed.slice(head[0].length);
  const flag = /(?:^|\s)(?:-[A-Za-z]*c|-[Cc]ommand|--command)\s+([\s\S]+)$/u.exec(rest);
  if (!flag || !flag[1]) return command;
  let inner = flag[1].trim();
  if ((inner.startsWith('"') && inner.endsWith('"')) || (inner.startsWith("'") && inner.endsWith("'"))) {
    const quote = inner[0];
    inner = inner.slice(1, -1);
    if (quote === '"') inner = inner.replace(/\\"/gu, '"');
  }
  return inner.trim() || command;
}

function forcedToolName(choice: unknown): string | undefined {
  if (!choice || typeof choice !== "object" || Array.isArray(choice)) return undefined;
  const record = choice as { type?: unknown; function?: { name?: unknown } };
  if (record.type === "function" && record.function && typeof record.function.name === "string") {
    return record.function.name;
  }
  return undefined;
}

function propsOf(tool: ToolDefinition): Record<string, unknown> {
  const params = tool.function.parameters;
  if (!params || typeof params !== "object") return {};
  const props = (params as { properties?: unknown }).properties;
  return props && typeof props === "object" && !Array.isArray(props)
    ? props as Record<string, unknown>
    : {};
}

function pickProp(tool: ToolDefinition, candidates: readonly string[]): string {
  const props = propsOf(tool);
  for (const key of candidates) {
    if (key in props) return key;
  }
  return candidates[0] ?? "";
}

/** 为缺少 description 的 shell 工具生成简洁摘要，满足 DSH pwsh/bash schema 必填约束。 */
export function describeCommand(command: string): string {
  const firstLine = command.split(/\r?\n/u).map((l) => l.trim()).find(Boolean) ?? "Run command";
  const compact = firstLine.replace(/\s+/gu, " ");
  return compact.length > 72 ? `${compact.slice(0, 69)}...` : compact;
}

function filePathOf(params: Record<string, unknown>): string {
  for (const key of ["path", "file_path", "filePath"]) {
    const val = params[key];
    if (typeof val === "string" && val.trim()) return val.trim();
  }
  return "";
}

/**
 * 把 Capy 的内部 Machine RPC 调用映射到 DSH 声明的 OpenAI 工具调用。
 * 严格遵守本次请求的 tools 白名单与 tool_choice；不匹配则返回 null。
 */
export function mapInvocationToToolCall(
  inv: CapturedInvocation,
  tools: readonly ToolDefinition[],
  toolChoice: unknown,
): Omit<ToolCall, "id"> | null {
  if (!tools.length || toolChoice === "none") return null;
  const forced = forcedToolName(toolChoice);
  if (toolChoice !== undefined && toolChoice !== "auto" && toolChoice !== "required" && !forced) {
    return null;
  }

  const pickTool = (preferredNames: readonly string[]): ToolDefinition | undefined => {
    for (const name of preferredNames) {
      const hit = tools.find((t) => t.function.name === name);
      if (hit && (!forced || forced === hit.function.name)) return hit;
    }
    return undefined;
  };

  const handler = inv.handler.toLowerCase();

  if (COMMAND_HANDLERS.has(handler)) {
    const command = commandOf(inv);
    if (!command) return null;
    let target = pickTool(["bash", "pwsh", "shell", "run"]);
    if (!target) {
      target = tools.find((t) => (!forced || forced === t.function.name) && primaryArg(t) === "command");
    }
    if (!target) return null;
    const cmdKey = primaryArg(target) ?? "command";
    const args: Record<string, unknown> = { [cmdKey]: command };
    if ("description" in propsOf(target)) {
      args.description = describeCommand(command);
    }
    return { name: target.function.name, arguments: JSON.stringify(args) };
  }

  if (handler === "read" || handler === "file_read") {
    const filePath = filePathOf(inv.params);
    if (!filePath) return null;
    const target = pickTool(["read", "file_read", "read_file"]);
    if (!target) return null;
    const props = propsOf(target);
    const args: Record<string, unknown> = {
      [pickProp(target, ["file_path", "path"])]: filePath,
    };
    const offset = inv.params.offset;
    if (typeof offset === "number" && Number.isFinite(offset) && offset >= 1 && "offset" in props) {
      args.offset = Math.floor(offset);
    }
    const limit = inv.params.limit;
    if (typeof limit === "number" && Number.isFinite(limit) && limit >= 1 && "limit" in props) {
      args.limit = Math.floor(limit);
    }
    return { name: target.function.name, arguments: JSON.stringify(args) };
  }

  if (handler === "write" || handler === "file_write") {
    const filePath = filePathOf(inv.params);
    const content = typeof inv.params.content === "string" ? inv.params.content : null;
    if (!filePath || content === null) return null;
    const target = pickTool(["write", "file_write", "write_file"]);
    if (!target) return null;
    const args: Record<string, unknown> = {
      [pickProp(target, ["file_path", "path"])]: filePath,
      [pickProp(target, ["content", "text", "data"])]: content,
    };
    return { name: target.function.name, arguments: JSON.stringify(args) };
  }

  if (handler === "edit") {
    const filePath = filePathOf(inv.params);
    const oldStr = typeof inv.params.oldString === "string"
      ? inv.params.oldString
      : typeof inv.params.old_string === "string"
        ? inv.params.old_string
        : null;
    const newStr = typeof inv.params.newString === "string"
      ? inv.params.newString
      : typeof inv.params.new_string === "string"
        ? inv.params.new_string
        : null;
    if (!filePath || !oldStr || newStr === null) return null;
    const target = pickTool(["edit", "edit_file"]);
    if (!target) return null;
    const props = propsOf(target);
    const args: Record<string, unknown> = {
      [pickProp(target, ["file_path", "path"])]: filePath,
      [pickProp(target, ["old_string", "oldString"])]: oldStr,
      [pickProp(target, ["new_string", "newString"])]: newStr,
    };
    const replaceAll = inv.params.replaceAll ?? inv.params.replace_all;
    if (typeof replaceAll === "boolean") {
      if ("replace_all" in props) args.replace_all = replaceAll;
      else if ("replaceAll" in props) args.replaceAll = replaceAll;
    }
    return { name: target.function.name, arguments: JSON.stringify(args) };
  }

  return null;
}
