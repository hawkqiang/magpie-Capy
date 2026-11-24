import type { ChatMessage } from "./chat.ts";

export function textOfContent(content: string | readonly (string | { type: string; text?: string })[]): string {
  if (typeof content === "string") return content;
  const parts: string[] = [];
  for (const part of content) {
    if (typeof part === "string") parts.push(part);
    else if (part && typeof part === "object" && "text" in part && typeof part.text === "string") parts.push(part.text);
  }
  return parts.join("\n");
}

/** 稳定 32 位 FNV-1a；只用于会话指纹，不用于安全。 */
export function stableHash(text: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

/**
 * 会话 key：DSH 每轮请求都带完整历史，首条 user 消息在同一个 DSH 会话里稳定。
 * 去掉 <system-reminder> 噪声，取前 240 字符做指纹；同名会话会串台，这是已知启发式。
 */
export function threadKey(account: string, model: string, messages: readonly ChatMessage[]): string {
  const first = messages.find((message) => message.role === "user");
  const text = first
    ? textOfContent(first.content).replace(/<system-reminder>[\s\S]*?<\/system-reminder>/gu, "").trim().slice(0, 240)
    : "";
  return `${account}|${model}|${stableHash(text)}`;
}

/**
 * 复用线程时只发增量：Capy 线程里已经有它自己生成的 assistant 回复，不能再把
 * DSH 的 assistant(tool_calls) 发回去。取最新的 tool 结果，否则取最新的 user 任务。
 */
export function incrementalPrompt(messages: readonly ChatMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const message = messages[i];
    if (message?.role === "tool") {
      return `TOOL_RESULT（客户端工具的实际输出，可能多轮）：\n${textOfContent(message.content)}`;
    }
    if (message?.role === "user") {
      return `用户任务：${textOfContent(message.content)}`;
    }
  }
  return "";
}
