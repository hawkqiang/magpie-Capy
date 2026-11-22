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
}

export interface BuildPromptOptions {
  /** 由 ToolBridge 生成的工具说明；为空则不加。 */
  readonly toolInstruction?: string;
}

/**
 * OpenAI messages → Capy 单条 message。
 * 单条 user 原样发送；多轮用 <system>/<user>/<assistant> 结构。
 *
 * 不按字符数裁剪：Capy 按 token 预算管理上下文，超出阈值自动 compact。
 */
export function buildPrompt(messages: readonly ChatMessage[], options: BuildPromptOptions = {}): string {
  if (messages.length === 0) throw promptError("messages 为空");

  const systems: string[] = [];
  const turns: Turn[] = [];
  for (const message of messages) {
    const text = textOfContent(message.content).trim();
    if (message.role === "system" || message.role === "developer") {
      if (text) systems.push(text);
      continue;
    }
    if (message.role === "user") {
      if (text) turns.push({ role: "user", text });
      continue;
    }
    if (message.role === "assistant") {
      const tools = (message.toolCalls ?? []).map((call) => call.name).filter(Boolean);
      const suffix = tools.length > 0 ? ` [调用工具: ${tools.join(", ")}]` : "";
      if (text || suffix) turns.push({ role: "assistant", text: `${text}${suffix}`.trim() });
      continue;
    }
    if (message.role === "tool") {
      const name = message.name ?? message.toolCallId ?? "tool";
      turns.push({ role: "tool", name, text: text || "(无输出)" });
    }
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
  for (const turn of turns) {
    if (turn.role === "tool") blocks.push(`<tool name="${turn.name ?? "tool"}">\n${turn.text}\n</tool>`);
    else blocks.push(`<${turn.role}>\n${turn.text}\n</${turn.role}>`);
  }
  blocks.push("</conversation>");
  const last = turns[turns.length - 1];
  blocks.push(last?.role === "assistant" ? "Continue the last assistant message." : "Reply to the last user message.");
  if (toolInstruction.length > 0) blocks.push(toolInstruction);

  return blocks.join("\n\n");
}

function promptError(message: string): CapyError {
  return new CapyError("invalid_request", message);
}
