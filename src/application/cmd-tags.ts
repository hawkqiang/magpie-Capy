import type { ToolDefinition } from '../domain/chat.ts';

// 不匹配行内反引号里的 `<CMD>` 示例，也不允许跨过内层 `<CMD` 吞掉前面正文。
const CMD_TAG = /(?<!`)<CMD(?:\s+tool="([^"]+)")?\s*>((?:(?!<CMD\b)[\s\S])*?)<\/CMD>(?!`)/gu;
const TOOL_CALL_TAG = /(?<!`)<TOOL_CALL\s*>((?:(?!<TOOL_CALL\b)[\s\S])*?)<\/TOOL_CALL>(?!`)/gu;
const DONE_TAG = /(?<!`)<DONE>([\s\S]*?)<\/DONE>(?!`)/gu;
const PLACEHOLDERS = new Set(['...', '…', '<command>', '要执行的命令原文', '命令原文']);

const NATIVE_BRIDGE_TOOLS = new Set(['pwsh', 'bash', 'shell', 'run', 'read', 'write', 'edit']);

/** 工具的主参数名：<CMD> 的命令体塞进它。按工具名启发式，未知工具用第一个必填 string 参数。 */
export function primaryArg(tool: ToolDefinition): string | undefined {
  const params = tool.function.parameters;
  if (!params || typeof params !== 'object') return undefined;
  const record = params as Record<string, unknown>;
  const props = record.properties;
  const required = Array.isArray(record.required)
    ? record.required.filter((x): x is string => typeof x === 'string')
    : [];
  const has = (key: string) => Boolean(props && typeof props === 'object' && key in (props as object));
  for (const key of ['command', 'cmd', 'script', 'commandLine']) {
    if (has(key)) return key;
  }
  if (props && typeof props === 'object') {
    for (const key of required) {
      const spec = (props as Record<string, unknown>)[key];
      if (spec && typeof spec === 'object' && (spec as { type?: unknown }).type === 'string') return key;
    }
    for (const [key, spec] of Object.entries(props as Record<string, unknown>)) {
      if (spec && typeof spec === 'object' && (spec as { type?: unknown }).type === 'string') return key;
    }
  }
  return undefined;
}

export interface CmdCall {
  readonly name: string;
  readonly command: string;
}

export interface CmdParse {
  readonly calls: readonly CmdCall[];
  readonly done?: string;
}

/**
 * 解析模型输出里的 <CMD> 标签。
 * 命令体原样保留，只去掉首尾换行；跳过反引号里的说明示例与占位符。
 */
export function parseCmdTags(text: string, allowed: ReadonlySet<string>): CmdParse | null {
  const calls: CmdCall[] = [];
  for (const match of text.matchAll(CMD_TAG)) {
    const explicit = match[1]?.trim();
    const body = match[2] ?? '';
    const command = body.replace(/^\r?\n/u, '').replace(/\r?\n$/u, '');
    const trimmed = command.trim();
    if (!trimmed || PLACEHOLDERS.has(trimmed)) continue;
    const name = explicit && allowed.has(explicit) ? explicit : pickDefaultTool(allowed);
    if (!name) continue;
    calls.push({ name, command });
  }
  let done: string | undefined;
  for (const match of text.matchAll(DONE_TAG)) done = match[1]?.trim() ?? '';
  if (calls.length === 0 && done === undefined) return null;
  return { calls, ...(done !== undefined ? { done } : {}) };
}

/** 解析结构化多参数标签：<TOOL_CALL>{"name":"...","arguments":{...}}</TOOL_CALL> */
export function extractToolCallTags(text: string): string[] {
  const out: string[] = [];
  for (const match of text.matchAll(TOOL_CALL_TAG)) {
    const body = (match[1] ?? '').trim();
    if (body) out.push(body);
  }
  return out;
}

function pickDefaultTool(allowed: ReadonlySet<string>): string | undefined {
  for (const preferred of ['pwsh', 'bash', 'shell', 'run']) {
    if (allowed.has(preferred)) return preferred;
  }
  const first: string | undefined = allowed.values().next().value;
  return first;
}

function formatToolSignature(tool: ToolDefinition): string {
  const params = tool.function.parameters as { properties?: Record<string, unknown>; required?: unknown[] } | undefined;
  const props = params?.properties && typeof params.properties === 'object' ? Object.keys(params.properties) : [];
  const req = new Set(Array.isArray(params?.required) ? params.required.filter((x): x is string => typeof x === 'string') : []);
  if (props.length === 0) return `${tool.function.name}()`;
  const args = props.slice(0, 6).map((k) => (req.has(k) ? `${k}*` : k)).join(', ');
  return `${tool.function.name}(${args})`;
}

export function cmdInstruction(tools: readonly ToolDefinition[], forced: string | undefined, required: boolean): string {
  if (!tools.length) return '';
  const names = new Set(tools.map((t) => t.function.name));
  const hasPwshOnly = names.has('pwsh') && !names.has('bash');
  const nativeAvailable = tools.filter((t) => NATIVE_BRIDGE_TOOLS.has(t.function.name));
  const extraTools = tools.filter((t) => !NATIVE_BRIDGE_TOOLS.has(t.function.name));

  const lines = ['# Client Harness Tools'];
  if (hasPwshOnly) {
    lines.push('Shell commands run in Windows PowerShell (`pwsh`), so write PowerShell commands rather than Unix-only tools like `sed`/`awk`.');
  }
  if (nativeAvailable.length > 0 && !forced) {
    lines.push(`Standard shell/file tools (${nativeAvailable.map((t) => t.function.name).join(', ')}) are bridged directly from your built-in bash/read/write/edit tools to the client harness.`);
  }
  if (extraTools.length > 0 || forced) {
    const listed = forced
      ? tools.filter((t) => t.function.name === forced)
      : extraTools.slice(0, 24);
    if (listed.length > 0) {
      lines.push(`Client-only tools (* = required): ${listed.map(formatToolSignature).join('; ')}`);
    }
    lines.push('To call a client-only tool (or any tool with multiple JSON arguments), reply with:');
    lines.push('<TOOL_CALL>{"name":"<tool_name>","arguments":{...}}</TOOL_CALL>');
  }
  lines.push('For a single shell command you may also use <CMD>command</CMD>. Do not fabricate tool outputs.');
  if (forced) {
    const target = tools.find((t) => t.function.name === forced);
    const sig = target ? formatToolSignature(target) : forced;
    lines.push(`You must call the tool "${forced}" directly now (${sig}). Do not call any other tool first.`);
  } else if (required) {
    lines.push('You must call at least one declared tool now.');
  }
  return lines.join('\n');
}
