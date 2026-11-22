import type { ToolDefinition } from "../domain/chat.ts";
import type { ToolBridgePort, ToolParseResult } from "../ports/tool-bridge.ts";

const FENCE = /^```(?:json)?\s*([\s\S]*?)\s*```$/iu;

function functionOf(tool: ToolDefinition): { name: string; description: string; parameters: unknown } | null {
  const name = String(tool.function.name ?? "").trim();
  if (!name) return null;
  return {
    name,
    description: String(tool.function.description ?? "").trim(),
    parameters: tool.function.parameters ?? { type: "object", properties: {} },
  };
}

function forcedName(toolChoice: unknown): string {
  if (!toolChoice || typeof toolChoice !== "object") return "";
  const value = toolChoice as { function?: { name?: unknown }; name?: unknown };
  return typeof value.function?.name === "string"
    ? value.function.name
    : typeof value.name === "string"
      ? value.name
      : "";
}

export class PromptToolBridge implements ToolBridgePort {
  instruction(tools: readonly ToolDefinition[], toolChoice: unknown): string {
    const defs = tools.map(functionOf).filter((item): item is NonNullable<typeof item> => Boolean(item));
    if (defs.length === 0) return "";
    const forced = forcedName(toolChoice);
    const required = forced || toolChoice === "required";
    const lines = [
      "# Tools",
      "You can call these tools when the user's request needs them:",
      JSON.stringify(defs, null, 2),
      "",
      "To call a tool, reply with exactly one JSON object and nothing else:",
      "{\"tool_calls\":[{\"name\":\"<tool_name>\",\"arguments\":{}}]}",
      "Do not wrap the JSON in a code fence. Do not add text before or after it.",
      "If no tool is needed, answer normally in text.",
    ];
    if (forced) lines.push(`You must call the tool "${forced}" now.`);
    else if (required) lines.push("You must call at least one tool now.");
    return lines.join("\n");
  }

  parse(text: string): ToolParseResult | null {
    const direct = normalizeCalls(tryJson(text));
    if (direct) return { calls: direct };
    for (const candidate of balancedObjects(text)) {
      const calls = normalizeCalls(tryJson(candidate));
      if (calls) return { calls };
    }
    return null;
  }
}

function normalizeArguments(value: unknown): string {
  if (typeof value === "string") {
    const text = value.trim();
    if (!text) return "{}";
    try {
      return JSON.stringify(JSON.parse(text) ?? {});
    } catch {
      return text;
    }
  }
  if (value === undefined || value === null) return "{}";
  try {
    return JSON.stringify(value);
  } catch {
    return "{}";
  }
}

function normalizeCalls(value: unknown): ToolParseResult["calls"] | null {
  if (!value || typeof value !== "object") return null;
  const record = value as { tool_calls?: unknown; calls?: unknown };
  const raw: unknown[] = Array.isArray(record.tool_calls)
    ? record.tool_calls
    : Array.isArray(record.calls)
      ? record.calls
      : Array.isArray(value)
        ? value
        : [value];
  const calls: { name: string; arguments: string }[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const record = item as { function?: { name?: unknown; arguments?: unknown }; name?: unknown; arguments?: unknown };
    const fn = record.function ?? record;
    const name = typeof fn.name === "string" ? fn.name.trim() : "";
    if (!name) continue;
    calls.push({ name, arguments: normalizeArguments(fn.arguments) });
  }
  return calls.length > 0 ? calls : null;
}

function tryJson(text: string): unknown {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const unfenced = FENCE.exec(trimmed)?.[1]?.trim() ?? trimmed;
  try {
    return JSON.parse(unfenced);
  } catch {
    return null;
  }
}

function balancedObjects(text: string): string[] {
  const out: string[] = [];
  const starts: number[] = [];
  let inString = false;
  let escaped = false;
  let steps = 0;
  const budget = Math.min(1_000_000, Math.max(10_000, text.length * 2));

  for (let i = 0; i < text.length; i += 1) {
    steps += 1;
    if (steps > budget) break;
    const ch = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === "{") starts.push(i);
    else if (ch === "}") {
      const start = starts.pop();
      if (start === undefined) continue;
      if (starts.length === 0) {
        out.push(text.slice(start, i + 1));
        if (out.length >= 32) break;
      }
    }
  }
  return out;
}

