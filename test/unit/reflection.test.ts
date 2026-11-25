import { expect, test } from 'bun:test';
import { bridgeResponse, type BridgeOutcome } from '../../src/entry/bridge-response.ts';
import { parseChatRequest } from '../../src/protocol/openai.ts';
import { PromptToolBridge } from '../../src/application/tools.ts';
import { reflectionPrompt, reflectionTools, REFLECT_ASK, REFLECT_DONE } from '../../src/application/reflection.ts';
import type { ChatRequest } from '../../src/domain/chat.ts';

const askSchema = { type: 'object', properties: { questions: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, question: { type: 'string' } }, required: ['id', 'question'] } } }, required: ['questions'] };
const req = parseChatRequest({
  model: 'm',
  messages: [{ role: 'user', content: '帮我修复 codex 模型被打断的问题' }],
  tools: [{ type: 'function', function: { name: REFLECT_ASK, parameters: askSchema } }],
  tool_choice: 'auto',
});
const reply = '我需要你告诉我源码路径才能动手。';

async function run(reflect: (r: ChatRequest, t: string) => Promise<{ name: string; arguments: string } | null>) {
  let outcome: BridgeOutcome | undefined;
  const res = await bridgeResponse(req, (async function* () { yield { type: 'final' as const, text: reply, committed: true }; })(),
    { id: 'x', created: 1, model: 'm' }, new PromptToolBridge(), () => 'new', o => { outcome = o }, () => 'jam', reflect);
  return { choice: (await res.json()).choices[0], outcome };
}

test('reflection asks the user when the model is blocked', async () => {
  const r = await run(async () => ({ name: REFLECT_ASK, arguments: JSON.stringify({ questions: [{ id: 'q', question: '源码在哪？' }] }) }));
  expect(r.choice.finish_reason).toBe('tool_calls');
  expect(r.choice.message.tool_calls[0].function.name).toBe(REFLECT_ASK);
  expect(r.outcome?.clarification).toBe('reflected_ask');
});

test('reflection confirms completion and stops normally', async () => {
  const r = await run(async () => null);
  expect(r.choice.finish_reason).toBe('stop');
  expect(r.outcome?.clarification).toBe('reflected_done');
});

test('reflection failure falls back to stop without a fake prompt', async () => {
  const r = await run(async () => { throw new Error('network'); });
  expect(r.choice.finish_reason).toBe('stop');
});

test('reflection prompt carries original request and reply; tools are a strict binary choice', () => {
  const p = reflectionPrompt(req, reply);
  expect(p).toContain('帮我修复 codex 模型被打断的问题');
  expect(p).toContain(reply);
  const names = reflectionTools().map(t => t.function.name);
  expect(names).toEqual([REFLECT_ASK, REFLECT_DONE]);
});
