import { CapyError } from "./errors.ts";

export type ChatRole = "system" | "developer" | "user" | "assistant" | "tool";

export interface TextPart {
  readonly type: "text" | "input_text" | "output_text";
  readonly text: string;
}

export interface ImagePart {
  readonly type: "image_url" | "input_image" | "image";
  readonly url: string;
  readonly name?: string;
  readonly mediaType?: string;
}

export interface FilePart {
  readonly type: "file" | "input_file";
  readonly name?: string;
  readonly mediaType?: string;
  readonly data?: string;
  readonly url?: string;
}

export type ContentPart = TextPart | ImagePart | FilePart;

export function isTextPart(part: ContentPart): part is TextPart {
  return part.type === "text" || part.type === "input_text" || part.type === "output_text";
}

export function isImagePart(part: ContentPart): part is ImagePart {
  return part.type === "image_url" || part.type === "input_image" || part.type === "image";
}

export function isFilePart(part: ContentPart): part is FilePart {
  return part.type === "file" || part.type === "input_file";
}

export function partMarker(part: ImagePart | FilePart): string {
  if (isImagePart(part)) return `[图片: ${part.name ?? "image"}]`;
  return `[附件: ${part.name ?? "file"}]`;
}

export interface ToolCall {
  readonly id: string;
  readonly name: string;
  readonly arguments: string;
}

export interface ChatMessage {
  readonly role: ChatRole;
  readonly content: string | readonly ContentPart[];
  readonly name?: string;
  readonly toolCallId?: string;
  readonly toolCalls?: readonly ToolCall[];
}

export interface ToolDefinition {
  readonly type: "function";
  readonly function: {
    readonly name: string;
    readonly description?: string;
    readonly parameters?: unknown;
  };
}

export interface ChatRequest {
  readonly model: string;
  readonly messages: readonly ChatMessage[];
  readonly stream: boolean;
  readonly reasoningEffort?: string;
  readonly tools?: readonly ToolDefinition[];
  readonly toolChoice?: unknown;
}

export interface ChatDeltaEvent {
  readonly type: "delta";
  readonly text: string;
}

export interface ChatFinalEvent {
  readonly type: "final";
  readonly text: string;
  /** Capy 已提交 transcript；false 表示只是流中的实时预览。 */
  readonly committed?: boolean;
  /** 上游 agent 是否走过自己的内部工具通道（不代表本机执行成功）。 */
  readonly internalTools?: boolean;
  /** 方案 B 按 jamId 实时截获并完成映射的客户端工具调用。 */
  readonly capturedCalls?: readonly Omit<ToolCall, "id">[];
}

export interface ChatErrorEvent {
  readonly type: "error";
  readonly error: CapyError;
}

export interface ChatDoneEvent {
  readonly type: "done";
}

export type ChatEvent =
  | ChatDeltaEvent
  | ChatFinalEvent
  | ChatErrorEvent
  | ChatDoneEvent;

// 不设本地字符上限。Capy 自己按 token 管理上下文（events/context-usage 的
// budgetTokens / compactAtTokens / windowTokens），超出后由服务端 compact。

function textOfContent(content: string | readonly ContentPart[]): string {
  if (typeof content === "string") return content;
  const parts: string[] = [];
  for (const part of content) {
    if (isTextPart(part)) parts.push(part.text);
    else parts.push(partMarker(part));
  }
  return parts.join("\n");
}

interface Turn {
  role: "user" | "assistant" | "tool";
  text: string;
  name?: string;
  toolCallId?: string;
  toolCalls?: readonly ToolCall[];
}

export interface BuildPromptOptions {
  /** 由 ToolBridge 生成的工具说明；为空则不加。 */
  readonly toolInstruction?: string;
}

/**
 * OpenAI messages → Capy 单条 message。
 * 单条 user 原样发送；多轮用 <system>/<user>/<assistant> 结构。
 * 工具回合保留调用 ID、工具名和原始参数，tool 结果绑定回同一调用。
 *
 * 不按字符数裁剪：Capy 按 token 预算管理上下文，超出阈值自动 compact。
 */
export function buildPrompt(messages: readonly ChatMessage[], options: BuildPromptOptions = {}): string {
  if (messages.length === 0) throw promptError("messages 为空");

  const systems: string[] = [];
  const turns: Turn[] = [];
  const callNames = new Map<string, string>();
  for (const message of messages) {
    if (message.role === "system" || message.role === "developer") {
      const text = textOfContent(message.content).trim();
      if (text) systems.push(text);
      continue;
    }
    if (message.role === "user") {
      const text = textOfContent(message.content).trim();
      if (text) turns.push({ role: "user", text });
      continue;
    }
    if (message.role === "assistant") {
      const toolCalls = message.toolCalls ?? [];
      for (const call of toolCalls) {
        if (call.id) callNames.set(call.id, call.name);
      }
      const text = textOfContent(message.content).trim();
      if (text || toolCalls.length > 0) {
        turns.push({
          role: "assistant",
          text,
          ...(toolCalls.length > 0 ? { toolCalls } : {}),
        });
      }
      continue;
    }
    // tool 结果是客户端提交的原始输出：不 trim、不改写，空格和换行都原样保留。
    const toolCallId = message.toolCallId;
    const name = (toolCallId ? callNames.get(toolCallId) : undefined) ?? message.name ?? "tool";
    turns.push({
      role: "tool",
      text: textOfContent(message.content),
      name,
      ...(toolCallId ? { toolCallId } : {}),
    });
  }

  if (turns.length === 0) throw promptError("messages 里没有 user/assistant 内容");

  const toolInstruction = options.toolInstruction ?? "";
  if (turns.length === 1 && turns[0]?.role === "user") {
    const only = turns[0].text;
    let text = systems.length > 0
      ? `<system>\n${systems.join("\n\n")}\n</system>\n\n<user>\n${only}\n</user>`
      : only;
    if (toolInstruction.length > 0) text += `\n\n${toolInstruction}`;
    return text;
  }

  const blocks: string[] = [];
  if (systems.length > 0) blocks.push(`<system>\n${systems.join("\n\n")}\n</system>`);
  blocks.push("<conversation>");
  for (const turn of turns) blocks.push(renderTurn(turn));
  blocks.push("</conversation>");
  const last = turns[turns.length - 1];
  blocks.push(
    last?.role === "assistant"
      ? "Continue the last assistant message."
      : last?.role === "tool"
        ? "Continue using the tool result above."
        : "Reply to the last user message.",
  );
  if (toolInstruction.length > 0) blocks.push(toolInstruction);

  return blocks.join("\n\n");
}

function renderTurn(turn: Turn): string {
  if (turn.role === "tool") {
    return `<tool_result id=${attr(turn.toolCallId)} name=${attr(turn.name ?? "tool")}>\n${turn.text}\n</tool_result>`;
  }
  if (turn.role === "assistant" && turn.toolCalls && turn.toolCalls.length > 0) {
    const body: string[] = [];
    if (turn.text) body.push(turn.text);
    for (const call of turn.toolCalls) {
      body.push(`<tool_call id=${attr(call.id)} name=${attr(call.name)}>\n${call.arguments}\n</tool_call>`);
    }
    return `<assistant>\n${body.join("\n")}\n</assistant>`;
  }
  return `<${turn.role}>\n${turn.text}\n</${turn.role}>`;
}

function attr(value: string | undefined): string {
  return JSON.stringify(value ?? "");
}

function promptError(message: string): CapyError {
  return new CapyError("invalid_request", message);
}
