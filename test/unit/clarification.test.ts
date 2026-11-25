import { expect, test } from 'bun:test';
import { bridgeResponse, type BridgeOutcome } from '../../src/entry/bridge-response.ts';
import { parseChatRequest } from '../../src/protocol/openai.ts';
import { PromptToolBridge } from '../../src/application/tools.ts';

const schema = { type: 'object', properties: { questions: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, question: { type: 'string' } }, required: ['id', 'question'] } } }, required: ['questions'] };
const name = 'ask_user_question';
const askArgs = JSON.stringify({ questions: [{ id: 'q', question: '源码在哪？' }] });
const reflectAsk = async () => ({ name, arguments: askArgs });

async function probe(messages: unknown[], opts: {
  text?: string;
  committed?: boolean;
  reflect?: (r: any, t: string) => Promise<{ name: string; arguments: string } | null>;
  withTool?: boolean;
  choice?: unknown;
} = {}) {
  const tools = opts.withTool === false ? undefined : [{ type: 'function', function: { name, parameters: schema } }];
  const req = parseChatRequest({ model: 'm', messages, tools, tool_choice: opts.choice ?? 'auto' });
  let outcome: BridgeOutcome | undefined;
  const res = await bridgeResponse(
    req,
    (async function* () { yield { type: 'final' as const, text: opts.text ?? '我需要你告诉我源码路径。', committed: opts.committed ?? true }; })(),
    { id: 'x', created: 1, model: 'm' },
    new PromptToolBridge(),
    () => 'new',
    o => { outcome = o },
    () => 'jam_test',
    (opts.reflect === undefined ? reflectAsk : opts.reflect) ?? undefined,
  );
  return { choice: (await res.json()).choices[0], outcome };
}

test('reflected ask opens the question UI with a fresh call id', async () => {
  const r = await probe([{ role: 'user', content: '帮我修复 codex 被打断的问题' }]);
  expect(r.choice.finish_reason).toBe('tool_calls');
  expect(r.choice.message.tool_calls[0].function.name).toBe(name);
  expect(JSON.parse(r.choice.message.tool_calls[0].function.arguments)).toEqual({ questions: [{ id: 'q', question: '源码在哪？' }] });
  expect(r.outcome?.clarification).toBe('reflected_ask');
});

test('reflected done stops normally; uncommitted and no-tool never reflect', async () => {
  expect((await probe([{ role: 'user', content: '修复问题' }], { reflect: async () => null })).choice.finish_reason).toBe('stop');
  expect((await probe([{ role: 'user', content: '修复问题' }], { committed: false })).outcome?.clarification).toBe('uncommitted');
  expect((await probe([{ role: 'user', content: '修复问题' }], { withTool: false })).choice.finish_reason).toBe('stop');
});

test('reflection is not invoked when a tool call already exists', async () => {
  const prior = { role: 'assistant', content: null, tool_calls: [{ type: 'function', id: 'c0', function: { name, arguments: '{}' } }] };
  let called = false;
  const r = await probe([{ role: 'user', content: '修复问题' }, prior], {
    reflect: async () => { called = true; return null },
  });
  expect(called).toBe(false);
  expect(r.outcome?.clarification).toBe('existing_call');
});

test('a reflection failure fails closed to stop, never a fabricated prompt', async () => {
  const r = await probe([{ role: 'user', content: '修复问题' }], {
    reflect: async () => { throw new Error('network down') },
  });
  expect(r.choice.finish_reason).toBe('stop');
  expect(r.choice.message.tool_calls).toBeUndefined();
});
