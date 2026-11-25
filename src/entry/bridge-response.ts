import type { ChatEvent, ChatRequest, ToolCall, ToolDefinition } from '../domain/chat.ts';
import { CapyError } from '../domain/errors.ts';
import type { ToolBridgePort } from '../ports/tool-bridge.ts';
import { encodeChatStream, encodeCompletion, encodeToolCallCompletion, encodeToolCallStream, collectReply, textEvents, type ChunkMeta } from '../protocol/openai.ts';
import { drainInvocations, mapInvocationToToolCall } from '../application/capture.ts';

type ClarificationReason = 'existing_call' | 'uncommitted' | 'reflected_ask' | 'reflected_done';
export interface BridgeOutcome {
  readonly clarification?: ClarificationReason;
  readonly committed: boolean;
  readonly internalTools: boolean;
  readonly calls: number;
}

/**
 * 完成反思：当 Capy 准备 stop、却没有工具调用时，让模型再确认一次
 * “是否真的完成”，而不是靠正则猜它是不是在向用户提问。
 * 返回 ask_user_question 调用表示还没完成、需要用户信息；null 表示确认完成或无法确认。
 */
export type CompletionReflection = (
  request: ChatRequest,
  replyText: string,
) => Promise<Omit<ToolCall, 'id'> | null>;

/**
 * 客户端工具桥。
 *
 * 两条来源，优先级：
 * 1. 模型主动输出 <TOOL_CALL> / JSON 包 / <CMD> —— 转成 DSH 调用。
 * 2. 模型在内部通过 Machine RPC 发起过 bash/read/write/edit 调用（按 jamId 截获并即时短路或排空）——转成 DSH 调用。
 *
 * 只有 committed transcript 才允许产出调用，避免用实时预览伪造。
 */
export async function bridgeResponse(
  request: ChatRequest,
  events: AsyncIterable<ChatEvent>,
  meta: ChunkMeta,
  bridge: ToolBridgePort,
  nextId: () => string,
  onOutcome?: (outcome: BridgeOutcome) => void,
  getJamId?: () => string,
  reflectCompletion?: CompletionReflection,
): Promise<Response> {
  const reply = await collectReply(events);
  const tools = request.tools ?? [];
  const parsed = reply.committed ? bridge.parse(reply.text, tools, request.toolChoice) : null;

  // 无论是否命中文本协议，committed 后都排空该 jam 的缓冲，避免残留到后续请求。
  const fromBuffer = reply.committed ? capturedCalls(tools, request.toolChoice, getJamId?.()) : null;
  const fromCapture = !parsed && reply.committed
    ? (reply.capturedCalls && reply.capturedCalls.length > 0 ? [...reply.capturedCalls] : fromBuffer)
    : null;
  let calls = parsed?.calls ?? fromCapture;
  const questionTool = tools.find(t => t.function.name === 'ask_user_question');
  const alreadyAsked = request.messages.some(m =>
    (m.role === 'assistant' && m.toolCalls?.some(c => c.name === 'ask_user_question')) ||
    (m.role === 'tool' && m.name === 'ask_user_question'));
  let clarification: ClarificationReason | undefined;
  if (questionTool) {
    if (calls?.length) clarification = 'existing_call';
    else if (!reply.committed) clarification = 'uncommitted';
    else if (alreadyAsked) clarification = 'existing_call';
    else if (reflectCompletion) {
      // 首选：让模型做一次强制结构化的完成反思，不猜措辞。
      const reflected = await reflectCompletion(request, reply.text).catch(() => null);
      if (reflected) {
        calls = [reflected];
        clarification = 'reflected_ask';
      } else {
        clarification = 'reflected_done';
      }
    }
  }
  onOutcome?.({ committed: reply.committed, internalTools: reply.internalTools, calls: calls?.length ?? 0, ...(clarification ? {clarification} : {}) });

  if (calls && calls.length > 0) {
    const out = calls.map(call => ({ ...call, id: nextId() }));
    return request.stream ? encodeToolCallStream(meta, out) : encodeToolCallCompletion(meta, out);
  }
  if (request.toolChoice === 'required' || typeof request.toolChoice === 'object') {
    throw new CapyError('upstream_error', reply.committed
      ? (reply.internalTools
        ? '上游 agent 用了自己的内部工具，没有返回可转交的 <CMD> 或 Machine RPC 命令'
        : '模型未返回满足 tool_choice 的 <CMD> 调用')
      : '上游没有提交完整回复，不能从中提取调用');
  }
  return request.stream ? encodeChatStream(textEvents(reply.text), meta) : encodeCompletion(meta.id, meta.model, meta.created, reply.text);
}

/** 把捕获到的 Machine RPC 调用按 schema 与 tool_choice 映射为 DSH 工具调用。 */
function capturedCalls(
  tools: readonly ToolDefinition[],
  toolChoice: unknown,
  jamId?: string,
): Omit<ToolCall, 'id'>[] | null {
  const drained = drainInvocations(jamId || undefined);
  if (drained.length === 0) return null;
  const calls: Omit<ToolCall, 'id'>[] = [];
  for (const inv of drained) {
    const mapped = mapInvocationToToolCall(inv, tools, toolChoice);
    if (mapped) calls.push(mapped);
  }
  return calls.length > 0 ? calls : null;
}
