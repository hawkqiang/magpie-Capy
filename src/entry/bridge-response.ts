import type { ChatEvent, ChatRequest, ToolCall, ToolDefinition } from '../domain/chat.ts';
import { CapyError } from '../domain/errors.ts';
import type { ToolBridgePort } from '../ports/tool-bridge.ts';
import { encodeChatStream, encodeCompletion, encodeToolCallCompletion, encodeToolCallStream, collectReply, textEvents, type ChunkMeta } from '../protocol/openai.ts';
import { drainInvocations, mapInvocationToToolCall } from '../application/capture.ts';

type ClarificationReason = 'adapted' | 'existing_call' | 'uncommitted' | 'choice_excluded' | 'no_intent' | 'already_asked' | 'not_question' | 'unsupported_schema';
export interface BridgeOutcome {
  readonly clarification?: ClarificationReason;
  readonly committed: boolean;
  readonly internalTools: boolean;
  readonly calls: number;
}

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
  let clarification: ClarificationReason | undefined;
  if (questionTool) {
    if (calls?.length) clarification = 'existing_call';
    else if (!reply.committed) clarification = 'uncommitted';
    else {
      const result = recoverQuestion(request, reply.text, questionTool);
      clarification = result.reason;
      if (result.call) calls = [result.call];
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

// Fail closed on JSON Schema features outside this small structural subset.
// Unknown optional properties need not be validated: the adapter never emits them.
function fits(value: unknown, node: unknown): boolean {
  if (!node || typeof node !== 'object' || Array.isArray(node)) return false;
  const s = node as Record<string,unknown>;
  const common = ['type','description','title','default','$schema'];
  const extras = s.type === 'object' ? ['properties','required','additionalProperties'] : s.type === 'array' ? ['items','minItems','maxItems'] : ['minLength','maxLength'];
  if (Object.keys(s).some(k => ![...common,...extras].includes(k))) return false;
  if (s.type === 'object' && value && typeof value === 'object' && !Array.isArray(value)) {
    if (s.additionalProperties !== undefined && typeof s.additionalProperties !== 'boolean') return false;
    if (s.required !== undefined && (!Array.isArray(s.required) || !s.required.every(k => typeof k === 'string' && Object.hasOwn(value,k)))) return false;
    const props = s.properties as Record<string,unknown> | undefined;
    return !!props && Object.entries(value).every(([k,v]) => Object.hasOwn(props,k) && fits(v,props[k]));
  }
  if (s.type === 'array' && Array.isArray(value)) return bounds(value.length,s.minItems,s.maxItems) && value.every(v=>fits(v,s.items));
  return s.type === 'string' && typeof value === 'string' && bounds([...value].length,s.minLength,s.maxLength);
}
function bounds(n:number,min:unknown,max:unknown):boolean {
  return (min === undefined || typeof min === 'number' && n >= min) && (max === undefined || typeof max === 'number' && n <= max);
}
function recoverQuestion(request:ChatRequest,text:string,tool:ToolDefinition): {reason:ClarificationReason; call?: Omit<ToolCall,'id'>} {
  const choice = request.toolChoice, name = 'ask_user_question';
  const named = (choice as {function?:{name?:unknown}} | null)?.function?.name;
  if (choice != null && choice !== 'auto' && choice !== 'required' && named !== name) return {reason:'choice_excluded'};
  let idx = -1, intent = '';
  for (let i=request.messages.length-1;i>=0;i--) {
    const msg=request.messages[i];
    if (msg?.role !== 'user') continue;
    const c=msg.content;
    const raw = (typeof c === 'string' ? c : c?.flatMap(p=>'text' in p ? [p.text] : []).join('\n'))?.trim() ?? '';
    if (/^<system-reminder>[\s\S]*?<\/system-reminder>$/u.test(raw) || /^Time sampled while preparing turn \d+, step \d+:/u.test(raw)) continue;
    idx=i; intent=raw; break;
  }
  const intentClean=intent.replace(/不要猜|do not guess|don't guess/giu,'');
  if (idx<0 || /(?:不要|别|不再|无需|跳过|拒绝|skip|declin|don't|do not|never|instead of|example|quote|示例|引用|```|^>)/imu.test(intentClean)) return {reason:'no_intent'};
  const namedTool=/(?:^|[，。；：,;:\n]|\bthen\s+)(?:\s*(?:然后|请|必须|再|please\s+|must\s+|then\s+))*(?:调用|使用|call\s+|use\s+)\s*`?ask_user_question\b/iu.test(intentClean);
  const workRequest=/(?:修复|排查|定位|检查|看下|看一下|查一下|解决|处理|能否|能不能|可以.{0,4}(?:修|查|看)|fix|debug|investigate|look\s+into|diagnose|can\s+you\s+(?:fix|check|look))/iu.test(intentClean);
  if (!namedTool && !workRequest) return {reason:'no_intent'};
  if (request.messages.slice(idx+1).some(m=>m.role==='assistant' && m.toolCalls?.some(c=>c.name===name) || m.role==='tool' && m.name===name)) return {reason:'already_asked'};
  // Only copy an existing question. Do not interpret tool output as a request, invent
  // an answer or turn an approval challenge into a question-tool permission grant.
  if (text.length>2048 || /```|<\/?(?:tool|cmd)|审批|批准|授权|权限|许可|确认执行|approval|approv|permission|authorize|password|密码|secret|密钥|token|credential/iu.test(text)) return {reason:'not_question'};
  if (/(?:^|\n)\s*>|(?:says|example|示例|引用|输出)\s*[:：]/iu.test(text)) return {reason:'not_question'};
  // A work request only becomes a question when the reply is blocked: it says it cannot
  // proceed without the user, or asks for specific missing input. Ordinary answers that
  // merely contain a question mark must not be converted into a UI prompt.
  const blocked=/can't|cannot|can not|unable to|won't be able|before i can|blocked|stuck|need (?:one|two|a few|more) (?:thing|things|piece|information|detail)|需要(?:你|您)(?:提供|告诉|确认|回答)|无法(?:继续|确定|判断|修复|定位)|才能(?:继续|修复|确定|判断)|缺少|不确定/iu.test(text);
  if (!namedTool && !blocked) return {reason:'not_question'};
  const clean=text.replace(/`[^`]*`/gu,'').replace(/（[^）]*）/gu,'').replace(/\s+/gu,' ').trim();
  const parts=clean.split(/(?<=[。！？.!?])\s*|\n+|[—–]+|\s+and\s+(?=now need\b)|[，,；;]\s*/iu).map(p=>p.trim()).filter(Boolean);
  const trigger=/请(?:你)?(?:先|直接)?(?:告诉我|告知|提供|输入)|需要你(?:先|直接)?(?:告诉我|告知|确认|提供)|(?:I\s+)?(?:now\s+)?need\s+(?:your|the)\b|(?:please\s+)?(?:tell me|provide|choose|which|what|could you tell me|can you provide)\b/iu;
  const precise=parts.flatMap(p => {
    const at=p.match(trigger)?.index;
    return at!==undefined ? [p.slice(at)] : (/[？?]$/u.test(p) ? [p] : []);
  });
  // Fallback: when phrasing varies, ask with the model's own request text rather than
  // ending the run. Only when it clearly asks the user, never a summary or approval.
  const asksUser=/请|需要你|我需要|告知|告诉|提供|确认|输入|选择|请问|哪|什么|是否|\?|？|\bneed\b|\btell me\b|\bprovide\b|\bwhich\b|\bwhat\b|\bcould you\b|\bcan you\b/iu.test(clean);
  const question = precise.length===1 ? precise[0]! : (precise.length===0 && asksUser ? clean : undefined);
  if (!question || !question.trim() || /[<>`"“”]/u.test(question)) return {reason:'not_question'};
  const args={questions:[{id:'clarify',question}]};
  if (!fits(args,tool.function.parameters)) return {reason:'unsupported_schema'};
  return {reason:'adapted',call:{name,arguments:JSON.stringify(args)}};
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
