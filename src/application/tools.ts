import type { ToolDefinition, ToolCall } from '../domain/chat.ts';
import type { ToolBridgePort, ToolParseResult } from '../ports/tool-bridge.ts';
import { cmdInstruction, extractToolCallTags, parseCmdTags, primaryArg } from './cmd-tags.ts';
import { describeCommand } from './capture.ts';

const FENCE = /^```(?:json)?[ \t]*\r?\n([\s\S]*?)\r?\n```$/u;

function object(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function propsOf(tool: ToolDefinition): Record<string, unknown> {
  const params = tool.function.parameters;
  if (!params || typeof params !== 'object') return {};
  const props = (params as { properties?: unknown }).properties;
  return object(props) ? props : {};
}

function packetText(text: string): string {
  const trimmed = text.trim();
  const fenced = FENCE.exec(trimmed);
  return fenced?.[1]?.trim() ?? trimmed;
}

export function forcedName(choice: unknown): string | undefined {
  if (object(choice) && choice.type === 'function' && object(choice.function) && typeof choice.function.name === 'string') return choice.function.name;
  return undefined;
}

function normalizeStructuredCall(
  item: unknown,
  byName: ReadonlyMap<string, ToolDefinition>,
  forced: string | undefined,
): Omit<ToolCall, 'id'> | null {
  if (!object(item)) return null;
  const keys = Object.keys(item);
  if (keys.length !== 2 || typeof item.name !== 'string' || !object(item.arguments)) return null;
  const tool = byName.get(item.name);
  if (!tool) return null;
  if (forced !== undefined && forced !== item.name) return null;
  const args: Record<string, unknown> = { ...item.arguments };
  const props = propsOf(tool);
  if ('description' in props && typeof args.description !== 'string' && typeof args.command === 'string') {
    args.description = describeCommand(args.command);
  }
  return { name: item.name, arguments: JSON.stringify(args) };
}

/**
 * 客户端工具文本桥（配合方案 B Machine RPC 拦截做兜底）。
 *
 * 优先级：
 * 1. <TOOL_CALL>{"name":"...","arguments":{...}}</TOOL_CALL> —— 支持任意多参数 DSH 工具。
 * 2. 整段 JSON 包 {"tool_calls":[...]} —— 兼容直接输出 JSON 包的模型。
 * 3. <CMD>命令</CMD> —— 单命令防转义破坏，自动补全 pwsh/bash 的必填 description。
 */
export class PromptToolBridge implements ToolBridgePort {
  instruction(tools: readonly ToolDefinition[], choice: unknown): string {
    if (!tools.length || choice === 'none') return '';
    const forced = forcedName(choice);
    return cmdInstruction(tools, forced, choice === 'required');
  }

  parse(text: string, tools: readonly ToolDefinition[], choice: unknown): ToolParseResult | null {
    if (!tools.length || choice === 'none') return null;
    const forced = forcedName(choice);
    if (choice !== undefined && choice !== 'auto' && choice !== 'required' && !forced) return null;
    const byName = new Map(tools.map((t) => [t.function.name, t]));
    const allowed = new Set(byName.keys());

    // 1. <TOOL_CALL> 结构化标签（支持多参数工具，如 edit / read(offset,limit) / glob / grep）
    const tagBodies = extractToolCallTags(text);
    if (tagBodies.length > 0) {
      const calls: Omit<ToolCall, 'id'>[] = [];
      for (const body of tagBodies) {
        let parsed: unknown;
        try {
          parsed = JSON.parse(body);
        } catch {
          return null;
        }
        const call = normalizeStructuredCall(parsed, byName, forced);
        if (!call) return null;
        calls.push(call);
      }
      if (forced !== undefined && calls.length !== 1) return null;
      return calls.length > 0 ? { calls } : null;
    }

    // 2. 整段 JSON 包（{"tool_calls":[...]}）
    try {
      const value: unknown = JSON.parse(packetText(text));
      if (object(value) && Object.keys(value).length === 1 && Array.isArray(value.tool_calls) && value.tool_calls.length > 0) {
        if (forced !== undefined && value.tool_calls.length !== 1) return null;
        const calls: Omit<ToolCall, 'id'>[] = [];
        for (const item of value.tool_calls as unknown[]) {
          const call = normalizeStructuredCall(item, byName, forced);
          if (!call) return null;
          calls.push(call);
        }
        return { calls };
      }
    } catch {
      // 不是整段 JSON，继续走 <CMD> 解析
    }

    // 3. <CMD> 单命令标签
    const parsed = parseCmdTags(text, allowed);
    if (!parsed || parsed.calls.length === 0) return null;
    if (forced !== undefined && (parsed.calls.length !== 1 || parsed.calls[0]?.name !== forced)) return null;

    const calls: Omit<ToolCall, 'id'>[] = [];
    for (const call of parsed.calls) {
      const tool = byName.get(call.name);
      if (!tool) return null;
      const arg = primaryArg(tool);
      if (!arg) return null;
      const args: Record<string, unknown> = { [arg]: call.command };
      if ('description' in propsOf(tool) && arg !== 'description') {
        args.description = describeCommand(call.command);
      }
      calls.push({ name: call.name, arguments: JSON.stringify(args) });
    }
    return { calls };
  }
}
