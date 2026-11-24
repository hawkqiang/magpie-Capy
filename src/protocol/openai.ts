import type {
  ChatMessage,
  ChatRequest,
  ContentPart,
  ToolCall,
  ToolDefinition,
} from "../domain/chat.ts";
import { CapyError, toOpenAiError } from "../domain/errors.ts";
import type { ChatEvent, ChatFinalEvent } from "../domain/chat.ts";

export function parseChatRequest(body: unknown): ChatRequest {
  if (!isRecord(body)) throw invalid("请求体必须是 JSON 对象");
  const messagesRaw = body.messages;
  if (!Array.isArray(messagesRaw) || messagesRaw.length === 0) throw invalid("messages 为空");
  const messages = messagesRaw.map(parseMessage);

  const model = typeof body.model === "string" ? body.model.trim() : "";
  if (!model) throw invalid("缺少 model");

  const reasoning = isRecord(body.reasoning) ? body.reasoning : {};
  const reasoningEffort = typeof body.reasoning_effort === "string"
    ? body.reasoning_effort
    : typeof reasoning.effort === "string"
      ? reasoning.effort
      : undefined;

  if (body.tools !== undefined && body.tools !== null && !Array.isArray(body.tools)) throw invalid("tools 必须为数组");
  const tools = Array.isArray(body.tools) ? body.tools.map(parseTool) : undefined;
  const names = new Set(tools?.map(t => t.function.name));
  if (names.size !== (tools?.length ?? 0)) throw invalid("工具名重复");
  // OpenAI 客户端常把未设置的字段序列化成 null；按“未提供”处理，不误判为非法 choice。
  const choice = body.tool_choice === null ? undefined : body.tool_choice;
  if (choice !== undefined && choice !== "auto" && choice !== "none") {
    if (choice === "required" ? !names.size : !(isRecord(choice) && choice.type === "function" && isRecord(choice.function) && typeof choice.function.name === "string" && names.has(choice.function.name))) throw invalid("tool_choice 无效或没有匹配的工具");
  }
  return {
    model,
    messages,
    stream: body.stream === true,
    ...(reasoningEffort ? { reasoningEffort } : {}),
    ...(tools ? { tools } : {}),
    ...(choice === undefined ? {} : { toolChoice: choice }),
  };
}

function parseMessage(value: unknown): ChatMessage {
  if (!isRecord(value)) throw invalid("messages 里有非对象项");
  const role = value.role;
  if (role !== "system" && role !== "developer" && role !== "user" && role !== "assistant" && role !== "tool") {
    throw invalid(`不支持的 role: ${String(role)}`);
  }
  const content = parseContent(value.content);
  const toolCalls = parseToolCalls(value.tool_calls);
  return {
    role,
    content,
    ...(typeof value.name === "string" ? { name: value.name } : {}),
    ...(typeof value.tool_call_id === "string" ? { toolCallId: value.tool_call_id } : {}),
    ...(toolCalls ? { toolCalls } : {}),
  };
}

function parseToolCalls(value: unknown): ToolCall[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const calls: ToolCall[] = [];
  for (const item of value) {
    if (!isRecord(item)) continue;
    const fn = isRecord(item.function) ? item.function : item;
    const id = typeof item.id === "string" ? item.id.trim() : "";
    const name = typeof fn.name === "string" ? fn.name.trim() : "";
    if (!id || !name) continue;
    const args = fn.arguments;
    const argsText = typeof args === "string"
      ? args
      : args === undefined
        ? "{}"
        : JSON.stringify(args);
    calls.push({ id, name, arguments: argsText });
  }
  return calls.length > 0 ? calls : undefined;
}

function parseContent(value: unknown): string | ContentPart[] {
  if (typeof value === "string") return value;
  if (!Array.isArray(value)) return "";
  return value.map((part): ContentPart => {
    if (!isRecord(part)) throw invalid("content part 必须是对象");
    const type = part.type;
    if (type === "text" || type === "input_text" || type === "output_text") {
      return { type, text: typeof part.text === "string" ? part.text : "" };
    }
    if (type === "image_url" || type === "input_image" || type === "image") {
      const raw = part.image_url;
      const url = typeof raw === "string"
        ? raw
        : isRecord(raw) && typeof raw.url === "string"
          ? raw.url
          : typeof part.url === "string"
            ? part.url
            : "";
      if (!url) throw invalid("image_url 缺少 url");
      return {
        type,
        url,
        ...(typeof part.name === "string" ? { name: part.name } : {}),
        ...(typeof part.media_type === "string" ? { mediaType: part.media_type } : {}),
      };
    }
    if (type === "file" || type === "input_file") {
      const file = isRecord(part.file) ? part.file : part;
      const name = typeof file.filename === "string"
        ? file.filename
        : typeof file.name === "string"
          ? file.name
          : undefined;
      const data = typeof file.file_data === "string"
        ? file.file_data
        : typeof file.data === "string"
          ? file.data
          : undefined;
      const url = typeof file.url === "string" ? file.url : undefined;
      return {
        type,
        ...(name ? { name } : {}),
        ...(typeof file.media_type === "string" ? { mediaType: file.media_type } : {}),
        ...(data ? { data } : {}),
        ...(url ? { url } : {}),
      };
    }
    throw invalid(`不支持的 content type: ${String(type)}`);
  });
}

function parseTool(value: unknown): ToolDefinition {
  if (!isRecord(value) || value.type !== "function" || !isRecord(value.function)) {
    throw invalid("tools 必须是 function 工具");
  }
  const fn = value.function;
  const name = typeof fn.name === "string" ? fn.name.trim() : "";
  if (!name) throw invalid("tool.function.name 为空");
  return {
    type: "function",
    function: {
      name,
      ...(typeof fn.description === "string" ? { description: fn.description } : {}),
      ...(fn.parameters === undefined ? {} : { parameters: fn.parameters }),
    },
  };
}

export interface ChunkMeta {
  readonly id: string;
  readonly model: string;
  readonly created: number;
}

const JSON_HEADERS = { "content-type": "application/json; charset=utf-8" };
const SSE_HEADERS = {
  "content-type": "text/event-stream; charset=utf-8",
  "cache-control": "no-cache",
  connection: "keep-alive",
};
const SSE_DONE = "data: [DONE]\n\n";

function encodeChunk(meta: ChunkMeta, delta: Record<string, unknown>, finishReason: string | null = null): string {
  return `data: ${JSON.stringify({
    id: meta.id,
    object: "chat.completion.chunk",
    created: meta.created,
    model: meta.model,
    choices: [{ index: 0, delta, finish_reason: finishReason }],
  })}\n\n`;
}

export interface ToolCallOut {
  readonly id: string;
  readonly name: string;
  readonly arguments: string;
}

export function encodeToolCallCompletion(
  meta: ChunkMeta,
  calls: readonly ToolCallOut[],
): Response {
  return new Response(JSON.stringify({
    id: meta.id,
    object: "chat.completion",
    created: meta.created,
    model: meta.model,
    choices: [{
      index: 0,
      message: {
        role: "assistant",
        content: null,
        tool_calls: calls.map((call) => ({
          id: call.id,
          type: "function",
          function: { name: call.name, arguments: call.arguments },
        })),
      },
      finish_reason: "tool_calls",
    }],
    // 与普通非流式响应一致：占位，不伪造 token 计数。
    usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
  }), { status: 200, headers: JSON_HEADERS });
}

export function encodeToolCallStream(meta: ChunkMeta, calls: readonly ToolCallOut[]): Response {
  const body = [
    encodeChunk(meta, { role: "assistant", content: null }),
    encodeChunk(meta, {
      tool_calls: calls.map((call, index) => ({
        index,
        id: call.id,
        type: "function",
        function: { name: call.name, arguments: call.arguments },
      })),
    }),
    encodeChunk(meta, {}, "tool_calls"),
    SSE_DONE,
  ].join("");
  return new Response(body, { status: 200, headers: SSE_HEADERS });
}

export function encodeCompletion(id: string, model: string, created: number, text: string): Response {
  return new Response(JSON.stringify({
    id,
    object: "chat.completion",
    created,
    model,
    choices: [{
      index: 0,
      message: { role: "assistant", content: text },
      finish_reason: "stop",
    }],
    usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
  }), { status: 200, headers: JSON_HEADERS });
}

export function encodeErrorResponse(error: unknown): Response {
  const body = toOpenAiError(error);
  return new Response(JSON.stringify(body), {
    status: body.error.status,
    headers: {
      ...JSON_HEADERS,
      ...(body.error.status === 401 ? { "x-magpie-sign-in": "expired" } : {}),
    },
  });
}

function encodeSseError(error: unknown): string {
  return `data: ${JSON.stringify(toOpenAiError(error))}\n\ndata: [DONE]\n\n`;
}


export function encodeModelList(models: readonly { id: string; name: string }[], provider: string): Response {
  return new Response(JSON.stringify({
    object: "list",
    data: models.map((model) => ({
      id: model.id,
      object: "model",
      created: 0,
      owned_by: provider,
      name: model.name,
    })),
  }), { status: 200, headers: JSON_HEADERS });
}

/** 把 ChatEvent 流编码成 OpenAI SSE Response。 */
export function encodeChatStream(
  events: AsyncIterable<ChatEvent>,
  meta: ChunkMeta,
): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const push = (text: string) => controller.enqueue(encoder.encode(text));
      const finish = () => {
        push(encodeChunk(meta, {}, "stop"));
        push(SSE_DONE);
        controller.close();
      };
      push(encodeChunk(meta, { role: "assistant", content: "" }));
      let emitted = false;
      try {
        for await (const event of events) {
          if (event.type === "delta") {
            emitted = true;
            push(encodeChunk(meta, { content: event.text }));
          } else if (event.type === "error") {
            push(encodeSseError(event.error));
            controller.close();
            return;
          } else if (event.type === "final") {
            if (!emitted && event.text) push(encodeChunk(meta, { content: event.text }));
          } else if (event.type === "done") {
            finish();
            return;
          }
        }
        finish();
      } catch (error) {
        push(encodeSseError(error));
        controller.close();
      }
    },
  });
  return new Response(stream, { status: 200, headers: SSE_HEADERS });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function invalid(message: string): CapyError {
  return new CapyError("invalid_request", message);
}

export async function collectText(events: AsyncIterable<ChatEvent>): Promise<string> {
  return (await collectReply(events)).text;
}

export interface Reply {
  readonly text: string;
  /** true 只在 Capy 提交了 assistant transcript 时为真。 */
  readonly committed: boolean;
  /** 上游 agent 用过自己的工具通道；调用方据此区分“模型建议执行”和“真在内部执行过”。 */
  readonly internalTools: boolean;
  /** 方案 B 按 jamId 实时截获的客户端工具调用（若存在）。 */
  readonly capturedCalls?: readonly Omit<ToolCall, "id">[];
}

export async function collectReply(events: AsyncIterable<ChatEvent>): Promise<Reply> {
  let deltas = "";
  let final: ChatFinalEvent | null = null;
  for await (const event of events) {
    if (event.type === "delta") deltas += event.text;
    else if (event.type === "final") final = event;
    else if (event.type === "error") throw event.error;
  }
  return {
    text: final ? (final.committed ? final.text : final.text || deltas) : deltas,
    committed: final?.committed === true,
    internalTools: final?.internalTools === true,
    ...(final?.capturedCalls ? { capturedCalls: final.capturedCalls } : {}),
  };
}

export async function* textEvents(text: string): AsyncIterable<ChatEvent> {
  if (text) yield { type: "delta", text };
  yield { type: "done" };
}
