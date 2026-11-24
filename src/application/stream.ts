import type { ChatEvent } from "../domain/chat.ts";
import { mapCapyCode } from "../domain/errors.ts";
import type { SseFrame } from "../protocol/sse.ts";

interface AssistantPayload {
  readonly callId?: unknown;
  readonly text?: unknown;
}

interface TranscriptPayload {
  readonly source?: unknown;
  readonly text?: unknown;
  readonly callId?: unknown;
}

interface ErrorPayload {
  readonly code?: unknown;
  readonly message?: unknown;
}

/**
 * Capy Public SSE → ChatEvent。
 *
 * - assistant 帧：按 callId 累积；若服务端一次给全文，用前缀去重。
 * - transcript(source=assistant)：最终文本校正。
 * - error：映射成 CapyError。
 * - done/run end：由 finish() 产出 final + done。
 */
export class PublicSseNormalizer {
  private readonly partial = new Map<string, string>();
  private finalText = "";
  private lastText = "";
  private sawDelta = false;
  private hasFinal = false;
  // 上游 agent 只要走过自己的工具通道，就记一笔：它是“模型可能在内部执行”的唯一可信信号。
  private internalTools = false;
  private errored = false;
  private finished = false;

  push(frame: SseFrame): ChatEvent[] {
    if (this.errored || this.finished) return [];
    switch (frame.event) {
      case "assistant":
        return this.onAssistant(parseJson<AssistantPayload>(frame.data));
      case "tool_call":
        this.internalTools = true;
        return [];
      case "transcript":
        return this.onTranscript(parseJson<TranscriptPayload>(frame.data));
      case "error":
        return this.onError(parseJson<ErrorPayload>(frame.data));
      case "done":
        this.finished = true;
        return [];
      default:
        // status / heartbeat / turn / run / retry 等不进事件流。
        return [];
    }
  }

  finish(): ChatEvent[] {
    if (this.errored) return [];
    const events: ChatEvent[] = [];
    const text = this.hasFinal ? this.finalText : this.lastText;
    if (text) {
      events.push({
        type: "final",
        text,
        committed: this.hasFinal,
        ...(this.internalTools ? { internalTools: true } : {}),
      });
    }
    events.push({ type: "done" });
    this.finished = true;
    return events;
  }

  get text(): string {
    return this.hasFinal ? this.finalText : this.lastText;
  }

  get usedInternalTools(): boolean {
    return this.internalTools;
  }

  get hasError(): boolean {
    return this.errored;
  }

  private onAssistant(payload: AssistantPayload | null): ChatEvent[] {
    if (!payload) return [];
    const callId = typeof payload.callId === "string" ? payload.callId : "";
    const piece = typeof payload.text === "string" ? payload.text : "";
    if (!callId || !piece) return [];

    const previous = this.partial.get(callId) ?? "";
    const grows = piece.startsWith(previous);
    const next = grows ? piece : previous + piece;
    const delta = grows ? piece.slice(previous.length) : piece;
    this.partial.set(callId, next);
    this.lastText = next;
    if (!delta) return [];
    this.sawDelta = true;
    return [{ type: "delta", text: delta }];
  }

  private onTranscript(payload: TranscriptPayload | null): ChatEvent[] {
    if (!payload) return [];
    // 已提交的 tool 记录同样说明上游 agent 走过内部工具（哪怕最后给的是正文）。
    if (payload.source === "tool") this.internalTools = true;
    if (payload.source !== "assistant") return [];
    // 只有 transcript 是已提交记录；turn dropped/中断时 live 片段不可作为调用依据。
    this.hasFinal = true;
    const text = typeof payload.text === "string" ? payload.text : "";
    if (!text) return [];
    const previous = this.lastText;
    this.finalText = text;
    this.lastText = text;

    if (!this.sawDelta) {
      this.sawDelta = true;
      return [{ type: "delta", text }];
    }
    if (previous && text.startsWith(previous) && text.length > previous.length) {
      return [{ type: "delta", text: text.slice(previous.length) }];
    }
    return [];
  }

  private onError(payload: ErrorPayload | null): ChatEvent[] {
    const code = typeof payload?.code === "string" ? payload.code : "";
    const message = typeof payload?.message === "string" && payload.message
      ? payload.message
      : "Capy 原生流返回错误";
    this.errored = true;
    return [{ type: "error", error: mapCapyCode(code, message) }];
  }
}


function parseJson<T>(value: string): T | null {
  if (!value) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    return parsed && typeof parsed === "object" ? (parsed as T) : null;
  } catch {
    return null;
  }
}
